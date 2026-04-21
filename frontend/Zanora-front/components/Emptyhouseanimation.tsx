import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Polygon,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { Colors } from '../constants/Colors';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  title?: string;
  subtitle?: string;
}

const EmptyHouseAnimation: React.FC<Props> = ({
  title = 'No properties found',
  subtitle = 'Try adjusting your filters',
}) => {
  // ── mounted guard — stops animations trying to update unmounted nodes ──────
  const isMounted = useRef(true);

  // ── animation values ───────────────────────────────────────────────────────
  const fadeIn = useRef(new Animated.Value(0)).current;
  const houseSlide = useRef(new Animated.Value(30)).current;
  const roofScale = useRef(new Animated.Value(0)).current;
  const doorOpen = useRef(new Animated.Value(0)).current;
  const chimneySmokeY = useRef(new Animated.Value(0)).current;
  const chimneySmokeOpacity = useRef(new Animated.Value(0)).current;
  const windowGlow = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const starOpacity1 = useRef(new Animated.Value(0)).current;
  const starOpacity2 = useRef(new Animated.Value(0)).current;
  const starOpacity3 = useRef(new Animated.Value(0)).current;
  const groundOpacity = useRef(new Animated.Value(0)).current;

  // refs to hold loop animation references so we can stop them on unmount
  const loopAnims = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    isMounted.current = true;

    // ── Entry sequence ────────────────────────────────────────────────────────
    const entryAnim = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.spring(houseSlide, {
          toValue: 0, tension: 60, friction: 10, useNativeDriver: true,
        }),
        Animated.timing(groundOpacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
      ]),
      Animated.spring(roofScale, {
        toValue: 1, tension: 100, friction: 7, useNativeDriver: true,
      }),
      Animated.timing(doorOpen, {
        toValue: 1, duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    entryAnim.start(({ finished }) => {
      // Don't start loops if component already unmounted or entry was interrupted
      if (!finished || !isMounted.current) return;

      // ── Loop animations ────────────────────────────────────────────────────
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, {
            toValue: -8, duration: 1800,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
          Animated.timing(floatY, {
            toValue: 0, duration: 1800,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
        ])
      );

      const smokeYLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(chimneySmokeY, {
            toValue: -20, duration: 1500, useNativeDriver: true,
          }),
          Animated.timing(chimneySmokeY, {
            toValue: 0, duration: 0, useNativeDriver: true,
          }),
        ])
      );

      const smokeOpacityLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(chimneySmokeOpacity, {
            toValue: 0.7, duration: 600, useNativeDriver: true,
          }),
          Animated.timing(chimneySmokeOpacity, {
            toValue: 0, duration: 900, useNativeDriver: true,
          }),
        ])
      );

      const windowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(windowGlow, {
            toValue: 1, duration: 1200, useNativeDriver: false,
          }),
          Animated.timing(windowGlow, {
            toValue: 0.4, duration: 1200, useNativeDriver: false,
          }),
        ])
      );

      const makeTwinkle = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.1, duration: 600, useNativeDriver: true }),
          ])
        );

      const star1Loop = makeTwinkle(starOpacity1, 0);
      const star2Loop = makeTwinkle(starOpacity2, 500);
      const star3Loop = makeTwinkle(starOpacity3, 900);

      // Store all loops so we can stop them on unmount
      loopAnims.current = [
        floatLoop, smokeYLoop, smokeOpacityLoop,
        windowLoop, star1Loop, star2Loop, star3Loop,
      ];

      loopAnims.current.forEach((a) => a.start());
    });

    // ── Cleanup: stop all animations when component unmounts ─────────────────
    return () => {
      isMounted.current = false;
      entryAnim.stop();
      loopAnims.current.forEach((a) => a.stop());
    };
  }, []);

  const doorWidth = doorOpen.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 9],
  });

  const windowColor = windowGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F5A623', '#FFE066'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      {/* Stars */}
      <View style={styles.skyRow}>
        <Animated.Text style={[styles.star, { opacity: starOpacity1 }]}>✦</Animated.Text>
        <Animated.Text style={[styles.star, { opacity: starOpacity2 }]}>✦</Animated.Text>
        <Animated.Text style={[styles.star, { opacity: starOpacity3 }]}>✦</Animated.Text>
      </View>

      {/* House */}
      <Animated.View style={{ transform: [{ translateY: Animated.add(houseSlide, floatY) }] }}>
        <Svg width={180} height={160} viewBox="0 0 180 160">
          <Defs>
            <LinearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#EEF1FA" stopOpacity="1" />
              <Stop offset="1" stopColor="#D8DFEE" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.primary} stopOpacity="1" />
              <Stop offset="1" stopColor="#1A2A55" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Ground shadow */}
          <Path d="M30 148 Q90 152 150 148" stroke="#C0C8DC" strokeWidth="3" fill="none" opacity="0.5" />

          {/* Walls */}
          <Rect x="35" y="80" width="110" height="70" fill="url(#wall)" rx="2" />

          {/* Roof */}
          <AnimatedG
            transform={[
              { translateX: 90 }, { translateY: 80 },
              { scale: roofScale },
              { translateX: -90 }, { translateY: -80 },
            ]}
          >
            <Polygon points="25,82 90,28 155,82" fill="url(#roof)" />
            <Polygon points="22,84 90,28 158,84 155,84 90,32 25,84" fill="#1A2A55" opacity="0.4" />
          </AnimatedG>

          {/* Chimney */}
          <Rect x="108" y="42" width="16" height="28" fill="#2C3E70" rx="1" />
          <Rect x="106" y="40" width="20" height="5" fill="#1A2A55" rx="1" />

          {/* Smoke */}
          <AnimatedCircle cx={116} cy={34} r={5} fill="#B0B8CC"
            opacity={chimneySmokeOpacity}
            y={chimneySmokeY}
          />
          <AnimatedCircle cx={120} cy={26} r={4} fill="#C8CEDC"
            opacity={chimneySmokeOpacity}
            y={chimneySmokeY}
          />

          {/* Left window */}
          <AnimatedRect x="46" y="92" width="28" height="24" fill={windowColor} rx="3" />
          <Rect x="46" y="92" width="28" height="24" fill="none" stroke={Colors.primary} strokeWidth="1.5" rx="3" />
          <Line x1="60" y1="92" x2="60" y2="116" stroke={Colors.primary} strokeWidth="1" opacity="0.5" />
          <Line x1="46" y1="104" x2="74" y2="104" stroke={Colors.primary} strokeWidth="1" opacity="0.5" />

          {/* Right window */}
          <AnimatedRect x="106" y="92" width="28" height="24" fill={windowColor} rx="3" />
          <Rect x="106" y="92" width="28" height="24" fill="none" stroke={Colors.primary} strokeWidth="1.5" rx="3" />
          <Line x1="120" y1="92" x2="120" y2="116" stroke={Colors.primary} strokeWidth="1" opacity="0.5" />
          <Line x1="106" y1="104" x2="134" y2="104" stroke={Colors.primary} strokeWidth="1" opacity="0.5" />

          {/* Door frame */}
          <Rect x="72" y="110" width="36" height="40" fill="#2C3E70" rx="3" />

          {/* Animated door */}
          <AnimatedRect x={72} y={110} width={doorWidth} height={39} fill="#3D5299" rx={3} />

          {/* Door knob */}
          <Circle cx="103" cy="131" r="2.5" fill="#F5A623" />

          {/* Step */}
          <Rect x="68" y="148" width="44" height="5" fill="#B0B8CC" rx="1" />

          {/* Roof peak */}
          <Circle cx="90" cy="29" r="4" fill="#F5A623" />
          <Circle cx="90" cy="29" r="2" fill="#FFE066" />
        </Svg>
      </Animated.View>

      {/* Ground line */}
      <Animated.View style={[styles.ground, { opacity: groundOpacity }]} />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Animated.View>
  );
};

export default EmptyHouseAnimation;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
    gap: 4,
  },
  skyRow: {
    flexDirection: 'row',
    gap: 28,
    marginBottom: 8,
  },
  star: {
    fontSize: 14,
    color: Colors.primary,
  },
  ground: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C0C8DC',
    marginTop: -6,
    marginBottom: 20,
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});