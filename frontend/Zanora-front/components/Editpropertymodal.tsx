import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export type PropertyStatus = 'AVAILABLE' | 'RENTED' | 'PENDING' | 'INACTIVE';
export type PropertyType = 'HOUSE' | 'OFFICE' | 'APARTMENT' | 'STUDIO';

export interface EditPropertyFormData {
  title: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  type: string;
  address: string;
  area: string;
  pricePerMonth: string;
  status: string;
  // new:
  imageIdsToDelete?: number[];   // existing image IDs to remove
  newImages?: { uri: string; name?: string; mimeType?: string }[]; // newly picked images
  primaryImageIndex?: number;
}
interface PricePrediction {
  predictedPrice: number;
  priceRange: string;
  lowerBound: number;
  upperBound: number;
  confidence: string;
}

interface EditPropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: EditPropertyFormData) => Promise<void>;
  onDelete: () => void;
  initialData: EditPropertyFormData;
  cityName?: string;
  submitting: boolean;
}

const STATUSES: PropertyStatus[] = ['AVAILABLE', 'RENTED', 'PENDING', 'INACTIVE'];
const TYPES: PropertyType[] = ['HOUSE', 'OFFICE', 'APARTMENT', 'STUDIO'];

const STATUS_COLORS: Record<PropertyStatus, string> = {
  AVAILABLE: '#27AE60',
  RENTED: '#E74C3C',
  PENDING: '#F39C12',
  INACTIVE: '#95A5A6',
};

const TYPE_TO_API: Record<PropertyType, string> = {
  APARTMENT: 'Appartement',
  HOUSE: 'Villa',
  STUDIO: 'Studio',
  OFFICE: 'Bureau',
};

