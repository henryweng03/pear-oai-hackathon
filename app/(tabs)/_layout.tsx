import { Stack, useRouter } from "expo-router";
import React from "react";

export default function TabLayout() {
  const router = useRouter();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
