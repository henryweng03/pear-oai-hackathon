import IconButton from "@/components/IconButton";
import VoiceConversationActionButton from "@/components/VoiceConversationActionButton";
import useStreamAudioRecording from "@/hooks/useAudioStreamRecording";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { Flag, X } from "lucide-react-native";
import { useCallback, useEffect, useState, useRef } from "react";
import { Text, View, SafeAreaView } from "react-native";
import { useAudioResponsePlayer } from "@/hooks/useAudioResponsePlayer";

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

// Utility function to convert Base64-encoded audio to a file and play it
const playBase64Audio = async (base64Audio: string) => {
  try {
    // Create a temporary file path
    const filePath = `${FileSystem.cacheDirectory}temp_audio.wav`;

    // Write the Base64 audio to the file
    await FileSystem.writeAsStringAsync(filePath, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Play the audio file using the Audio API
    const { sound } = await Audio.Sound.createAsync(
      { uri: filePath },
      { shouldPlay: true }
    );

    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync(); // Unload the sound after it's finished
        FileSystem.deleteAsync(filePath); // Clean up the file
      }
    });
  } catch (error) {
    console.error('Error playing audio chunk:', error);
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
  
  // Set up audio player events (callbacks)
  const audioEvents = {
    onPlaybackStarted: () => console.log("Playback started"),
    onPlaybackEnded: () => console.log("Playback ended"),
    onPlaybackError: (error: Error) => console.error("Playback error", error),
  };

  const { enqueueAudioChunk, stopAudio } = useAudioResponsePlayer(audioEvents);

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
            enqueueAudioChunk(base64Audio); // Play the audio directly
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
                  turn_detection: null,
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

  const commitAudioToServer = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Send the commit message
      const commitEvent = {
        type: 'input_audio_buffer.commit',
      };
      wsRef.current.send(JSON.stringify(commitEvent));
      console.log("Sent audio commit to server.");

      // After committing, trigger the response
      const responseEvent = {
        type: 'response.create',
        response: {
          modalities: ['text', 'audio'],
          instructions: "Please respond with audio and text.",
          voice: 'alloy',
          output_audio_format: 'pcm16',
        }
      };
      wsRef.current.send(JSON.stringify(responseEvent));
      console.log("Sent response request to server.");
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
      commitAudioToServer();
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
