import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { setFlashHandler } from "@/utils/flashEmitter";

export function FlashOverlay() {
  const opacity = useRef(new Animated.Value(0)).current;
  const [color, setColor] = useState("#ffffff");

  const flash = useCallback(
    (newColor: string) => {
      setColor(newColor);
      opacity.stopAnimation();
      opacity.setValue(0);

      // Three quick pulses then fade out
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.72, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.12, duration: 130, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.65, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.08, duration: 130, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    },
    [opacity]
  );

  useEffect(() => {
    setFlashHandler(flash);
    return () => setFlashHandler(null);
  }, [flash]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { opacity, zIndex: 9999, backgroundColor: color },
      ]}
    />
  );
}
