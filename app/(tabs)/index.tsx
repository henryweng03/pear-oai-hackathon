import VoiceConversationActionButton from "@/components/VoiceConversationActionButton";
import { useCallback, useState } from "react";
import { Text, View, SafeAreaView } from "react-native";

export type ConversationState =
  | "user_speaking"
  | "ai_processing"
  | "ai_responding";

export default function HomeScreen() {
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

  const handleActionButtonPress = useCallback(async () => {
    if (conversationState === "user_speaking") {
      setConversationState("ai_processing");
    } else {
      setConversationState("user_speaking");
    }
  }, [conversationState]);

  return (
    <SafeAreaView className="bg-white">
      <View className="w-full px-8 h-full">
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
