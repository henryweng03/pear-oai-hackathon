import React from "react";
import { Pressable, Text } from "react-native";
import { styled } from "nativewind";
import { cn } from "@/lib/utils";
import Animated from "react-native-reanimated";
import { Colors } from "@/constants/Colors";
import { useButtonTransition } from "@/hooks/useButtonTransition";

interface ButtonProps {
  size?: "sm" | "md" | "lg" | "fat";
  variant?: "primary" | "secondary" | "tertiary";
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

const StyledPressable = styled(Animated.View);
const StyledText = styled(Text);

const Button = ({
  size,
  variant = "primary",
  disabled = false,
  onPress,
  children,
}: ButtonProps) => {
  const getVariantColors = () => {
    switch (variant) {
      case "primary":
        return { default: Colors.primary[600], active: Colors.primary[500] }; // primary-600 and primary-500
      case "secondary":
        return { default: Colors.primary[100], active: Colors.primary[200] }; // primary-100 and primary-200
      case "tertiary":
        return { default: "transparent", active: "transparent" };
      default:
        return { default: Colors.primary[600], active: Colors.primary[500] }; // primary-600 and primary-500
    }
  };

  const colors = getVariantColors();

  const { animatedStyles, handlePressIn, handlePressOut } =
    useButtonTransition(colors);

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-4 py-2 rounded-lg";
      case "md":
        return "px-4 py-2.5 rounded-lg";
      case "lg":
        return "px-5 py-3 rounded-xl";
      case "fat":
        return "px-8 py-5 rounded-xl";
      default:
        return "px-5 py-3 rounded-lg";
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case "primary":
        return "text-white";
      case "secondary":
        return "text-primary-700";
      case "tertiary":
        return "text-primary-700";
      default:
        return "text-white";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "md":
        return "text-sm";
      case "lg":
        return "text-base";
      case "fat":
        return "text-base";
      default:
        return "text-sm";
    }
  };
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <StyledPressable
        style={animatedStyles}
        className={cn(getSizeStyles(), disabled ? "opacity-50" : "")}
      >
        <StyledText
          className={cn(
            "font-semibold font-onest text-center",
            getTextStyles(),
            getTextSize()
          )}
        >
          {children}
        </StyledText>
      </StyledPressable>
    </Pressable>
  );
};

export default Button;
