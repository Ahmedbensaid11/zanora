import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  Switch,
} from 'react-native';
import { Colors } from '../constants/Colors';
import {
  PropertyType,
  PropertyStatus,
  PropertyTypeLabels,
  PropertyStatusLabels,
  SORT_OPTIONS,
} from '../constants/Propertyenums ';
import FilterChip from './FilterChip';
import { PropertyFilterParams } from '../services/Propertyservice';

const { height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.75;

interface Props {
  visible: boolean;
  filters: PropertyFilterParams;
  onChange: (partial: Partial<PropertyFilterParams>) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={sectionStyles.wrapper}>
    <Text style={sectionStyles.title}>{title}</Text>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
});

const CounterRow: React.FC<{
  label: string;
  value?: number;
  onDec: () => void;
  onInc: () => void;
}> = ({ label, value, onDec, onInc }) => (
  <View style={counterStyles.row}>
    <Text style={counterStyles.label}>{label}</Text>
    <View style={counterStyles.controls}>
      <TouchableOpacity style={counterStyles.btn} onPress={onDec}>
        <Text style={counterStyles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={counterStyles.val}>{value ?? 'Any'}</Text>
      <TouchableOpacity style={counterStyles.btn} onPress={onInc}>
        <Text style={counterStyles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const counterStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 20, color: Colors.primary, fontWeight: '600', lineHeight: 22 },
  val: { fontSize: 16, fontWeight: '700', color: Colors.text, minWidth: 36, textAlign: 'center' },
});

const FilterSheet: React.FC<Props> = ({
  visible,
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const decrement = (key: 'bedrooms' | 'bathrooms') => {
    const cur = filters[key] ?? 0;
    onChange({ [key]: cur <= 1 ? undefined : cur - 1 });
  };

  const increment = (key: 'bedrooms' | 'bathrooms') => {
    onChange({ [key]: (filters[key] ?? 0) + 1 });
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={onReset}>
            <Text style={styles.resetText}>Reset all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          {/* Property Type */}
          <Section title="Property Type">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.values(PropertyType).map((t) => (
                <FilterChip
                  key={t}
                  label={PropertyTypeLabels[t]}
                  selected={filters.type === t}
                  onPress={() =>
                    onChange({ type: filters.type === t ? undefined : t })
                  }
                />
              ))}
            </ScrollView>
          </Section>

          {/* Status */}
          <Section title="Status">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.values(PropertyStatus).map((s) => (
                <FilterChip
                  key={s}
                  label={PropertyStatusLabels[s]}
                  selected={filters.status === s}
                  onPress={() =>
                    onChange({ status: filters.status === s ? undefined : s })
                  }
                />
              ))}
            </ScrollView>
          </Section>

          {/* Rooms */}
          <Section title="Rooms">
            <CounterRow
              label="🛏  Bedrooms"
              value={filters.bedrooms}
              onDec={() => decrement('bedrooms')}
              onInc={() => increment('bedrooms')}
            />
            <CounterRow
              label="🚿  Bathrooms"
              value={filters.bathrooms}
              onDec={() => decrement('bathrooms')}
              onInc={() => increment('bathrooms')}
            />
          </Section>

          {/* Sort */}
          <Section title="Sort By">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SORT_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  selected={filters.sortBy === opt.value}
                  onPress={() => onChange({ sortBy: opt.value })}
                />
              ))}
            </ScrollView>
            <View style={styles.sortDirRow}>
              <Text style={styles.sortDirLabel}>Ascending order</Text>
              <Switch
                value={filters.sortDirection === 'asc'}
                onValueChange={(v) =>
                  onChange({ sortDirection: v ? 'asc' : 'desc' })
                }
                thumbColor={Colors.white}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>
          </Section>

          {/* Rating */}
          <Section title="Min Rating">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3, 4, 5].map((r) => (
                <FilterChip
                  key={r}
                  label={`${'★'.repeat(r)}`}
                  selected={filters.minRating === r}
                  onPress={() =>
                    onChange({ minRating: filters.minRating === r ? undefined : r })
                  }
                />
              ))}
            </ScrollView>
          </Section>
        </ScrollView>

        {/* Apply button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
            <Text style={styles.applyText}>Show Results</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default FilterSheet;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,30,60,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  resetText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  body: { padding: 20, paddingBottom: 8 },
  sortDirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  sortDirLabel: { fontSize: 15, color: Colors.text },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});