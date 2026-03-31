import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
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
import {
  PropertyType,
  PropertyTypeLabels,
} from '../constants/Propertyenums ';
import {
  createProperty,
  CreatePropertyPayload,
} from '../services/Createpropertyservice';
import {
  fetchCitySuggestions,
  SuggestionDTO,
} from '../services/Propertyservice';

const { height, width } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.92;

// ─── Step indicator ────────────────────────────────────────────────────────────
const STEPS = ['Details', 'Location', 'Photos'];

// ─── Price Prediction types ────────────────────────────────────────────────────
interface PricePrediction {
  predictedPrice: number;
  priceRange: string;
  lowerBound: number;
  upperBound: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  similarPropertiesCount: number;
  priceDifferencePercent: number;
  note: string | null;
  cluster: number;
}

// Map PropertyType enum → API string (adjust keys to match your actual enum values)
const PROPERTY_TYPE_API_MAP: Record<string, string> = {
  [PropertyType.APARTMENT]: 'Appartement',
  [PropertyType.HOUSE]:     'Villa',
  [PropertyType.STUDIO]:    'Studio',
  [PropertyType.VILLA]:     'Villa',
  [PropertyType.OFFICE]:    'Bureau',
  [PropertyType.LAND]:      'Terrain',
};

const CONFIDENCE_CONFIG = {
  HIGH:   { color: '#10B981', bg: '#ECFDF5', label: 'High confidence' },
  MEDIUM: { color: '#F59E0B', bg: '#FFFBEB', label: 'Medium confidence' },
  LOW:    { color: '#EF4444', bg: '#FEF2F2', label: 'Low confidence' },
};

