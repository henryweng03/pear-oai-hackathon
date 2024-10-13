import React, { useCallback } from "react";
import { Text, View, SafeAreaView, Pressable, ScrollView } from "react-native";
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
import { styled } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { useButtonTransition } from "@/hooks/useButtonTransition";
import useWebSocket from "@/hooks/useWebSocket";

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

const StyledPressable = styled(Animated.View);
const StyledText = styled(Text);

const SessionPreviewButton = ({
  sessionNumber,
  title,
  formattedDate,
  onPress,
}: {
  sessionNumber: number;
  title: string;
  formattedDate: string;
  onPress?: () => void;
}) => {
  const { animatedStyles, handlePressIn, handlePressOut } = useButtonTransition(
    { default: Colors.primary[600], active: Colors.primary[500] }
  );

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <StyledPressable
        style={animatedStyles}
        className={cn("py-12 px-8 rounded-[32px] flex space-y-2")}
      >
        <StyledText
          className={cn("font-medium font-onest text-2xl text-white")}
        >
          {title}
        </StyledText>
        <StyledText className={cn("font-onest text-lg text-primary-200")}>
          {formattedDate}
        </StyledText>
        <StyledText
          className={cn(
            "font-onest font-medium text-[198rem] tracking-[-16rem] translate-y-14 text-white absolute bottom-0 right-2 opacity-[0.12]"
          )}
        >
          {sessionNumber}
        </StyledText>
      </StyledPressable>
    </Pressable>
  );
};

const StyledLinearGradient = styled(LinearGradient);

export default function HomeScreen() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12 && hour > 4) return "morning";
    if (hour < 18 && hour > 12) return "afternoon";
    return "evening";
  };

  const { isConnected, sendMessage, stringResponse } = useWebSocket(
    "ws://localhost:8000/ws"
  );

  const sessions = [
    {
      title: "Dealing with stress",
      formattedDate: "Today",
    },
    {
      title: "Finding meaning in work",
      formattedDate: "Yesterday",
    },
    {
      title: "Coping with anxiety",
      formattedDate: "Last Tuesday",
    },
    {
      title: "Thinking about work-life balance",
      formattedDate: "Last Monday",
    },
  ];

  return (
    <SafeAreaView className="bg-white">
      <ScrollView className="h-full w-full px-8">
        <View className="h-8" />
        <View className="flex items-center -mb-24 -mt-32 h-screen justify-center">
          <Text className="text-primary-950 text-3xl font-onest text-center font-medium pb-12">
            How are you feeling this {getGreeting()}?
          </Text>
          <LetsChatButton
            onPress={() => {
              router.replace("/session");
              sendMessage("start_session");
            }}
          />
        </View>
        <View className="space-y-6 flex flex-col">
          {sessions.map((session, index) => (
            <View>
              <SessionPreviewButton
                key={index}
                title={session.title}
                formattedDate={session.formattedDate}
                sessionNumber={sessions.length - index}
              />
            </View>
          ))}
        </View>

        <View className="h-8" />
      </ScrollView>
      <StyledLinearGradient
        colors={["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]}
        start={[0, 1]} // Start at the bottom
        end={[0, 0]} // End at the top
        className="h-4 w-full absolute bottom-0"
      />
    </SafeAreaView>
  );
}
