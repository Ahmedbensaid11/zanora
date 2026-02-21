import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const AnimatedCityscape = () => {
  // Animation values for each building
  const building1Height = useRef(new Animated.Value(0)).current;
  const building2Height = useRef(new Animated.Value(0)).current;
  const building3Height = useRef(new Animated.Value(0)).current;
  const building4Height = useRef(new Animated.Value(0)).current;
  const building5Height = useRef(new Animated.Value(0)).current;
  const building6Height = useRef(new Animated.Value(0)).current;
  const building7Height = useRef(new Animated.Value(0)).current;
  const building8Height = useRef(new Animated.Value(0)).current;

  // Window glow animation
  const windowGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Building rise animations
    const buildings = [
      { height: building1Height, delay: 0, finalHeight: 80 },
      { height: building2Height, delay: 150, finalHeight: 100 },
      { height: building3Height, delay: 300, finalHeight: 140 },
      { height: building4Height, delay: 450, finalHeight: 120 },
      { height: building5Height, delay: 600, finalHeight: 200 },
      { height: building6Height, delay: 750, finalHeight: 160 },
      { height: building7Height, delay: 900, finalHeight: 110 },
      { height: building8Height, delay: 1050, finalHeight: 90 },
    ];

    const buildingAnimations = buildings.map(({ height, delay, finalHeight }) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.spring(height, {
          toValue: finalHeight,
          tension: 35,
          friction: 7,
          useNativeDriver: false,
        }),
      ]);
    });

    // Window glow animation (pulsing effect)
    const windowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(windowGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(windowGlow, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    Animated.parallel([
      ...buildingAnimations,
      Animated.sequence([
        Animated.delay(2000),
        windowPulse,
      ]),
    ]).start();
  }, []);

  const windowOpacity = windowGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={styles.container}>
      <View style={styles.cityscape}>
        {/* Ground */}
        <View style={styles.ground} />

        {/* Buildings Container */}
        <View style={styles.buildingsContainer}>
          {/* Building 1 */}
          <Animated.View style={[styles.building, styles.building1, { height: building1Height }]}>
            <View style={styles.windowsContainer}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={styles.windowRow}>
                  {[...Array(2)].map((_, j) => (
                    <Animated.View key={j} style={[styles.window, { opacity: windowOpacity }]} />
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Building 2 */}
          <Animated.View style={[styles.building, styles.building2, { height: building2Height }]}>
            <View style={styles.windowsContainer}>
              {[...Array(4)].map((_, i) => (
                <View key={i} style={styles.windowRow}>
                  {[...Array(2)].map((_, j) => (
                    <Animated.View key={j} style={[styles.window, { opacity: windowOpacity }]} />
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Building 3 */}
          <Animated.View style={[styles.building, styles.building3, { height: building3Height }]}>
            <View style={styles.windowsContainer}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.windowRow}>
                  {[...Array(3)].map((_, j) => (
                    <Animated.View key={j} style={[styles.window, { opacity: windowOpacity }]} />
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Building 4 */}
          <Animated.View style={[styles.building, styles.building4, { height: building4Height }]}>
            <View style={styles.windowsContainer}>
              {[...Array(5)].map((_, i) => (
                <View key={i} style={styles.windowRow}>
                  {[...Array(2)].map((_, j) => (
                    <Animated.View key={j} style={[styles.window, { opacity: windowOpacity }]} />
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Building 5 - Tallest (Center) */}
          <Animated.View style={[styles.building, styles.building5, { height: building5Height }]}>
            <View style={styles.windowsContainer}>
              {[...Array(9)].map((_, i) => (
                <View key={i} style={styles.windowRow}>
                  {[...Array(4)].map((_, j) => (
                    <Animated.View key={j} style={[styles.window, { opacity: windowOpacity }]} />
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Building 6 */}
          <Animated.View style={[styles.building, styles.building6, { height: building6Height }]}>
            <View style={styles.windowsContainer}>
              {[...Array(7)].map((_, i) => (
                <View key={i} style={styles.windowRow}>
                  {[...Array(3)].map((_, j) => (
                    <Animated.View key={j} style={[styles.window, { opacity: windowOpacity }]} />
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Building 7 */}
          <Animated.View style={[styles.building, styles.building7, { height: building7Height }]}>
            <View style={styles.windowsContainer}>
              {[...Array(4)].map((_, i) => (
                <View key={i} style={styles.windowRow}>
                  {[...Array(2)].map((_, j) => (
                    <Animated.View key={j} style={[styles.window, { opacity: windowOpacity }]} />
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Building 8 */}
          <Animated.View style={[styles.building, styles.building8, { height: building8Height }]}>
            <View style={styles.windowsContainer}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={styles.windowRow}>
                  {[...Array(2)].map((_, j) => (
                    <Animated.View key={j} style={[styles.window, { opacity: windowOpacity }]} />
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  cityscape: {
    width: '100%',
    height: 230,
    position: 'relative',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#2C3E50',
  },
  buildingsContainer: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  building: {
    borderWidth: 2,
    borderColor: '#2C3E50',
    borderBottomWidth: 0,
    overflow: 'hidden',
  },

  // Individual building styles
  building1: {
    width: 45,
    backgroundColor: '#E8EAF6',
  },
  building2: {
    width: 48,
    backgroundColor: '#C5CAE9',
  },
  building3: {
    width: 55,
    backgroundColor: '#E3F2FD',
  },
  building4: {
    width: 50,
    backgroundColor: '#BBDEFB',
  },
  building5: {
    width: 65,
    backgroundColor: '#1976D2',
  },
  building6: {
    width: 58,
    backgroundColor: '#90CAF9',
  },
  building7: {
    width: 48,
    backgroundColor: '#E1F5FE',
  },
  building8: {
    width: 45,
    backgroundColor: '#B3E5FC',
  },

  // Windows
  windowsContainer: {
    flex: 1,
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 6,
  },
  windowRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  window: {
    width: 10,
    height: 10,
    backgroundColor: '#FFF59D',
    borderWidth: 1,
    borderColor: '#2C3E50',
    borderRadius: 1,
  },
});

export default AnimatedCityscape;