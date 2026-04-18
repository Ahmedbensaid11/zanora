import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/Colors';
import { OfferType } from '../services/Propertydetailservice';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PricePrediction {
  predictedPrice: number;
  priceRange: string;
  lowerBound: number;
  upperBound: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  note: string | null;
}

interface PropertyMeta {
  status: string;       // e.g. "À louer" | "À vendre"
  propertyType: string; // e.g. "Appartement"
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  sizeM2: number;
}

interface OfferModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  offerType: OfferType;
  onOfferTypeChange: (t: OfferType) => void;
  price: string;
  onPriceChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  rentStart: string;
  onRentStartChange: (v: string) => void;
  rentEnd: string;
  onRentEndChange: (v: string) => void;
  submitting: boolean;
  propertyPrice?: number;
  /** Pass property metadata so the modal can call the prediction API */
  propertyMeta?: PropertyMeta;
}

// ─── Confidence badge colour ──────────────────────────────────────────────────

const CONFIDENCE_COLORS: Record<PricePrediction['confidence'], string> = {
  LOW: '#F59E0B',
  MEDIUM: '#3B82F6',
  HIGH: '#10B981',
};

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Price range bar ──────────────────────────────────────────────────────────

const PriceRangeBar = ({
  lower,
  upper,
  entered,
  predicted,
}: {
  lower: number;
  upper: number;
  entered: number | null;
  predicted: number;
}) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (entered !== null) {
      const clamped = Math.max(lower, Math.min(upper, entered));
      const ratio = (clamped - lower) / (upper - lower);
      Animated.spring(dotAnim, {
        toValue: ratio,
        useNativeDriver: false,
      }).start();
    }
  }, [entered, lower, upper]);

  const predictedRatio = (predicted - lower) / (upper - lower);

  const isOutOfRange =
    entered !== null && (entered < lower || entered > upper);

  return (
    <View style={rangeStyles.wrapper}>
      {/* Track */}
      <View style={rangeStyles.track}>
        {/* Filled range */}
        <Animated.View
          style={[
            rangeStyles.fill,
            {
              width: barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />

        {/* Predicted price marker */}
        <View
          style={[
            rangeStyles.predictedMarker,
            { left: `${predictedRatio * 100}%` as any },
          ]}
        >
          <View style={rangeStyles.predictedLine} />
          <View style={rangeStyles.predictedDot} />
        </View>

        {/* Entered price dot */}
        {entered !== null && (
          <Animated.View
            style={[
              rangeStyles.enteredDot,
              isOutOfRange && rangeStyles.enteredDotWarning,
              {
                left: dotAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        )}
      </View>

      {/* Labels */}
      <View style={rangeStyles.labels}>
        <Text style={rangeStyles.labelText}>{lower.toFixed(0)} DT</Text>
        <Text style={[rangeStyles.labelText, rangeStyles.labelCenter]}>
          ~{predicted.toFixed(0)} DT
        </Text>
        <Text style={rangeStyles.labelText}>{upper.toFixed(0)} DT</Text>
      </View>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const OfferModal = ({
  visible,
  onClose,
  onSubmit,
  offerType,
  onOfferTypeChange,
  price,
  onPriceChange,
  message,
  onMessageChange,
  rentStart,
  onRentStartChange,
  rentEnd,
  onRentEndChange,
  submitting,
  propertyPrice,
  propertyMeta,
}: OfferModalProps) => {
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const debouncedPrice = useDebounce(price, 400);
  const enteredNum = debouncedPrice ? parseFloat(debouncedPrice) : null;

  // ── Fetch prediction once when modal opens (if metadata provided) ──────────
  useEffect(() => {
    if (!visible || !propertyMeta) return;
    setPrediction(null);
    setPredictionError(null);
    setLoadingPrediction(true);

    const payload = {
      status: propertyMeta.status,
      propertyType: propertyMeta.propertyType,
      city: propertyMeta.city,
      state: propertyMeta.state,
      bedrooms: propertyMeta.bedrooms,
      bathrooms: propertyMeta.bathrooms,
      sizeM2: propertyMeta.sizeM2,
    };

    fetch('http://localhost:8083/api/predictions/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PricePrediction>;
      })
      .then((data) => {
        setPrediction(data);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      })
      .catch(() => setPredictionError('Could not load price estimate.'))
      .finally(() => setLoadingPrediction(false));
  }, [visible, propertyMeta]);

  // ── Validation ────────────────────────────────────────────────────────────
  const isOutOfRange =
    prediction !== null &&
    enteredNum !== null &&
    (enteredNum < prediction.lowerBound || enteredNum > prediction.upperBound);

  const handleSubmit = useCallback(() => {
    if (isOutOfRange) return; // blocked
    onSubmit();
  }, [isOutOfRange, onSubmit]);

  // ── Warning message ───────────────────────────────────────────────────────
  const warningMessage =
    isOutOfRange && prediction
      ? enteredNum! < prediction.lowerBound
        ? `Price is below the estimated minimum of ${prediction.lowerBound.toFixed(0)} DT`
        : `Price exceeds the estimated maximum of ${prediction.upperBound.toFixed(0)} DT`
      : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.sheet, { paddingBottom: 36 }]}>
            <View style={styles.handle} />
            <Text style={styles.title}>Make an Offer</Text>

            {/* ── Offer type ──────────────────────────────────────────────── */}
            <Text style={styles.label}>Offer type</Text>
            <View style={styles.typeRow}>
              {([OfferType.RENT, OfferType.BUY] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    offerType === t && styles.typeBtnActive,
                  ]}
                  onPress={() => onOfferTypeChange(t)}
                >
                  <MaterialCommunityIcons
                    name={t === OfferType.RENT ? 'key-outline' : 'home-outline'}
                    size={18}
                    color={offerType === t ? '#fff' : Colors.primary}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      offerType === t && styles.typeBtnTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── AI price estimate card ───────────────────────────────────── */}
            {propertyMeta && (
              <Animated.View style={[styles.predictionCard, { opacity: fadeAnim }]}>
                <View style={styles.predictionHeader}>
                  <MaterialCommunityIcons
                    name="robot-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.predictionTitle}>AI Price Estimate</Text>
                  {loadingPrediction && (
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                  {prediction && !loadingPrediction && (
                    <View
                      style={[
                        styles.confidenceBadge,
                        {
                          backgroundColor:
                            CONFIDENCE_COLORS[prediction.confidence] + '22',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.confidenceDot,
                          {
                            backgroundColor:
                              CONFIDENCE_COLORS[prediction.confidence],
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.confidenceText,
                          {
                            color: CONFIDENCE_COLORS[prediction.confidence],
                          },
                        ]}
                      >
                        {prediction.confidence}
                      </Text>
                    </View>
                  )}
                </View>

                {predictionError ? (
                  <Text style={styles.predictionError}>{predictionError}</Text>
                ) : prediction ? (
                  <>
                    <Text style={styles.predictionRange}>
                      {prediction.priceRange}
                    </Text>
                    <PriceRangeBar
                      lower={prediction.lowerBound}
                      upper={prediction.upperBound}
                      predicted={prediction.predictedPrice}
                      entered={enteredNum}
                    />
                    {prediction.note && (
                      <Text style={styles.predictionNote}>
                        {prediction.note}
                      </Text>
                    )}
                  </>
                ) : !loadingPrediction ? (
                  <Text style={styles.predictionNote}>
                    Enter property details to get an estimate.
                  </Text>
                ) : null}
              </Animated.View>
            )}

            {/* ── Price input ──────────────────────────────────────────────── */}
            <Text style={styles.label}>Proposed price (TND)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  isOutOfRange && styles.inputError,
                ]}
                keyboardType="numeric"
                placeholder={`e.g. ${propertyPrice ?? ''}`}
                placeholderTextColor="#AAAAAA"
                value={price}
                onChangeText={onPriceChange}
              />
              {price !== '' && !isOutOfRange && prediction && (
                <View style={styles.inputCheck}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#10B981"
                  />
                </View>
              )}
              {isOutOfRange && (
                <View style={styles.inputCheck}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={20}
                    color="#EF4444"
                  />
                </View>
              )}
            </View>

            {/* Warning banner */}
            {warningMessage && (
              <View style={styles.warningBanner}>
                <MaterialCommunityIcons
                  name="alert-outline"
                  size={15}
                  color="#EF4444"
                />
                <Text style={styles.warningText}>{warningMessage}</Text>
              </View>
            )}

            {/* ── Rent dates ───────────────────────────────────────────────── */}
            {offerType === OfferType.RENT && (
              <>
                <Text style={styles.label}>Rent start date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2025-06-01"
                  placeholderTextColor="#AAAAAA"
                  value={rentStart}
                  onChangeText={onRentStartChange}
                />
                <Text style={styles.label}>Rent end date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2026-06-01"
                  placeholderTextColor="#AAAAAA"
                  value={rentEnd}
                  onChangeText={onRentEndChange}
                />
              </>
            )}

            {/* ── Message ──────────────────────────────────────────────────── */}
            <Text style={styles.label}>Message to owner (optional)</Text>
            <TextInput
              style={styles.textarea}
              multiline
              numberOfLines={3}
              placeholder="Introduce yourself or explain your offer..."
              placeholderTextColor="#AAAAAA"
              value={message}
              onChangeText={onMessageChange}
            />

            {/* ── Actions ──────────────────────────────────────────────────── */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (submitting || isOutOfRange) && { opacity: 0.5 },
                ]}
                onPress={handleSubmit}
                disabled={submitting || isOutOfRange}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Send Offer</Text>
                )}
              </TouchableOpacity>
            </View>

            {isOutOfRange && (
              <Text style={styles.blockedHint}>
                Adjust your price to the suggested range to proceed.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default OfferModal;

// ─── Styles ───────────────────────────────────────────────────────────────────

const rangeStyles = StyleSheet.create({
  wrapper: { marginTop: 10, marginBottom: 4 },
  track: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary + '33',
    borderRadius: 4,
  },
  predictedMarker: {
    position: 'absolute',
    top: -4,
    transform: [{ translateX: -1 }],
    alignItems: 'center',
  },
  predictedLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  predictedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  enteredDot: {
    position: 'absolute',
    top: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#fff',
    transform: [{ translateX: -9 }],
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  enteredDotWarning: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  labelText: { fontSize: 11, color: Colors.textSecondary },
  labelCenter: { color: Colors.primary, fontWeight: '700' },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  // ── Prediction card ─────────────────────────────────────────────────────────
  predictionCard: {
    backgroundColor: Colors.primary + '0D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  predictionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  predictionRange: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  predictionNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  predictionError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  confidenceBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // ── Price input ─────────────────────────────────────────────────────────────
  inputWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 44,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputCheck: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  // ── Warning ─────────────────────────────────────────────────────────────────
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  blockedHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // ── Misc ────────────────────────────────────────────────────────────────────
  textarea: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  typeBtnTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});