// ─── Price Prediction Banner ───────────────────────────────────────────────────
const PricePredictionBanner: React.FC<{
  prediction: PricePrediction | null;
  loading: boolean;
  error: string | null;
  enteredPrice: string;
}> = ({ prediction, loading, error, enteredPrice }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prediction || error) {
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [prediction, error]);

  if (loading) {
    return (
      <View style={bannerStyles.loadingCard}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={bannerStyles.loadingText}>Analysing market price…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[bannerStyles.card, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}>
        <Text style={bannerStyles.errorText}>⚠ Could not load prediction</Text>
        <Text style={bannerStyles.errorSub}>{error}</Text>
      </View>
    );
  }

  if (!prediction) return null;

  const conf = CONFIDENCE_CONFIG[prediction.confidence] ?? CONFIDENCE_CONFIG.MEDIUM;
  const price = parseFloat(enteredPrice);
  const noPrice  = !enteredPrice || isNaN(price);
  const tooLow   = !noPrice && price < prediction.lowerBound;
  const tooHigh  = !noPrice && price > prediction.upperBound;
  const inRange  = !noPrice && !tooLow && !tooHigh;

  const range = prediction.upperBound - prediction.lowerBound;
  const predictedPct = range > 0 ? ((prediction.predictedPrice - prediction.lowerBound) / range) * 100 : 50;
  const enteredPct   = !noPrice && range > 0
    ? Math.min(100, Math.max(0, ((price - prediction.lowerBound) / range) * 100))
    : null;

  return (
    <Animated.View
      style={[
        bannerStyles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      {/* Header row */}
      <View style={bannerStyles.row}>
        <View style={bannerStyles.aiTag}>
          <Text style={bannerStyles.aiTagText}>✦ AI Price Estimate</Text>
        </View>
        <View style={[bannerStyles.confBadge, { backgroundColor: conf.bg }]}>
          <View style={[bannerStyles.confDot, { backgroundColor: conf.color }]} />
          <Text style={[bannerStyles.confText, { color: conf.color }]}>{conf.label}</Text>
        </View>
      </View>

      {/* Predicted price */}
      <View style={bannerStyles.priceRow}>
        <Text style={bannerStyles.predictedLabel}>Predicted</Text>
        <Text style={bannerStyles.predictedPrice}>
          {Math.round(prediction.predictedPrice).toLocaleString()} DT
          <Text style={bannerStyles.perMonth}> / mo</Text>
        </Text>
      </View>

      {/* Range bar */}
      <View style={bannerStyles.rangeContainer}>
        <Text style={bannerStyles.rangeBound}>{Math.round(prediction.lowerBound).toLocaleString()}</Text>
        <View style={bannerStyles.rangeBar}>
          <View style={bannerStyles.rangeBarFill} />
          {/* Predicted marker */}
          <View style={[bannerStyles.marker, bannerStyles.markerPredicted, { left: `${predictedPct}%` as any }]} />
          {/* Entered price marker */}
          {enteredPct !== null && (
            <View
              style={[
                bannerStyles.marker,
                {
                  left: `${enteredPct}%` as any,
                  backgroundColor: tooLow || tooHigh ? '#EF4444' : '#10B981',
                  borderColor: Colors.white,
                },
              ]}
            />
          )}
        </View>
        <Text style={bannerStyles.rangeBound}>{Math.round(prediction.upperBound).toLocaleString()}</Text>
      </View>
      <Text style={bannerStyles.rangeLabel}>Market range: {prediction.priceRange}</Text>

      {/* Status feedback */}
      {tooLow && (
        <View style={[bannerStyles.alertRow, { backgroundColor: '#FEF2F2' }]}>
          <Text style={[bannerStyles.alertIcon, { color: '#EF4444' }]}>↓</Text>
          <Text style={[bannerStyles.alertText, { color: '#EF4444' }]}>
            Below market by {Math.round(prediction.lowerBound - price).toLocaleString()} DT — may seem suspicious to renters
          </Text>
        </View>
      )}
      {tooHigh && (
        <View style={[bannerStyles.alertRow, { backgroundColor: '#FEF2F2' }]}>
          <Text style={[bannerStyles.alertIcon, { color: '#EF4444' }]}>↑</Text>
          <Text style={[bannerStyles.alertText, { color: '#EF4444' }]}>
            Above market by {Math.round(price - prediction.upperBound).toLocaleString()} DT — may reduce visibility
          </Text>
        </View>
      )}
      {inRange && (
        <View style={[bannerStyles.alertRow, { backgroundColor: '#ECFDF5' }]}>
          <Text style={[bannerStyles.alertIcon, { color: '#10B981' }]}>✓</Text>
          <Text style={[bannerStyles.alertText, { color: '#10B981' }]}>
            Your price is within the recommended market range
          </Text>
        </View>
      )}

      {prediction.similarPropertiesCount > 0 && (
        <Text style={bannerStyles.similarCount}>
          Based on {prediction.similarPropertiesCount} similar properties
        </Text>
      )}
    </Animated.View>
  );
};

const bannerStyles = StyleSheet.create({
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  loadingText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  aiTagText: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.3 },
  confBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  confDot: { width: 7, height: 7, borderRadius: 4 },
  confText: { fontSize: 11, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  predictedLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  predictedPrice: { fontSize: 24, fontWeight: '800', color: Colors.text },
  perMonth: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  rangeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeBound: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', minWidth: 40, textAlign: 'center' },
  rangeBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8ECFF',
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  rangeBarFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#C7D0FF',
    borderRadius: 4,
  },
  marker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.white,
    top: -3,
    marginLeft: -7,
  },
  markerPredicted: { backgroundColor: Colors.primary },
  rangeLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  alertIcon: { fontSize: 16, fontWeight: '800', lineHeight: 20 },
  alertText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  similarCount: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  errorSub: { fontSize: 12, color: '#EF4444', opacity: 0.7 },
});

// ─── StepDot ──────────────────────────────────────────────────────────────────
const StepDot: React.FC<{ index: number; current: number }> = ({ index, current }) => {
  const scaleAnim = useRef(new Animated.Value(index === current ? 1 : 0.7)).current;
  const opacityAnim = useRef(new Animated.Value(index === current ? 1 : 0.35)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: index === current ? 1 : index < current ? 0.9 : 0.7, useNativeDriver: true, tension: 120 }),
      Animated.timing(opacityAnim, { toValue: index === current ? 1 : index < current ? 0.6 : 0.3, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [current]);

  return (
    <Animated.View style={[stepStyles.dot, index < current && stepStyles.dotDone, index === current && stepStyles.dotActive, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      {index < current ? (
        <Text style={stepStyles.dotCheck}>✓</Text>
      ) : (
        <Text style={[stepStyles.dotNum, index === current && stepStyles.dotNumActive]}>{index + 1}</Text>
      )}
    </Animated.View>
  );
};

const stepStyles = StyleSheet.create({
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  dotActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dotDone: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dotNum: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  dotNumActive: { color: Colors.white },
  dotCheck: { fontSize: 13, fontWeight: '800', color: Colors.white },
});

// ─── Field ────────────────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={fieldStyles.wrapper}>
    <Text style={fieldStyles.label}>{label}</Text>
    {children}
  </View>
);

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.textSecondary, marginBottom: 8 },
});

