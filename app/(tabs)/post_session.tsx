import IconButton from "@/components/IconButton";
import { Flag, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Text, View, SafeAreaView } from "react-native";

export type ConversationState =
  | "user_speaking"
  | "ai_processing"
  | "ai_responding";

export default function PostSessionScreen() {
  const greeting = "Great work, Henry! 🚀";

  const paragraphs = [
    "You're really tackling that procrastination head-on.",
    "I was impressed by how you challenged your 'I work better under pressure' belief.",
    "Looking forward to hearing about your productivity wins next week.",
  ];

  return (
    <SafeAreaView className="bg-white">
      <View className="w-full px-6 h-full">
        <View className="flex flex-row-reverse">
          <IconButton onPress={() => {}} variant="secondary">
            <X size={20} className="text-primary-700" />
          </IconButton>
        </View>
        <Text className="text-3xl font-onest text-center font-medium mt-6">
          {greeting}
        </Text>
        <View className="space-y-6 mt-8">
          {paragraphs.map((paragraph, index) => (
            <Text key={index} className="text-xl text-primary-900 text-center">
              {paragraph}
            </Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
