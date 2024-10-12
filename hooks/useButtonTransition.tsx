// hooks/useButtonTransition.ts
import { useCallback } from "react";
import {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

interface ButtonColors {
  default: string;
  active: string;
}

export const useButtonTransition = (colors: ButtonColors) => {
  const isPressed = useSharedValue(false);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isPressed.value ? colors.active : colors.default,
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

  return {
    animatedStyles,
    handlePressIn,
    handlePressOut,
  };
};
