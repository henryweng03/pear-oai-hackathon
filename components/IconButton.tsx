import React from "react";
import { Pressable, View } from "react-native";
import { styled } from "nativewind";
import { cn } from "@/lib/utils";
import Animated from "react-native-reanimated";
import { Colors } from "@/constants/Colors";
import { useButtonTransition } from "@/hooks/useButtonTransition";

interface IconButtonProps {
  variant?: "primary" | "secondary" | "tertiary";
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

const StyledPressable = styled(Animated.View);

const IconButton = ({
  variant = "primary",
  disabled = false,
  onPress,
  children,
}: IconButtonProps) => {
  const getVariantColors = () => {
    switch (variant) {
      case "primary":
        return { default: Colors.primary[600], active: Colors.primary[500] };
      case "secondary":
        return { default: Colors.primary[100], active: Colors.primary[200] };
      case "tertiary":
        return { default: "transparent", active: "transparent" };
      default:
        return { default: Colors.primary[600], active: Colors.primary[500] };
    }
  };

  const colors = getVariantColors();

  const { animatedStyles, handlePressIn, handlePressOut } =
    useButtonTransition(colors);

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-primary-600";
      case "secondary":
        return "bg-primary-100";
      case "tertiary":
        return "bg-transparent";
      default:
        return "bg-primary-600";
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
        className={cn(
          "p-2 rounded-md items-center justify-center",
          getVariantStyles(),
          disabled ? "opacity-50" : ""
        )}
      >
        <View
          className={variant === "primary" ? "text-white" : "text-primary-700"}
        >
          {children}
        </View>
      </StyledPressable>
    </Pressable>
  );
};

export default IconButton;
