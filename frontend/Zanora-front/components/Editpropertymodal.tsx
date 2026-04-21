import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
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
  imageIdsToDelete?: number[];
  newImages?: { uri: string; name?: string; mimeType?: string }[];
  primaryImageIndex?: number;
}

interface ExistingImage {
  id: number;
  isPrimary: boolean;
  contentType: string;
}

interface NewImage {
  uri: string;
  name?: string;
  mimeType?: string;
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
  propertyId: number;
  cityName?: string;
  submitting: boolean;
}

const BASE_URL = 'http://192.168.0.109:8080';

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

// ─── Image API helpers ────────────────────────────────────────────────────────

async function fetchImagesMeta(propertyId: number): Promise<ExistingImage[]> {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${BASE_URL}/api/properties/${propertyId}/images`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch images');
  return res.json();
}

async function deleteImageAPI(propertyId: number, imageId: number): Promise<void> {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(
    `${BASE_URL}/api/properties/${propertyId}/images/${imageId}`,
    {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  if (!res.ok) throw new Error('Failed to delete image');
}



async function uploadImagesAPI(
  propertyId: number,
  newImages: NewImage[]
): Promise<void> {
  const token = await AsyncStorage.getItem('token');
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const formData = new FormData();
  formData.append('primaryIndex', '0');

  for (let i = 0; i < newImages.length; i++) {
    const img = newImages[i];

    if (Platform.OS === 'web') {
      const response = await fetch(img.uri);
      const blob = await response.blob();
      const file = new File([blob], img.name ?? `image_${i}.jpg`, {
        type: img.mimeType ?? 'image/jpeg',
      });
      formData.append('files', file);
    } else {
      formData.append('files', {
        uri: img.uri,
        name: img.name ?? `image_${i}.jpg`,
        type: img.mimeType ?? 'image/jpeg',
      } as any);
    }
  }

  const res = await fetch(
    `${BASE_URL}/api/properties/${propertyId}/images`,
    {
      method: 'POST',
      headers, // No Content-Type — let fetch set multipart/form-data + boundary
      body: formData,
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(errText || `Upload failed: ${res.status}`);
  }
}
// ─── Component ────────────────────────────────────────────────────────────────

export default function EditPropertyModal({
  visible,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  propertyId,
  cityName,
  submitting,
}: EditPropertyModalProps) {
  const [form, setForm] = useState<EditPropertyFormData>(initialData);

  // Images state
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Prediction state
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const predictionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setForm(initialData);
      setNewImages([]);
      setPrediction(null);
      setPriceError(null);
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 65,
        friction: 12,
        useNativeDriver: true,
      }).start();
      loadImages();
    } else {
      slideAnim.setValue(0);
      setExistingImages([]);
      setNewImages([]);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (predictionTimer.current) clearTimeout(predictionTimer.current);
    predictionTimer.current = setTimeout(fetchPrediction, 900);
    return () => {
      if (predictionTimer.current) clearTimeout(predictionTimer.current);
    };
  }, [form.type, form.bedrooms, form.bathrooms, form.area, visible]);

  useEffect(() => {
    if (!prediction || !form.pricePerMonth) {
      setPriceError(null);
      return;
    }
    const price = parseFloat(form.pricePerMonth);
    if (isNaN(price)) { setPriceError(null); return; }
    if (price < prediction.lowerBound) {
      setPriceError(
        `Below recommended range: ${Math.round(prediction.lowerBound)} – ${Math.round(prediction.upperBound)} DT`
      );
    } else if (price > prediction.upperBound) {
      setPriceError(
        `Above recommended range: ${Math.round(prediction.lowerBound)} – ${Math.round(prediction.upperBound)} DT`
      );
    } else {
      setPriceError(null);
    }
  }, [form.pricePerMonth, prediction]);

  // ── Image loading ──────────────────────────────────────────────────────────
  const loadImages = async () => {
    if (!propertyId) return;
    setImagesLoading(true);
    try {
      const data = await fetchImagesMeta(propertyId);
      setExistingImages(data);
    } catch (e) {
      console.warn('[Images] load error:', e);
    } finally {
      setImagesLoading(false);
    }
  };

  // ── Delete existing image ──────────────────────────────────────────────────
  const handleDeleteExistingImage = (imageId: number) => {
    Alert.alert(
      'Delete Image',
      'Remove this image from the property?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingImageId(imageId);
            try {
              await deleteImageAPI(propertyId, imageId);
              setExistingImages((prev) => prev.filter((i) => i.id !== imageId));
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not delete image');
            } finally {
              setDeletingImageId(null);
            }
          },
        },
      ]
    );
  };

  // ── Remove newly picked image (before upload) ──────────────────────────────
  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Pick images from library ───────────────────────────────────────────────
  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: 10,
        // These are critical — ensures we get back full file info
        exif: false,
        base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
        const picked: NewImage[] = result.assets.map((a, i) => {
        console.log(`[Picker] asset ${i}:`, JSON.stringify(a));
        return {
            uri: a.uri,
            name: a.fileName ?? `photo_${Date.now()}_${i}.jpg`,
            mimeType: a.mimeType ?? 'image/jpeg',
        };
        });
        setNewImages((prev) => [...prev, ...picked]);
    }
    };

  // ── Upload newly picked images ─────────────────────────────────────────────
  const handleUploadNewImages = async () => {
    if (newImages.length === 0) return;
    setUploadingImages(true);
    try {
      await uploadImagesAPI(propertyId, newImages);
      setNewImages([]);
      await loadImages(); // refresh from server
      Alert.alert('Success', `${newImages.length} image(s) uploaded.`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  // ── Prediction ─────────────────────────────────────────────────────────────
  const fetchPrediction = async () => {
    const beds = parseInt(form.bedrooms);
    const baths = parseInt(form.bathrooms);
    const size = parseFloat(form.area);
    if (!beds || !baths || !size || isNaN(beds) || isNaN(baths) || isNaN(size)) return;
    setPredictionLoading(true);
    try {
      const payload = {
        status: 'À louer',
        propertyType: TYPE_TO_API[form.type as PropertyType] ?? 'Appartement',
        city: cityName ?? 'Tunis',
        state: cityName ?? 'Tunis',
        bedrooms: beds,
        bathrooms: baths,
        sizeM2: size,
      };
      const res = await fetch('http://192.168.0.109:8083/api/predictions/predict', {
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
    return ((clamped - lo) / (hi - lo)) * trackWidth - 10;
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

  const totalImageCount = existingImages.length + newImages.length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            s.sheet,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
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

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.body}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── IMAGES SECTION ─────────────────────────────────────────── */}
            <View style={s.imagesSection}>
              <View style={s.imagesSectionHeader}>
                <View style={s.imagesSectionLeft}>
                  <MaterialCommunityIcons
                    name="image-multiple-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={s.imagesSectionTitle}>Property Photos</Text>
                  <View style={s.imageCountBadge}>
                    <Text style={s.imageCountText}>{totalImageCount}</Text>
                  </View>
                </View>
                {newImages.length > 0 && (
                  <TouchableOpacity
                    style={[s.uploadBtn, uploadingImages && s.uploadBtnDisabled]}
                    onPress={handleUploadNewImages}
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="cloud-upload-outline" size={14} color="#fff" />
                        <Text style={s.uploadBtnText}>Upload {newImages.length}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {imagesLoading ? (
                <View style={s.imagesLoadingRow}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text style={s.imagesLoadingText}>Loading photos…</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.imagesScrollContent}
                >
                  {/* Existing images */}
                  {existingImages.map((img) => (
                    <View key={`existing-${img.id}`} style={s.thumbContainer}>
                      <Image
                        source={{
                          uri: `${BASE_URL}/api/properties/${propertyId}/images/${img.id}/data`,
                          headers: { 'Cache-Control': 'no-cache' },
                        }}
                        style={s.thumbImage}
                        resizeMode="cover"
                      />
                      {img.isPrimary && (
                        <View style={s.primaryBadge}>
                          <MaterialCommunityIcons name="star" size={8} color="#fff" />
                          <Text style={s.primaryBadgeText}>Main</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={s.thumbDeleteBtn}
                        onPress={() => handleDeleteExistingImage(img.id)}
                        disabled={deletingImageId === img.id}
                        hitSlop={4}
                      >
                        {deletingImageId === img.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <MaterialCommunityIcons name="close" size={12} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Newly picked (not yet uploaded) */}
                  {newImages.map((img, index) => (
                    <View key={`new-${index}`} style={s.thumbContainer}>
                      <Image
                        source={{ uri: img.uri }}
                        style={s.thumbImage}
                        resizeMode="cover"
                      />
                      <View style={s.pendingBadge}>
                        <Text style={s.pendingBadgeText}>New</Text>
                      </View>
                      <TouchableOpacity
                        style={s.thumbDeleteBtn}
                        onPress={() => handleRemoveNewImage(index)}
                        hitSlop={4}
                      >
                        <MaterialCommunityIcons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add button */}
                  <TouchableOpacity style={s.addImageBtn} onPress={handlePickImages}>
                    <View style={s.addImageInner}>
                      <MaterialCommunityIcons
                        name="plus"
                        size={24}
                        color={Colors.primary}
                      />
                      <Text style={s.addImageText}>Add{'\n'}Photos</Text>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              )}

              {newImages.length > 0 && (
                <View style={s.pendingNotice}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={13}
                    color={Colors.primary}
                  />
                  <Text style={s.pendingNoticeText}>
                    {newImages.length} photo{newImages.length > 1 ? 's' : ''} ready to
                    upload — tap "Upload" to save them.
                  </Text>
                </View>
              )}
            </View>

            {/* ── FORM FIELDS ────────────────────────────────────────────── */}

            {/* Title */}
            <FieldLabel icon="format-title" label="Title" />
            <TextInput
              style={s.input}
              value={form.title}
              onChangeText={(v) => update('title', v)}
              placeholder="Property title"
              placeholderTextColor={Colors.textSecondary}
            />

            {/* Description */}
            <FieldLabel icon="text-long" label="Description" />
            <TextInput
              style={[s.input, s.textarea]}
              value={form.description}
              onChangeText={(v) => update('description', v)}
              placeholder="Describe your property…"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Type */}
            <FieldLabel icon="home-variant-outline" label="Property Type" />
            <View style={s.chipRow}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.chip, form.type === t && s.chipActive]}
                  onPress={() => update('type', t)}
                >
                  <Text style={[s.chipText, form.type === t && s.chipTextActive]}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status */}
            <FieldLabel icon="toggle-switch-outline" label="Status" />
            <View style={s.chipRow}>
              {STATUSES.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    s.chip,
                    form.status === st && {
                      backgroundColor: STATUS_COLORS[st] + '22',
                      borderColor: STATUS_COLORS[st],
                    },
                  ]}
                  onPress={() => update('status', st)}
                >
                  <View style={[s.dot, { backgroundColor: STATUS_COLORS[st] }]} />
                  <Text
                    style={[
                      s.chipText,
                      form.status === st && {
                        color: STATUS_COLORS[st],
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {st.charAt(0) + st.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Address */}
            <FieldLabel icon="map-marker-outline" label="Address" />
            <TextInput
              style={s.input}
              value={form.address}
              onChangeText={(v) => update('address', v)}
              placeholder="Street address"
              placeholderTextColor={Colors.textSecondary}
            />

            {/* Bedrooms / Bathrooms */}
            <View style={s.rowFields}>
              <View style={s.halfField}>
                <FieldLabel icon="bed-outline" label="Bedrooms" />
                <TextInput
                  style={s.input}
                  value={form.bedrooms}
                  onChangeText={(v) => update('bedrooms', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={s.halfField}>
                <FieldLabel icon="shower" label="Bathrooms" />
                <TextInput
                  style={s.input}
                  value={form.bathrooms}
                  onChangeText={(v) => update('bathrooms', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            {/* Area / Price */}
            <View style={s.rowFields}>
              <View style={s.halfField}>
                <FieldLabel icon="ruler-square" label="Area (m²)" />
                <TextInput
                  style={s.input}
                  value={form.area}
                  onChangeText={(v) => update('area', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={s.halfField}>
                <FieldLabel icon="currency-usd" label="Price / month" />
                <TextInput
                  style={[s.input, priceError ? s.inputError : null]}
                  value={form.pricePerMonth}
                  onChangeText={(v) => update('pricePerMonth', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                />
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
                {predictionLoading && (
                  <ActivityIndicator
                    size="small"
                    color={Colors.primary}
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>

              {prediction ? (
                <View>
                  <View style={s.predictionRow}>
                    <Text style={s.predictionLabel}>Suggested range</Text>
                    <Text style={s.predictionValue}>{prediction.priceRange}</Text>
                  </View>
                  <View style={s.predictionRow}>
                    <Text style={s.predictionLabel}>Predicted price</Text>
                    <Text style={s.predictionValue}>
                      {Math.round(prediction.predictedPrice).toLocaleString()} DT
                    </Text>
                  </View>
                  <View style={s.predictionRow}>
                    <Text style={s.predictionLabel}>Confidence</Text>
                    <View
                      style={[
                        s.confidenceBadge,
                        { backgroundColor: confidenceColor(prediction.confidence) + '22' },
                      ]}
                    >
                      <Text
                        style={[
                          s.confidenceText,
                          { color: confidenceColor(prediction.confidence) },
                        ]}
                      >
                        {prediction.confidence}
                      </Text>
                    </View>
                  </View>

                  {form.pricePerMonth ? (
                    <View style={s.rangeContainer}>
                      <Text style={s.rangeBarLabel}>Your price position</Text>
                      <View
                        style={s.rangeTrack}
                        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                      >
                        {trackWidth > 0 && (
                          <>
                            <View
                              style={[
                                s.rangeZone,
                                { left: getZoneLeft(), width: getZoneWidth() },
                              ]}
                            />
                            <View
                              style={[
                                s.rangeCursor,
                                {
                                  left: getCursorLeft(),
                                  backgroundColor: inRange ? '#27AE60' : '#E74C3C',
                                },
                              ]}
                            />
                          </>
                        )}
                      </View>
                      <View style={s.rangeLabelsRow}>
                        <Text style={s.rangeLabelText}>
                          {Math.round(prediction.lowerBound).toLocaleString()} DT
                        </Text>
                        <Text style={s.rangeLabelText}>
                          {Math.round(prediction.upperBound).toLocaleString()} DT
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={s.predictionHint}>
                  Fill in bedrooms, bathrooms, and area to get a price suggestion.
                </Text>
              )}
            </View>

            {/* Danger zone */}
            <View style={s.dangerZone}>
              <View style={s.dangerHeader}>
                <MaterialCommunityIcons name="alert-outline" size={15} color="#E74C3C" />
                <Text style={s.dangerTitle}>Danger Zone</Text>
              </View>
              <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                <MaterialCommunityIcons name="trash-can-outline" size={17} color="#E74C3C" />
                <Text style={s.deleteBtnText}>Delete Property</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, submitting && s.saveBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={submitting}
            >
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

const THUMB_SIZE = 88;

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 20, paddingBottom: 16 },

  // ── Images section ──────────────────────────────────────────────────────────
  imagesSection: {
    marginBottom: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  imagesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  imagesSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  imagesSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  imageCountBadge: {
    backgroundColor: `${Colors.primary}18`,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  imageCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  imagesLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 20,
    justifyContent: 'center',
  },
  imagesLoadingText: { fontSize: 13, color: Colors.textSecondary },
  imagesScrollContent: {
    padding: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Thumbnail
  thumbContainer: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: 'visible',
    position: 'relative',
  },
  thumbImage: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  primaryBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  pendingBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: '#F39C12',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pendingBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  thumbDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  // Add button
  addImageBtn: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}08`,
  },
  addImageInner: { alignItems: 'center', gap: 3 },
  addImageText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 13,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: `${Colors.primary}0D`,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
  },
  pendingNoticeText: {
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
    fontWeight: '500',
    lineHeight: 17,
  },

  // ── Form fields ─────────────────────────────────────────────────────────────
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
    marginTop: 14,
  },
  fieldLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  inputError: { borderColor: '#E74C3C' },
  textarea: { height: 90, paddingTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  dot: { width: 7, height: 7, borderRadius: 4 },
  rowFields: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E74C3C15',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E74C3C33',
  },
  errorBannerText: { fontSize: 12, color: '#E74C3C', flex: 1, fontWeight: '500' },

  // ── Prediction ──────────────────────────────────────────────────────────────
  predictionCard: {
    marginTop: 20,
    backgroundColor: `${Colors.primary}08`,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}25`,
    padding: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    flex: 1,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionLabel: { fontSize: 13, color: Colors.textSecondary },
  predictionValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  confidenceText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  predictionHint: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  rangeContainer: { marginTop: 14 },
  rangeBarLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  rangeTrack: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    position: 'relative',
    overflow: 'visible',
  },
  rangeZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#27AE6030',
    borderWidth: 1,
    borderColor: '#27AE6060',
    borderRadius: 4,
  },
  rangeCursor: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeLabelText: { fontSize: 11, color: Colors.textSecondary },

  // ── Danger zone ─────────────────────────────────────────────────────────────
  dangerZone: {
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E74C3C33',
    backgroundColor: '#E74C3C08',
    padding: 16,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dangerTitle: { fontSize: 13, fontWeight: '700', color: '#E74C3C' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E74C3C55',
    backgroundColor: '#fff',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#E74C3C' },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});