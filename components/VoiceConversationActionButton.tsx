import React from "react";
import { Pressable, Text } from "react-native";
import { styled } from "nativewind";
import { cn } from "@/lib/utils";
import Animated, { useSharedValue } from "react-native-reanimated";
import { Colors } from "@/constants/Colors";
import { ArrowUp, Hand } from "lucide-react-native";
import { useButtonTransition } from "@/hooks/useButtonTransition";

interface VoiceConversationActionButtonProps {
  variant?: "send" | "interrupt";
  disabled?: boolean;
  onPress?: () => void;
}

const StyledPressable = styled(Animated.View);
const StyledText = styled(Text);

const VoiceConversationActionButton = ({
  variant = "send",
  disabled = false,
  onPress,
}: VoiceConversationActionButtonProps) => {
  const isPressed = useSharedValue(false);

  const getVariantColors = () => {
    switch (variant) {
      case "send":
        return { default: Colors.primary[600], active: Colors.primary[500] }; // primary-600 and primary-500
      case "interrupt":
        return { default: Colors.primary[100], active: Colors.primary[200] }; // primary-100 and primary-200
    }
  };

  const colors = getVariantColors();

  const { animatedStyles, handlePressIn, handlePressOut } =
    useButtonTransition(colors);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <StyledPressable
        style={animatedStyles}
        className={cn(
          "py-24 rounded-[32px] flex items-center space-y-4",
          disabled ? "opacity-50" : ""
        )}
      >
        {variant === "send" ? (
          <ArrowUp size={32} className="text-white" />
        ) : (
          <Hand size={32} className="text-primary-700" />
        )}

        <StyledText
          className={cn(
            "font-medium font-onest text-center text-2xl",
            variant === "send" ? "text-white" : "text-primary-700"
          )}
        >
          {variant === "send" ? "Send message" : "Interrupt"}
        </StyledText>
      </StyledPressable>
    </Pressable>
  );
};

export default VoiceConversationActionButton;