export default function EditPropertyModal({
  visible,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  cityName,
  submitting,
}: EditPropertyModalProps) {
  const [form, setForm] = useState<EditPropertyFormData>(initialData);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const predictionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setForm(initialData);
      setPrediction(null);
      setPriceError(null);
      Animated.spring(slideAnim, { toValue: 1, tension: 65, friction: 12, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (predictionTimer.current) clearTimeout(predictionTimer.current);
    predictionTimer.current = setTimeout(fetchPrediction, 900);
    return () => { if (predictionTimer.current) clearTimeout(predictionTimer.current); };
  }, [form.type, form.bedrooms, form.bathrooms, form.area, visible]);

  useEffect(() => {
    if (!prediction || !form.pricePerMonth) { setPriceError(null); return; }
    const price = parseFloat(form.pricePerMonth);
    if (isNaN(price)) { setPriceError(null); return; }
    if (price < prediction.lowerBound) {
      setPriceError(`Below recommended range: ${Math.round(prediction.lowerBound)} – ${Math.round(prediction.upperBound)} DT`);
    } else if (price > prediction.upperBound) {
      setPriceError(`Above recommended range: ${Math.round(prediction.lowerBound)} – ${Math.round(prediction.upperBound)} DT`);
    } else {
      setPriceError(null);
    }
  }, [form.pricePerMonth, prediction]);

  const fetchPrediction = async () => {
    const beds = parseInt(form.bedrooms);
    const baths = parseInt(form.bathrooms);
    const size = parseFloat(form.area);
    if (!beds || !baths || !size || isNaN(beds) || isNaN(baths) || isNaN(size)) return;
    setPredictionLoading(true);
    try {
      const payload = {
        status: 'À louer',
        propertyType: TYPE_TO_API[form.type] ?? 'Appartement',
        city: cityName ?? 'Tunis',
        state: cityName ?? 'Tunis',
        bedrooms: beds,
        bathrooms: baths,
        sizeM2: size,
      };
      const res = await fetch('http://localhost:8083/api/predictions/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data: PricePrediction = await res.json();
        setPrediction(data);
      }
    } catch (e) {
      console.warn('[Prediction] error:', e);
    } finally {
      setPredictionLoading(false);
    }
  };

  const update = (key: keyof EditPropertyFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
    if (!form.title.trim()) {
        Alert.alert('Validation', 'Title is required.');
        return;
    }

    const area = parseFloat(form.area);
    if (!form.area || isNaN(area) || area <= 0) {
        Alert.alert('Validation', 'Please enter a valid area.');
        return;
    }

    const price = parseFloat(form.pricePerMonth);
    if (!form.pricePerMonth || isNaN(price) || price <= 0) {
        Alert.alert('Validation', 'Please enter a valid price.');
        return;
    }

    await onSubmit(form);
    };

  const handleDelete = () => {
    Alert.alert(
      'Delete Property',
      'Permanently delete this property? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const confidenceColor = (c: string) =>
    c === 'HIGH' ? '#27AE60' : c === 'MEDIUM' ? '#F39C12' : '#E74C3C';

  const getCursorLeft = () => {
    if (!prediction || !trackWidth) return 0;
    const lo = prediction.lowerBound * 0.75;
    const hi = prediction.upperBound * 1.25;
    const price = parseFloat(form.pricePerMonth) || 0;
    const clamped = Math.max(lo, Math.min(hi, price));
    return ((clamped - lo) / (hi - lo)) * trackWidth - 10; // -10 to center 20px dot
  };

  const getZoneLeft = () => {
    if (!prediction || !trackWidth) return 0;
    const lo = prediction.lowerBound * 0.75;
    const hi = prediction.upperBound * 1.25;
    return ((prediction.lowerBound - lo) / (hi - lo)) * trackWidth;
  };

  const getZoneWidth = () => {
    if (!prediction || !trackWidth) return 0;
    const lo = prediction.lowerBound * 0.75;
    const hi = prediction.upperBound * 1.25;
    return ((prediction.upperBound - prediction.lowerBound) / (hi - lo)) * trackWidth;
  };

  const currentPrice = parseFloat(form.pricePerMonth) || 0;
  const inRange = prediction
    ? currentPrice >= prediction.lowerBound && currentPrice <= prediction.upperBound
    : true;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          style={[s.sheet, { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] }]}
        >
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>Edit Property</Text>
              <Text style={s.headerSub}>Update your listing details</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

            {/* Title */}
            <FieldLabel icon="format-title" label="Title" />
            <TextInput style={s.input} value={form.title} onChangeText={(v) => update('title', v)} placeholder="Property title" placeholderTextColor={Colors.textSecondary} />

            {/* Description */}
            <FieldLabel icon="text-long" label="Description" />
            <TextInput style={[s.input, s.textarea]} value={form.description} onChangeText={(v) => update('description', v)} placeholder="Describe your property..." placeholderTextColor={Colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" />

            {/* Type */}
            <FieldLabel icon="home-variant-outline" label="Property Type" />
            <View style={s.chipRow}>
              {TYPES.map((t) => (
                <TouchableOpacity key={t} style={[s.chip, form.type === t && s.chipActive]} onPress={() => update('type', t)}>
                  <Text style={[s.chipText, form.type === t && s.chipTextActive]}>{t.charAt(0) + t.slice(1).toLowerCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status */}
            <FieldLabel icon="toggle-switch-outline" label="Status" />
            <View style={s.chipRow}>
              {STATUSES.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[s.chip, form.status === st && { backgroundColor: STATUS_COLORS[st] + '22', borderColor: STATUS_COLORS[st] }]}
                  onPress={() => update('status', st)}
                >
                  <View style={[s.dot, { backgroundColor: STATUS_COLORS[st] }]} />
                  <Text style={[s.chipText, form.status === st && { color: STATUS_COLORS[st], fontWeight: '700' }]}>
                    {st.charAt(0) + st.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Address */}
            <FieldLabel icon="map-marker-outline" label="Address" />
            <TextInput style={s.input} value={form.address} onChangeText={(v) => update('address', v)} placeholder="Street address" placeholderTextColor={Colors.textSecondary} />

            {/* Bedrooms / Bathrooms */}
            <View style={s.rowFields}>
              <View style={s.halfField}>
                <FieldLabel icon="bed-outline" label="Bedrooms" />
                <TextInput style={s.input} value={form.bedrooms} onChangeText={(v) => update('bedrooms', v)} keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.textSecondary} />
              </View>
              <View style={s.halfField}>
                <FieldLabel icon="shower" label="Bathrooms" />
                <TextInput style={s.input} value={form.bathrooms} onChangeText={(v) => update('bathrooms', v)} keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.textSecondary} />
              </View>
            </View>

            {/* Area / Price */}
            <View style={s.rowFields}>
              <View style={s.halfField}>
                <FieldLabel icon="ruler-square" label="Area (m²)" />
                <TextInput style={s.input} value={form.area} onChangeText={(v) => update('area', v)} keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.textSecondary} />
              </View>
              <View style={s.halfField}>
                <FieldLabel icon="currency-usd" label="Price / month" />
                <TextInput style={[s.input, priceError ? s.inputError : null]} value={form.pricePerMonth} onChangeText={(v) => update('pricePerMonth', v)} keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.textSecondary} />
              </View>
            </View>

            {priceError ? (
              <View style={s.errorBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#E74C3C" />
                <Text style={s.errorBannerText}>{priceError}</Text>
              </View>
            ) : null}

            {/* AI Prediction card */}
            <View style={s.predictionCard}>
              <View style={s.predictionHeader}>
                <MaterialCommunityIcons name="brain" size={16} color={Colors.primary} />
                <Text style={s.predictionTitle}>AI Price Suggestion</Text>
                {predictionLoading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 6 }} />}
              </View>

              {prediction ? (
                <View>
                  <View style={s.predictionRow}>
                    <Text style={s.predictionLabel}>Suggested range</Text>
                    <Text style={s.predictionValue}>{prediction.priceRange}</Text>
                  </View>
                  <View style={s.predictionRow}>
                    <Text style={s.predictionLabel}>Predicted price</Text>
                    <Text style={s.predictionValue}>{Math.round(prediction.predictedPrice).toLocaleString()} DT</Text>
                  </View>
                  <View style={s.predictionRow}>
                    <Text style={s.predictionLabel}>Confidence</Text>
                    <View style={[s.confidenceBadge, { backgroundColor: confidenceColor(prediction.confidence) + '22' }]}>
                      <Text style={[s.confidenceText, { color: confidenceColor(prediction.confidence) }]}>{prediction.confidence}</Text>
                    </View>
                  </View>

                  {/* Range bar — pixel positions measured via onLayout */}
                  {form.pricePerMonth ? (
                    <View style={s.rangeContainer}>
                      <Text style={s.rangeBarLabel}>Your price position</Text>
                      <View
                        style={s.rangeTrack}
                        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                      >
                        {trackWidth > 0 && (
                          <>
                            <View style={[s.rangeZone, { left: getZoneLeft(), width: getZoneWidth() }]} />
                            <View style={[s.rangeCursor, { left: getCursorLeft(), backgroundColor: inRange ? '#27AE60' : '#E74C3C' }]} />
                          </>
                        )}
                      </View>
                      <View style={s.rangeLabelsRow}>
                        <Text style={s.rangeLabelText}>{Math.round(prediction.lowerBound).toLocaleString()} DT</Text>
                        <Text style={s.rangeLabelText}>{Math.round(prediction.upperBound).toLocaleString()} DT</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={s.predictionHint}>Fill in bedrooms, bathrooms, and area to get a price suggestion.</Text>
              )}
            </View>

            
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn, submitting && s.saveBtnDisabled]} onPress={handleSubmit} activeOpacity={0.85} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                  <Text style={s.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FieldLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={s.fieldLabel}>
      <MaterialCommunityIcons name={icon as any} size={14} color={Colors.textSecondary} />
      <Text style={s.fieldLabelText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, paddingBottom: 16 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6, marginTop: 14 },
  fieldLabelText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10, fontSize: 15, color: Colors.text, backgroundColor: Colors.white },
  inputError: { borderColor: '#E74C3C' },
  textarea: { height: 90, paddingTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  dot: { width: 7, height: 7, borderRadius: 4 },
  rowFields: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E74C3C15', borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#E74C3C33' },
  errorBannerText: { fontSize: 12, color: '#E74C3C', flex: 1, fontWeight: '500' },
  predictionCard: { marginTop: 20, backgroundColor: `${Colors.primary}08`, borderRadius: 16, borderWidth: 1.5, borderColor: `${Colors.primary}25`, padding: 16 },
  predictionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  predictionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, flex: 1 },
  predictionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  predictionLabel: { fontSize: 13, color: Colors.textSecondary },
  predictionValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  confidenceText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  predictionHint: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  rangeContainer: { marginTop: 14 },
  rangeBarLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  rangeTrack: { height: 12, backgroundColor: Colors.border, borderRadius: 6, position: 'relative', overflow: 'visible' },
  rangeZone: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#27AE6030', borderWidth: 1, borderColor: '#27AE6060', borderRadius: 4 },
  rangeCursor: { position: 'absolute', top: -4, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#fff', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  rangeLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rangeLabelText: { fontSize: 11, color: Colors.textSecondary },
  dangerZone: { marginTop: 24, borderRadius: 14, borderWidth: 1.5, borderColor: '#E74C3C33', backgroundColor: '#E74C3C08', padding: 16 },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dangerTitle: { fontSize: 13, fontWeight: '700', color: '#E74C3C' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E74C3C55', backgroundColor: '#fff' },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#E74C3C' },
  footer: { flexDirection: 'row', gap: 12, padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});