const inputStyle = {
  backgroundColor: Colors.white,
  borderWidth: 1.5,
  borderColor: Colors.border,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontSize: 15,
  color: Colors.text,
};

// ─── CounterInput ─────────────────────────────────────────────────────────────
const CounterInput: React.FC<{ value: number; onChange: (v: number) => void; min?: number }> = ({ value, onChange, min = 1 }) => (
  <View style={counterStyles.row}>
    <TouchableOpacity style={counterStyles.btn} onPress={() => onChange(Math.max(min, value - 1))}>
      <Text style={counterStyles.btnText}>−</Text>
    </TouchableOpacity>
    <Text style={counterStyles.val}>{value}</Text>
    <TouchableOpacity style={[counterStyles.btn, counterStyles.btnAdd]} onPress={() => onChange(value + 1)}>
      <Text style={[counterStyles.btnText, { color: Colors.white }]}>+</Text>
    </TouchableOpacity>
  </View>
);

const counterStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  btn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnAdd: { backgroundColor: Colors.primary },
  btnText: { fontSize: 22, color: Colors.primary, fontWeight: '600', lineHeight: 26 },
  val: { fontSize: 20, fontWeight: '800', color: Colors.text, minWidth: 28, textAlign: 'center' },
});

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreatePropertyModal: React.FC<Props> = ({ visible, onClose, onCreated }) => {
  const slideAnim   = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const stepSlideAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState(0);

  // form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [type, setType] = useState<PropertyType>(PropertyType.APARTMENT);
  const [pricePerMonth, setPricePerMonth] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<SuggestionDTO[]>([]);
  const [selectedCity, setSelectedCity] = useState<SuggestionDTO | null>(null);
  const [images, setImages] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // prediction
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // ── open/close ──
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: MODAL_HEIGHT, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => { setStep(0); resetForm(); });
    }
  }, [visible]);

  // ── step transition ──
  const goToStep = (next: number) => {
    const dir = next > step ? 1 : -1;
    Animated.sequence([
      Animated.timing(stepSlideAnim, { toValue: -dir * 40, duration: 150, useNativeDriver: true }),
      Animated.timing(stepSlideAnim, { toValue: dir * 40, duration: 0, useNativeDriver: true }),
      Animated.spring(stepSlideAnim, { toValue: 0, tension: 100, friction: 12, useNativeDriver: true }),
    ]).start();
    setStep(next);

    // Trigger prediction when entering step 2
    if (next === 2 && selectedCity) {
      fetchPricePrediction();
    }
  };

  // ── fetch prediction ──
  const fetchPricePrediction = async () => {
    if (!selectedCity) return;
    setPredictionLoading(true);
    setPredictionError(null);
    setPrediction(null);

    try {
      const body = {
        status: 'À louer',
        propertyType: PROPERTY_TYPE_API_MAP[type] ?? 'Appartement',
        city: selectedCity.name,
        state: selectedCity.parentName ?? selectedCity.name,
        bedrooms,
        bathrooms,
        sizeM2: area ? parseFloat(area) : 100.0,
      };

      const response = await fetch('http://localhost:8083/api/predictions/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data: PricePrediction = await response.json();
      setPrediction(data);

      // Auto-fill price with predicted value if user hasn't entered one
      if (!pricePerMonth) {
        setPricePerMonth(Math.round(data.predictedPrice).toString());
      }
    } catch (e: any) {
      setPredictionError(e.message ?? 'Unknown error');
    } finally {
      setPredictionLoading(false);
    }
  };

  // ── city autocomplete ──
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!cityQuery.trim()) { setCitySuggestions([]); return; }
      const s = await fetchCitySuggestions(cityQuery);
      setCitySuggestions(s);
    }, 300);
    return () => clearTimeout(t);
  }, [cityQuery]);

  // ── image picker ──
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const picked = result.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName ?? `photo_${Date.now()}.jpg`,
        type: a.mimeType ?? 'image/jpeg',
      }));
      setImages((prev) => [...prev, ...picked]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryIndex >= index && primaryIndex > 0) setPrimaryIndex(primaryIndex - 1);
  };

  // ── price validation helpers ──
  const isPriceOutOfRange = (): boolean => {
    if (!prediction || !pricePerMonth) return false;
    const price = parseFloat(pricePerMonth);
    if (isNaN(price)) return false;
    return price < prediction.lowerBound || price > prediction.upperBound;
  };

  // ── submit ──
  const handleSubmit = async () => {
    if (!selectedCity) { Alert.alert('Error', 'Please select a city'); return; }
    if (!title || !pricePerMonth) { Alert.alert('Error', 'Fill all required fields'); return; }

    if (isPriceOutOfRange() && prediction) {
      Alert.alert(
        'Price Outside Market Range',
        `Your price (${parseInt(pricePerMonth).toLocaleString()} DT/mo) is outside the suggested range of ${prediction.priceRange}.\n\nThis may affect how quickly your listing attracts tenants.`,
        [
          { text: 'Go Back & Adjust', style: 'cancel' },
          { text: 'Publish Anyway', style: 'destructive', onPress: submitProperty },
        ]
      );
      return;
    }

    submitProperty();
  };

  const submitProperty = async () => {
    setSubmitting(true);
    try {
      const payload: CreatePropertyPayload = {
        title, description, bedrooms, bathrooms, type, address,
        cityId: selectedCity!.id,
        pricePerMonth: parseFloat(pricePerMonth),
        area: area ? parseFloat(area) : undefined,
        primaryImageIndex: primaryIndex,
        images,
      };
      await createProperty(payload);
      onCreated();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setBedrooms(1); setBathrooms(1);
    setType(PropertyType.APARTMENT); setPricePerMonth(''); setArea('');
    setAddress(''); setCityQuery(''); setSelectedCity(null);
    setCitySuggestions([]); setImages([]); setPrimaryIndex(0);
    setPrediction(null); setPredictionError(null); setPredictionLoading(false);
  };

  const canProceed = () => {
    if (step === 0) return title.trim().length > 0 && pricePerMonth.trim().length > 0;
    if (step === 1) return address.trim().length > 0 && selectedCity !== null;
    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>New Listing</Text>
            <Text style={styles.headerTitle}>Add Property</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stepRow}>
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <View style={styles.stepItem}>
                <StepDot index={i} current={step} />
                <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <Animated.View
            style={[
              styles.stepContent,
              {
                opacity: stepSlideAnim.interpolate({ inputRange: [-40, 0, 40], outputRange: [0, 1, 0] }),
                transform: [{ translateX: stepSlideAnim }],
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Step 0: Details ── */}
              {step === 0 && (
                <View>
                  <Field label="Title *">
                    <TextInput
                      style={inputStyle}
                      placeholder="e.g. Sunny 2BR in Downtown"
                      placeholderTextColor={Colors.textSecondary}
                      value={title}
                      onChangeText={setTitle}
                    />
                  </Field>

                  <Field label="Description">
                    <TextInput
                      style={[inputStyle, { height: 90, textAlignVertical: 'top' }]}
                      placeholder="Describe your property..."
                      placeholderTextColor={Colors.textSecondary}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                    />
                  </Field>

                  <Field label="Property Type">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {Object.values(PropertyType).map((t) => (
                          <TouchableOpacity
                            key={t}
                            style={[styles.typeChip, type === t && styles.typeChipActive]}
                            onPress={() => setType(t)}
                          >
                            <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                              {PropertyTypeLabels[t]}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </Field>

                  <View style={styles.rowFields}>
                    <View style={{ flex: 1 }}>
                      <Field label="🛏 Bedrooms">
                        <CounterInput value={bedrooms} onChange={setBedrooms} />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="🚿 Bathrooms">
                        <CounterInput value={bathrooms} onChange={setBathrooms} />
                      </Field>
                    </View>
                  </View>

                  <View style={styles.rowFields}>
                    <View style={{ flex: 1 }}>
                      <Field label="Price / Month *">
                        <TextInput
                          style={[
                            inputStyle,
                            prediction && isPriceOutOfRange() && { borderColor: '#EF4444' },
                            prediction && !isPriceOutOfRange() && pricePerMonth
                              ? { borderColor: '#10B981' }
                              : {},
                          ]}
                          placeholder="DT"
                          placeholderTextColor={Colors.textSecondary}
                          value={pricePerMonth}
                          onChangeText={setPricePerMonth}
                          keyboardType="numeric"
                        />
                        {prediction && (
                          <Text style={styles.priceHint}>
                            Suggested: {Math.round(prediction.lowerBound).toLocaleString()} – {Math.round(prediction.upperBound).toLocaleString()} DT
                          </Text>
                        )}
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Area (m²)">
                        <TextInput
                          style={inputStyle}
                          placeholder="Optional"
                          placeholderTextColor={Colors.textSecondary}
                          value={area}
                          onChangeText={setArea}
                          keyboardType="numeric"
                        />
                      </Field>
                    </View>
                  </View>
                </View>
              )}

              {/* ── Step 1: Location ── */}
              {step === 1 && (
                <View>
                  <Field label="Street Address *">
                    <TextInput
                      style={inputStyle}
                      placeholder="123 Main St"
                      placeholderTextColor={Colors.textSecondary}
                      value={address}
                      onChangeText={setAddress}
                    />
                  </Field>

                  <Field label="City *">
                    <View style={{ position: 'relative', zIndex: 10 }}>
                      <TextInput
                        style={[inputStyle, selectedCity && { borderColor: Colors.primary }]}
                        placeholder="Search city..."
                        placeholderTextColor={Colors.textSecondary}
                        value={cityQuery}
                        onChangeText={(t) => {
                          setCityQuery(t);
                          if (!t) setSelectedCity(null);
                        }}
                      />
                      {selectedCity && (
                        <View style={styles.cityBadge}>
                          <Text style={styles.cityBadgeText}>
                            📍 {selectedCity.name}{selectedCity.parentName ? `, ${selectedCity.parentName}` : ''}
                          </Text>
                          <TouchableOpacity onPress={() => { setSelectedCity(null); setCityQuery(''); }}>
                            <Text style={styles.cityBadgeClear}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {!selectedCity && citySuggestions.length > 0 && (
                        <View style={styles.dropdown}>
                          {citySuggestions.map((s) => (
                            <TouchableOpacity
                              key={s.id}
                              style={styles.dropdownItem}
                              onPress={() => { setSelectedCity(s); setCityQuery(s.name); setCitySuggestions([]); }}
                            >
                              <Text style={styles.dropdownName}>{s.name}</Text>
                              {s.parentName && <Text style={styles.dropdownSub}>{s.parentName}</Text>}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </Field>
                </View>
              )}

              {/* ── Step 2: Photos ── */}
              {step === 2 && (
                <View>
                  {/* ── Price prediction banner ── */}
                  <PricePredictionBanner
                    prediction={prediction}
                    loading={predictionLoading}
                    error={predictionError}
                    enteredPrice={pricePerMonth}
                  />

                  {/* Price field — editable here so user can react to the prediction */}
                  <Field label="Price / Month *">
                    <TextInput
                      style={[
                        inputStyle,
                        prediction && isPriceOutOfRange()
                          ? { borderColor: '#EF4444', borderWidth: 2 }
                          : prediction && !isPriceOutOfRange() && pricePerMonth
                          ? { borderColor: '#10B981', borderWidth: 2 }
                          : {},
                      ]}
                      placeholder="Enter monthly price (DT)"
                      placeholderTextColor={Colors.textSecondary}
                      value={pricePerMonth}
                      onChangeText={setPricePerMonth}
                      keyboardType="numeric"
                    />
                    {prediction && isPriceOutOfRange() && (
                      <Text style={styles.priceErrorHint}>
                        Outside range · Suggested: {prediction.priceRange}
                      </Text>
                    )}
                    {prediction && !isPriceOutOfRange() && pricePerMonth && (
                      <Text style={styles.priceGoodHint}>✓ Within market range</Text>
                    )}
                  </Field>

                  <TouchableOpacity style={styles.pickBtn} onPress={pickImages}>
                    <Text style={styles.pickBtnIcon}>
                      <MaterialCommunityIcons name="camera" size={20} color="#000" />
                    </Text>
                    <Text style={styles.pickBtnText}>Add Photos</Text>
                  </TouchableOpacity>

                  {images.length > 0 && (
                    <View style={styles.imageGrid}>
                      {images.map((img, i) => (
                        <View key={i} style={styles.imageItem}>
                          <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                          <TouchableOpacity
                            style={[styles.primaryBadge, i === primaryIndex && styles.primaryBadgeActive]}
                            onPress={() => setPrimaryIndex(i)}
                          >
                            <Text style={styles.primaryBadgeText}>{i === primaryIndex ? '★ Main' : '☆'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(i)}>
                            <Text style={styles.removeImgText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {images.length === 0 && (
                    <View style={styles.noImages}>
                      <Text style={styles.noImagesIcon}>
                        <MaterialCommunityIcons name="image" size={48} color={Colors.textSecondary} />
                      </Text>
                      <Text style={styles.noImagesText}>No photos yet</Text>
                      <Text style={styles.noImagesSub}>Tap above to add some</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={styles.footer}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => goToStep(step - 1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < STEPS.length - 1 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
              onPress={() => canProceed() && goToStep(step + 1)}
              activeOpacity={canProceed() ? 0.85 : 1}
            >
              <Text style={styles.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.submitBtn,
                submitting && { opacity: 0.7 },
                isPriceOutOfRange() && styles.submitBtnWarning,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>
                  <MaterialCommunityIcons
                    name={isPriceOutOfRange() ? 'alert' : 'rocket-launch'}
                    size={18}
                    color="#fff"
                  />{' '}
                  {isPriceOutOfRange() ? 'Publish Anyway' : 'Publish Property'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

export default CreatePropertyModal;

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,25,55,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: MODAL_HEIGHT,
    backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 24,
  },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 22, paddingTop: 16, paddingBottom: 12 },
  headerEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.primary, marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  stepItem: { alignItems: 'center', gap: 4 },
  stepLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepLabelActive: { color: Colors.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 8, marginBottom: 14, borderRadius: 1 },
  stepLineDone: { backgroundColor: Colors.primary },
  stepContent: { flex: 1 },
  scrollBody: { padding: 22, paddingBottom: 20 },
  rowFields: { flexDirection: 'row', gap: 14 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.white },
  cityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  cityBadgeText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  cityBadgeClear: { fontSize: 13, color: Colors.textSecondary, paddingLeft: 8 },
  dropdown: {
    position: 'absolute', top: 54, left: 0, right: 0, backgroundColor: Colors.white,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16,
    elevation: 8, zIndex: 100, overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropdownName: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  dropdownSub: { fontSize: 12, color: Colors.textSecondary },
  priceHint: { fontSize: 11, color: Colors.primary, marginTop: 5, fontWeight: '600' },
  priceErrorHint: { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '600' },
  priceGoodHint: { fontSize: 11, color: '#10B981', marginTop: 5, fontWeight: '600' },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: 16,
    paddingVertical: 18, marginBottom: 20, backgroundColor: '#F0F3FF',
  },
  pickBtnIcon: { fontSize: 22 },
  pickBtnText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageItem: { width: (width - 66) / 3, position: 'relative' },
  imageThumb: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: Colors.border },
  primaryBadge: { position: 'absolute', bottom: 6, left: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.45)' },
  primaryBadgeActive: { backgroundColor: Colors.primary },
  primaryBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  removeImg: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  removeImgText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  noImages: { alignItems: 'center', paddingTop: 40, gap: 8 },
  noImagesIcon: { fontSize: 48 },
  noImagesText: { fontSize: 17, fontWeight: '700', color: Colors.text },
  noImagesSub: { fontSize: 13, color: Colors.textSecondary },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12 },
  backBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: { flex: 2, height: 50, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  submitBtn: { flex: 2, height: 50, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnWarning: { backgroundColor: '#F59E0B' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
