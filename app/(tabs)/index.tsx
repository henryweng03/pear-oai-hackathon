import IconButton from "@/components/IconButton";
import VoiceConversationActionButton from "@/components/VoiceConversationActionButton";
import useStreamAudioRecording from "@/hooks/useAudioStreamRecording";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { Flag, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Text, View, SafeAreaView } from "react-native";

export type ConversationState =
  | "user_speaking"
  | "ai_processing"
  | "ai_responding";

export default function ConversationScreen() {
  const router = useRouter();
  const [conversationState, setConversationState] =
    useState<ConversationState>("user_speaking");

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

  const sendMessageToServer = useCallback((data: ArrayBuffer) => {
    // @Anthony TODO: Send the data to the server
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
