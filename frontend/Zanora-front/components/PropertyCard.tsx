import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';
import {
  PropertyResponseDTO,
} from '../services/Propertyservice';
import {
  PropertyStatusColors,
  PropertyStatusLabels,
  PropertyTypeLabels,
} from '../constants/Propertyenums ';

interface Props {
  property: PropertyResponseDTO;
  index: number;
  onPress?: (p: PropertyResponseDTO) => void;
}

const { width } = Dimensions.get('window');

const PropertyCard: React.FC<Props> = ({ property, index, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 80,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
    }).start();
  };

  const statusColor = PropertyStatusColors[property.status as keyof typeof PropertyStatusColors] ?? Colors.border;
  const typeLabel = PropertyTypeLabels[property.type as keyof typeof PropertyTypeLabels] ?? property.type;
  const statusLabel = PropertyStatusLabels[property.status as keyof typeof PropertyStatusLabels] ?? property.status;

  const firstImage = property.imageUrls?.[0];

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(property)}
        style={styles.card}
      >
        {/* Image */}
        <View style={styles.imageWrapper}>
          {firstImage ? (
            <Image source={{ uri: firstImage }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>🏠</Text>
            </View>
          )}
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          {/* Type badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          <Text style={styles.location}>
            📍 {property.cityName}{property.stateName ? `, ${property.stateName}` : ''}
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>🛏</Text>
              <Text style={styles.statText}>{property.bedrooms}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>🚿</Text>
              <Text style={styles.statText}>{property.bathrooms}</Text>
            </View>
            {property.area && (
              <View style={styles.stat}>
                <Text style={styles.statIcon}>📐</Text>
                <Text style={styles.statText}>{property.area} m²</Text>
              </View>
            )}
            {property.averageRating != null && (
              <View style={styles.stat}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statText}>{property.averageRating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ${property.pricePerMonth.toLocaleString()}
            </Text>
            <Text style={styles.priceSuffix}>/month</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PropertyCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#2C3E70',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EEF1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { fontSize: 48 },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(44,62,112,0.82)',
  },
  typeText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  body: { padding: 16 },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 14 },
  statText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  price: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  priceSuffix: { fontSize: 13, color: Colors.textSecondary },
});