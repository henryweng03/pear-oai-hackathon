import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import { useRouter } from "expo-router";
import { Flag, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Text, View, SafeAreaView } from "react-native";

export type ConversationState =
  | "user_speaking"
  | "ai_processing"
  | "ai_responding";

export default function PostSessionScreen() {
  const router = useRouter();

  const greeting = "Great work, Henry! 🚀";

  const paragraphs = [
    "You're really tackling that procrastination head-on.",
    "I was impressed by how you challenged your 'I work better under pressure' belief.",
    "Looking forward to hearing about your productivity wins next week.",
  ];

  return (
    <SafeAreaView className="bg-white">
      <View className="w-full px-6 h-full justify-between">
        <View>
          <View className="flex flex-row-reverse">
            <IconButton
              onPress={() => {
                router.replace("/");
              }}
              variant="secondary"
            >
              <X size={20} className="text-primary-700" />
            </IconButton>
          </View>
          <Text className="text-3xl font-onest text-center font-medium mt-8">
            {greeting}
          </Text>
          <View className="space-y-10 mt-14 px-2">
            {paragraphs.map((paragraph, index) => (
              <Text
                key={index}
                className="text-2xl text-primary-900 text-center"
              >
                {paragraph}
              </Text>
            ))}
          </View>
        </View>
        <Button size="fat" onPress={() => router.replace("/")}>
          Return Home
        </Button>
      </View>
    </SafeAreaView>
  );
}
