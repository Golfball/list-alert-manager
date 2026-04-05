import React, { useEffect, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

const ACCENT = "#4da3ff";
const BG = "#0b1120";
const RING_SIZE = 110;
const LOGO_SIZE = 90;

function PulseRing({ delay }: { delay: number }) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(3.2, { duration: 2400, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.65, { duration: 250 }),
          withTiming(0, { duration: 2150, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.ring, animStyle]} />;
}

interface Props {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: Props) {
  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.2);
  const logoOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(28);
  const tagOpacity = useSharedValue(0);
  const tagY = useSharedValue(12);
  const dividerWidth = useSharedValue(0);

  const finish = useCallback(() => onFinish(), [onFinish]);

  useEffect(() => {
    logoScale.value = withDelay(
      200,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.back(1.4)) })
    );
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 450 }));

    glowOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    glowScale.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    dividerWidth.value = withDelay(
      750,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );

    textOpacity.value = withDelay(780, withTiming(1, { duration: 500 }));
    textY.value = withDelay(
      780,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );

    tagOpacity.value = withDelay(1050, withTiming(1, { duration: 500 }));
    tagY.value = withDelay(
      1050,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );

    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 550 }, (done) => {
        if (done) runOnJS(finish)();
      });
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.22,
    transform: [{ scale: glowScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateY: tagY.value }],
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: dividerWidth.value }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, styles.container, containerStyle]}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={[BG, "#0e1a2e", "#091020"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top accent line */}
      <View style={styles.topAccent} />

      {/* Radar rings + logo */}
      <View style={styles.ringContainer}>
        <PulseRing delay={0} />
        <PulseRing delay={800} />
        <PulseRing delay={1600} />

        <Animated.View style={[styles.glow, glowStyle]} />

        <Animated.View style={[styles.logoCircle, logoStyle]}>
          <View style={styles.logoInnerRing} />
          <Feather name="bell" size={40} color={ACCENT} />
        </Animated.View>
      </View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <Animated.Text style={[styles.appName, textStyle]}>
          List & Alert
        </Animated.Text>
        <Animated.View style={[styles.divider, dividerStyle]} />
        <Animated.Text style={[styles.tagline, tagStyle]}>
          MONITOR · ALERT · PROTECT
        </Animated.Text>
      </View>

      {/* Bottom dots */}
      <Animated.View style={[styles.dots, tagStyle]}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, i === 1 && styles.dotAccent]}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ACCENT,
    opacity: 0.6,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 44,
  },
  ring: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  glow: {
    position: "absolute",
    width: LOGO_SIZE * 1.5,
    height: LOGO_SIZE * 1.5,
    borderRadius: (LOGO_SIZE * 1.5) / 2,
    backgroundColor: ACCENT,
  },
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: "#0d1627",
    borderWidth: 1.5,
    borderColor: `${ACCENT}55`,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  logoInnerRing: {
    position: "absolute",
    width: LOGO_SIZE - 20,
    height: LOGO_SIZE - 20,
    borderRadius: (LOGO_SIZE - 20) / 2,
    borderWidth: 1,
    borderColor: `${ACCENT}30`,
  },
  textBlock: {
    alignItems: "center",
    gap: 12,
  },
  appName: {
    color: "#ffffff",
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  divider: {
    width: 48,
    height: 1.5,
    backgroundColor: ACCENT,
    opacity: 0.5,
  },
  tagline: {
    color: ACCENT,
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3.5,
    opacity: 0.75,
  },
  dots: {
    position: "absolute",
    bottom: 56,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2d3748",
  },
  dotAccent: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: ACCENT,
    opacity: 0.7,
  },
});
