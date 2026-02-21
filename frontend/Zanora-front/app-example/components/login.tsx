import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// ─── Easing helpers ───────────────────────────────────────
const easeOutBack = Easing.out(Easing.back(1.6));
const easeOutCubic = Easing.out(Easing.cubic);

export default function LoginScreen() {
  // ── Garden / ground ──
  const groundY = useRef(new Animated.Value(H)).current;       // slides up from bottom
  const groundOpacity = useRef(new Animated.Value(0)).current;

  // ── Buildings (scale from 0 → 1 on Y‑axis, anchored at bottom) ──
  const bldg1Scale = useRef(new Animated.Value(0)).current;
  const bldg2Scale = useRef(new Animated.Value(0)).current;
  const bldg3Scale = useRef(new Animated.Value(0)).current;
  const bldg4Scale = useRef(new Animated.Value(0)).current;
  const bldg5Scale = useRef(new Animated.Value(0)).current;

  // ── Trees ──
  const tree1Scale = useRef(new Animated.Value(0)).current;
  const tree2Scale = useRef(new Animated.Value(0)).current;
  const tree3Scale = useRef(new Animated.Value(0)).current;

  // ── Login card ──
  const cardX = useRef(new Animated.Value(W)).current;         // slides in from right
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // ── Logo / brand ──
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Ground fades + slides up
      Animated.parallel([
        Animated.timing(groundY, {
          toValue: 0,
          duration: 600,
          easing: easeOutCubic,
          useNativeDriver: true,
        }),
        Animated.timing(groundOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 2. Buildings grow up staggered (fast, snappy)
      Animated.stagger(120, [
        Animated.timing(bldg1Scale, { toValue: 1, duration: 500, easing: easeOutBack, useNativeDriver: true }),
        Animated.timing(bldg2Scale, { toValue: 1, duration: 520, easing: easeOutBack, useNativeDriver: true }),
        Animated.timing(bldg3Scale, { toValue: 1, duration: 540, easing: easeOutBack, useNativeDriver: true }),
        Animated.timing(bldg4Scale, { toValue: 1, duration: 500, easing: easeOutBack, useNativeDriver: true }),
        Animated.timing(bldg5Scale, { toValue: 1, duration: 480, easing: easeOutBack, useNativeDriver: true }),
      ]),
      // 3. Trees pop up
      Animated.stagger(80, [
        Animated.timing(tree1Scale, { toValue: 1, duration: 450, easing: easeOutBack, useNativeDriver: true }),
        Animated.timing(tree2Scale, { toValue: 1, duration: 470, easing: easeOutBack, useNativeDriver: true }),
        Animated.timing(tree3Scale, { toValue: 1, duration: 450, easing: easeOutBack, useNativeDriver: true }),
      ]),
    ]).start();

    // 4. Login card slides in (slightly delayed, runs in parallel with trees)
    Animated.delay(900).start(() => {
      Animated.parallel([
        Animated.timing(cardX, {
          toValue: 0,
          duration: 520,
          easing: easeOutBack,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // 5. Logo pops in after card
    Animated.delay(1200).start(() => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  // ── Interpolations ────────────────────────────────────
  // Buildings: scaleY 0→1 but we keep scaleX at 1 so they grow vertically
  const bldgInterp = (val: Animated.Value) =>
    val.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.root}>
      {/* ─── Sky background ─── */}
      <View style={styles.sky} />

      {/* ─── Green ground / garden ─── */}
      <Animated.View
        style={[
          styles.ground,
          { transform: [{ translateY: groundY }], opacity: groundOpacity },
        ]}
      >
        {/* Rolling hills */}
        <View style={styles.hill1} />
        <View style={styles.hill2} />

        {/* ─── Buildings (grow from bottom) ─── */}
        {/* Building 1 – tall slim */}
        <Animated.View
          style={[
            styles.building,
            styles.bldg1,
            { transform: [{ scaleY: bldgInterp(bldg1Scale) }], transformOrigin: 'bottom' },
          ]}
        >
          <View style={styles.bldgRoof1} />
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.bldgFloor}>
              <View style={styles.window} />
              <View style={styles.window} />
            </View>
          ))}
        </Animated.View>

        {/* Building 2 – wide */}
        <Animated.View
          style={[
            styles.building,
            styles.bldg2,
            { transform: [{ scaleY: bldgInterp(bldg2Scale) }], transformOrigin: 'bottom' },
          ]}
        >
          <View style={styles.bldgRoof2} />
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.bldgFloorWide}>
              <View style={styles.window} />
              <View style={styles.window} />
              <View style={styles.window} />
            </View>
          ))}
        </Animated.View>

        {/* Building 3 – tallest, center-left */}
        <Animated.View
          style={[
            styles.building,
            styles.bldg3,
            { transform: [{ scaleY: bldgInterp(bldg3Scale) }], transformOrigin: 'bottom' },
          ]}
        >
          <View style={styles.bldgRoof3} />
          {[...Array(7)].map((_, i) => (
            <View key={i} style={styles.bldgFloor}>
              <View style={styles.window} />
              <View style={styles.window} />
            </View>
          ))}
        </Animated.View>

        {/* Building 4 – medium */}
        <Animated.View
          style={[
            styles.building,
            styles.bldg4,
            { transform: [{ scaleY: bldgInterp(bldg4Scale) }], transformOrigin: 'bottom' },
          ]}
        >
          <View style={styles.bldgRoof2} />
          {[...Array(4)].map((_, i) => (
            <View key={i} style={styles.bldgFloorWide}>
              <View style={styles.window} />
              <View style={styles.window} />
              <View style={styles.window} />
            </View>
          ))}
        </Animated.View>

        {/* Building 5 – short accent */}
        <Animated.View
          style={[
            styles.building,
            styles.bldg5,
            { transform: [{ scaleY: bldgInterp(bldg5Scale) }], transformOrigin: 'bottom' },
          ]}
        >
          <View style={styles.bldgRoof1} />
          {[...Array(2)].map((_, i) => (
            <View key={i} style={styles.bldgFloor}>
              <View style={styles.window} />
              <View style={styles.window} />
            </View>
          ))}
        </Animated.View>

        {/* ─── Trees ─── */}
        <Animated.View style={[styles.treeWrap, styles.tree1Pos, { transform: [{ scaleY: bldgInterp(tree1Scale) }], transformOrigin: 'bottom' }]}>
          <View style={styles.treeTrunk} />
          <View style={styles.treeCanopy} />
        </Animated.View>

        <Animated.View style={[styles.treeWrap, styles.tree2Pos, { transform: [{ scaleY: bldgInterp(tree2Scale) }], transformOrigin: 'bottom' }]}>
          <View style={styles.treeTrunk} />
          <View style={[styles.treeCanopy, { width: 44, height: 44, borderRadius: 22 }]} />
        </Animated.View>

        <Animated.View style={[styles.treeWrap, styles.tree3Pos, { transform: [{ scaleY: bldgInterp(tree3Scale) }], transformOrigin: 'bottom' }]}>
          <View style={[styles.treeTrunk, { height: 28 }]} />
          <View style={[styles.treeCanopy, { width: 38, height: 38, borderRadius: 19 }]} />
        </Animated.View>

        {/* Grass strip */}
        <View style={styles.grassStrip} />
      </Animated.View>

      {/* ─── Login Card (slides from right) ─── */}
      <Animated.View
        style={[
          styles.card,
          { transform: [{ translateX: cardX }], opacity: cardOpacity },
        ]}
      >
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>🏠</Text>
          </View>
          <Text style={styles.logoText}>TunisRent</Text>
          <Text style={styles.logoSub}>Find your perfect space in Tunisia</Text>
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Form */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@email.com"
          placeholderTextColor="#8a9bb0"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#8a9bb0"
          secureTextEntry
        />

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a3a5c',
    overflow: 'hidden',
  },

  // Sky
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a3a5c',
  },

  // Ground
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: H * 0.55,
    backgroundColor: '#2e7d32',
  },

  hill1: {
    position: 'absolute',
    top: -30,
    left: -40,
    width: W * 0.5,
    height: 100,
    borderRadius: 200,
    backgroundColor: '#388e3c',
  },
  hill2: {
    position: 'absolute',
    top: -20,
    left: W * 0.2,
    width: W * 0.45,
    height: 80,
    borderRadius: 180,
    backgroundColor: '#43a047',
  },

  grassStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#1b5e20',
  },

  // Buildings – shared
  building: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: '#37474f',
    justifyContent: 'flex-end',
  },
  bldgFloor: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  bldgFloorWide: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  window: {
    width: 10,
    height: 12,
    backgroundColor: '#fff9c4',
    borderRadius: 1,
  },

  // Roofs
  bldgRoof1: {
    height: 14,
    backgroundColor: '#c62828',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  bldgRoof2: {
    height: 10,
    backgroundColor: '#00838f',
  },
  bldgRoof3: {
    height: 18,
    backgroundColor: '#c62828',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  // Individual buildings – positions & sizes
  bldg1: {
    left: W * 0.02,
    width: 42,
  },
  bldg2: {
    left: W * 0.08,
    width: 62,
  },
  bldg3: {
    left: W * 0.18,
    width: 48,
  },
  bldg4: {
    left: W * 0.27,
    width: 58,
  },
  bldg5: {
    left: W * 0.37,
    width: 38,
  },

  // Trees
  treeWrap: {
    position: 'absolute',
    bottom: 22,
    alignItems: 'center',
  },
  treeTrunk: {
    width: 10,
    height: 22,
    backgroundColor: '#5d4037',
    borderRadius: 3,
  },
  treeCanopy: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1b5e20',
    position: 'absolute',
    top: -18,
  },
  tree1Pos: { left: W * 0.06 },
  tree2Pos: { left: W * 0.22 },
  tree3Pos: { left: W * 0.34 },

  // ─── Login Card ───
  card: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: W * 0.58,
    height: H,
    backgroundColor: '#ffffff',
    paddingHorizontal: 28,
    paddingTop: 72,
    shadowColor: '#000',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },

  // Logo area
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoIconText: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a3a5c',
    letterSpacing: 0.5,
  },
  logoSub: {
    fontSize: 12,
    color: '#8a9bb0',
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#e0e7ef',
    marginBottom: 22,
  },

  // Form
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a3a5c',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1a3a5c',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },

  loginBtn: {
    backgroundColor: '#2e7d32',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  signUpText: {
    fontSize: 13,
    color: '#8a9bb0',
  },
  signUpLink: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
  },
});