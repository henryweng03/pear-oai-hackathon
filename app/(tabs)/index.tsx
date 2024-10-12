import React, { useCallback } from "react";
import { Text, View, SafeAreaView, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import { cn } from "@/lib/utils";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

const LetsChatButton = ({ onPress }: { onPress: () => void }) => {
  const isPressed = useSharedValue(false);

  const anmatedRingStyles = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(
        isPressed.value ? Colors.primary[200] : Colors.primary[100],
        {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }
      ),
    };
  });

  const animatedPlusStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isPressed.value ? Colors.primary[700] : Colors.primary[800],
        {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }
      ),
    };
  });

  const animatedTextStyles = useAnimatedStyle(() => {
    return {
      color: withTiming(
        isPressed.value ? Colors.primary[700] : Colors.primary[800],
        {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }
      ),
    };
  });

  const handlePressIn = useCallback(() => {
    isPressed.value = true;
  }, []);

  const handlePressOut = useCallback(() => {
    isPressed.value = false;
  }, []);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={anmatedRingStyles}
      className={cn(
        "border-[24px] w-[300px] h-[300px] rounded-full flex items-center justify-center space-y-2"
      )}
    >
      <AnimatedView style={animatedPlusStyles} className="p-2 rounded-full">
        <Plus size={32} color={Colors.primary[50]} />
      </AnimatedView>
      <AnimatedText style={animatedTextStyles} className="font-onest text-xl">
        Start session
      </AnimatedText>
    </AnimatedPressable>
  );
};

export default function HomeScreen() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12 && hour > 4) return "morning";
    if (hour < 18 && hour > 12) return "afternoon";
    return "evening";
  };

  return (
    <SafeAreaView className="bg-white">
      <View className="h-full w-full justify-center">
        <View className="flex items-center px-8 pb-2">
          <Text className="text-primary-950 text-3xl font-onest text-center font-medium pb-12">
            How are you feeling this {getGreeting()}?
          </Text>
          <LetsChatButton
            onPress={() => {
              router.replace("/session");
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
