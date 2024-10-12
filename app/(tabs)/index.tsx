import { Text, View, SafeAreaView } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="bg-red-50 h-screen items-center justify-center">
      <View className="flex items-center px-8">
        <Text className="text-green-800 text-3xl font-onest text-center font-medium pb-12">
          What's good.
        </Text>
      </View>
    </SafeAreaView>
  );
}
