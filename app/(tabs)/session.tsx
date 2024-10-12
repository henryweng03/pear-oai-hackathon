import IconButton from "@/components/IconButton";
import VoiceConversationActionButton from "@/components/VoiceConversationActionButton";
import useStreamAudioRecording from "@/hooks/useAudioStreamRecording";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { Flag, X } from "lucide-react-native";
import { useCallback, useEffect, useState, useRef } from "react";
import { Text, View, SafeAreaView } from "react-native";

// Utility function to encode ArrayBuffer to Base64
const base64EncodeAudio = (arrayBuffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000; // 32KB chunk size
  for (let i = 0; i < bytes.length; i += chunkSize) {
    let chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
};

// Utility function to play Base64-encoded audio directly in React Native
const playBase64Audio = async (base64Audio: string) => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: `data:audio/wav;base64,${base64Audio}` },
      { shouldPlay: true }
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync(); // Unload the sound after it's finished
      }
    });
  } catch (error) {
    console.error("Error playing audio chunk:", error);
  }
};

export type ConversationState =
  | "user_speaking"
  | "ai_processing"
  | "ai_responding";

export default function ConversationScreen() {
  const router = useRouter();
  const [conversationState, setConversationState] =
    useState<ConversationState>("user_speaking");
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioQueueRef = useRef<Audio.Sound[]>([]);
  const currentSoundRef = useRef<Audio.Sound | null>(null);
  const statusRef = useRef<"idle" | "playing">("idle");

  const currentStateText =
    conversationState === "user_speaking"
      ? "Listening..."
      : conversationState === "ai_processing"
      ? "Thinking..."
      : "Speaking...";

  const isUserTurn = conversationState === "user_speaking";
  const actionButtonVariant = isUserTurn ? "send" : "interrupt";

  const onRecordingStatusUpdate = useCallback(
    (status: Audio.RecordingStatus) => {},
    []
  );

  // Connect to WebSocket server and maintain connection
  const connectWebSocket = () => {
    const websocket = new WebSocket("ws://localhost:8081"); // Use your proxy server URL

    websocket.onopen = () => {
      console.log("Connected to WebSocket server.");
      setIsConnected(true);
      wsRef.current = websocket;
    };

    websocket.onmessage = async (event) => {
      const data = event.data;

      if (typeof data === "string") {
        try {
          const response = JSON.parse(data);
          console.log("Received JSON message:", response);

          // Check if the message is an audio delta
          if (response.type === "response.audio.delta") {
            const base64Audio = response.delta;
            console.log("Playing base64 audio delta:", base64Audio);
            await playBase64Audio(base64Audio); // Play the audio directly
          }

          if (response.type === "session.created") {
            // Send the session.update message to configure the session
            const sessionUpdate = {
              type: "session.update",
              session: {
                  modalities: ["text", "audio"],
                  instructions: "Your knowledge cutoff is 2023-10. You are a helpful, witty, and friendly AI.",
                  voice: "alloy",
                  input_audio_format: "pcm16",
                  output_audio_format: "pcm16",
                  input_audio_transcription: {
                      model: "whisper-1",  // Only include the model, remove the 'enabled' field
                  },
                  turn_detection: {
                      type: "server_vad",
                      threshold: 0.5,
                      prefix_padding_ms: 300,
                      silence_duration_ms: 200,
                  },
                  temperature: 0.8,
              },
          };

            websocket.send(JSON.stringify(sessionUpdate)); // Send the session update configuration
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      } else {
        console.log("Unknown message type received:", data);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket closed.");
      setIsConnected(false);
      wsRef.current = null;
    };
  };

  // Function to play audio chunks
  const enqueueAudioChunk = useCallback(
    async (audioUrl: string) => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false }
        );
        audioQueueRef.current.push(sound);
        console.log("Audio chunk added to queue");

        if (statusRef.current === "idle") {
          playNextChunk();
        }
      } catch (error) {
        console.error("Error playing audio chunk:", error);
      }
    },
    []
  );

  const playNextChunk = useCallback(async () => {
    if (audioQueueRef.current.length > 0) {
      statusRef.current = "playing";
      const sound = audioQueueRef.current.shift()!;

      try {
        await sound.playAsync();
        currentSoundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync(); // Unload after playback
            currentSoundRef.current = null;

            if (audioQueueRef.current.length > 0) {
              playNextChunk(); // Play next chunk if available
            } else {
              statusRef.current = "idle"; // Set idle if no more chunks
            }
          }
        });
      } catch (error) {
        console.error("Error playing audio chunk:", error);
        sound.unloadAsync(); // Ensure proper cleanup
        statusRef.current = "idle";
        if (audioQueueRef.current.length > 0) {
          playNextChunk(); // Attempt to play next chunk if error occurred
        }
      }
    } else {
      statusRef.current = "idle"; // Set idle if queue is empty
    }
  }, []);

  const stopAudio = useCallback(async () => {
    statusRef.current = "idle";
    if (currentSoundRef.current) {
      await currentSoundRef.current.stopAsync();
      await currentSoundRef.current.unloadAsync();
      currentSoundRef.current = null;
    }
    // Clear the queue and unload all sounds
    while (audioQueueRef.current.length > 0) {
      const sound = audioQueueRef.current.pop();
      if (sound) await sound.unloadAsync();
    }
  }, []);

  // Stream audio recording setup
  const sendMessageToServer = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const base64Audio = base64EncodeAudio(data);

      // Send append message
      const appendEvent = {
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      };
      wsRef.current.send(JSON.stringify(appendEvent));
      console.log("Sent audio chunk to server:", appendEvent);
    } else {
      console.error("WebSocket is not open.");
    }
  }, []);

  const {
    startStreamingRecording,
    stopStreamingRecording,
    sendRemainingRecordingData,
  } = useStreamAudioRecording({
    onRecordingStatusUpdate,
    streamIntervalMs: 300,
    updateIntervalMs: 24,
    sendMessage: (data: ArrayBuffer) => sendMessageToServer(data), // called every 24 ms
  });

  useEffect(() => {
    if (conversationState === "user_speaking") {
      startStreamingRecording();
    } else {
      sendRemainingRecordingData();
      stopStreamingRecording();
    }
  }, [conversationState]);

  // Handle WebSocket connection
  useEffect(() => {
    connectWebSocket(); // Connect WebSocket when component mounts
    return () => {
      if (wsRef.current) {
        wsRef.current.close(); // Close WebSocket when component unmounts
      }
    };
  }, []);

  const updateConversationState = () => {
    if (conversationState === "user_speaking") {
      setConversationState("ai_processing");
    } else {
      setConversationState("user_speaking");
    }
  };

  const handleActionButtonPress = useCallback(async () => {
    updateConversationState();
  }, [conversationState]);

  return (
    <SafeAreaView className="bg-white">
      <View className="w-full px-6 h-full">
        <View className="flex flex-row justify-between">
          <IconButton onPress={() => {}} variant="secondary">
            <Flag size={20} className="text-primary-700" />
          </IconButton>
          <IconButton
            onPress={() => {
              stopStreamingRecording();
              router.replace("/post_session");
            }}
            variant="secondary"
          >
            <X size={20} className="text-primary-700" />
          </IconButton>
        </View>
        <View className="flex-grow flex flex-col justify-center mt-2">
          <Text className="text-3xl font-onest text-center font-medium">
            {currentStateText}
          </Text>
        </View>

        <VoiceConversationActionButton
          variant={actionButtonVariant}
          onPress={handleActionButtonPress}
        />
      </View>
    </SafeAreaView>
  );
}
