import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import {
  createOffer,
  createReview,
  deleteReview,
  getAverageRating,
  getPropertyReviews,
  hasReviewed,
  isReviewAuthor,
  OfferRequest,
  OfferType,
  ReviewResponse,
  updateReview,
} from '../../services/Propertydetailservice';
import { isOwner as checkIsOwner, PropertyResponseDTO } from '../../services/Propertyservice';
import { getSelectedProperty } from '../../stores/propertyStore';

import DeleteConfirmModal from '../../components/Deleteconfirmmodal';
import EditPropertyModal, { EditPropertyFormData } from '../../components/Editpropertymodal';
import ImageGallery, { GalleryImage } from '../../components/Imagegallery';
import OfferModal from '../../components/Offermodal';
import ReviewCard from '../../components/Reviewcard';
import ReviewModal from '../../components/Reviewmodal';

const { width: SCREEN_W } = Dimensions.get('window');

const padDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#27AE60',
  RENTED: '#E74C3C',
  PENDING: '#F39C12',
  INACTIVE: '#95A5A6',
};

// ─── API calls ────────────────────────────────────────────────────────────────

async function updatePropertyAPI(
  propertyId: number,
  data: EditPropertyFormData,
  cityId: number
): Promise<void> {
  const token = await AsyncStorage.getItem('token');
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('bedrooms', data.bedrooms);
  formData.append('bathrooms', data.bathrooms);
  formData.append('type', data.type);
  formData.append('address', data.address);
  formData.append('area', data.area);
  formData.append('pricePerMonth', data.pricePerMonth);
  formData.append('status', data.status);
  formData.append('cityId', String(cityId));
  formData.append('primaryImageIndex', '0');

  const res = await fetch(`http://192.168.0.109:8080/api/properties/${propertyId}`, {
    method: 'PUT',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || `Update failed: ${res.status}`);
  }
}

async function deletePropertyAPI(propertyId: number): Promise<void> {
  console.log('deletePropertyAPI called with ID:', propertyId);
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`http://192.168.0.109:8080/api/properties/${propertyId}`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || `Delete failed: ${res.status}`);
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PropertyDetailScreen() {
  const router = useRouter();

  const property: PropertyResponseDTO | null = (() => {
    try {
      const parsed = getSelectedProperty();
      return parsed?.id ? parsed : null;
    } catch {
      return null;
    }
  })();

  const [isOwner, setIsOwner] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const [localProperty, setLocalProperty] = useState<PropertyResponseDTO | null>(property);

  const [ownReviews, setOwnReviews] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [avgRating, setAvgRating] = useState<number>(
    (property as any)?.averageRating ?? 0
  );
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSort, setReviewSort] = useState<{
    by: 'createdAt' | 'rating';
    dir: 'asc' | 'desc';
  }>({ by: 'createdAt', dir: 'desc' });

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewResponse | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerType, setOfferType] = useState<OfferType>(OfferType.RENT);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [rentStart, setRentStart] = useState('');
  const [rentEnd, setRentEnd] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Tracks current gallery images as URLs so the gallery re-renders
  //    whenever an image is added or deleted inside the modal ─────────────────
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>(
    localProperty?.imageUrls ?? []
  );

  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      tension: 70,
      friction: 12,
      useNativeDriver: false,
    }).start();
    if (property?.id) loadAll();
  }, []);

  useEffect(() => {
    if (property?.id) loadReviews();
  }, [reviewSort]);

  const loadAll = useCallback(async () => {
    if (!property?.id) return;
    setPermissionsLoading(true);
    try {
      const [ownerResult, reviewedResult] = await Promise.all([
        checkIsOwner(property.id),
        hasReviewed(property.id),
        loadReviews(),
      ]);
      setIsOwner(ownerResult);
      setUserHasReviewed(reviewedResult);
    } catch (e) {
      console.error('loadAll error:', e);
    } finally {
      setPermissionsLoading(false);
    }
  }, [property?.id]);

  const loadReviews = useCallback(async () => {
    if (!property?.id) return;
    setReviewsLoading(true);
    try {
      const [r, avg] = await Promise.all([
        getPropertyReviews(property.id, reviewSort.by, reviewSort.dir),
        getAverageRating(property.id),
      ]);
      setReviews(r);
      const authorChecks = await Promise.all(r.map((rev) => isReviewAuthor(rev.id)));
      setOwnReviews(
        new Set(r.filter((_, i) => authorChecks[i]).map((rev) => rev.id))
      );
      setAvgRating(avg ?? 0);
    } catch (e) {
      console.error('loadReviews error:', e);
    } finally {
      setReviewsLoading(false);
    }
  }, [property?.id, reviewSort]);

  // ── Called by EditPropertyModal whenever images change ─────────────────────
  const handleImagesChanged = useCallback((newUrls: string[]) => {
    setGalleryImageUrls(newUrls);
    // Also keep localProperty in sync so a re-open of the modal starts fresh
    setLocalProperty((prev) =>
      prev ? { ...prev, imageUrls: newUrls } : prev
    );
  }, []);

  // ── Review handlers ────────────────────────────────────────────────────────
  const openCreateReview = () => {
    setEditingReview(null);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalVisible(true);
  };
  const openEditReview = (r: ReviewResponse) => {
    setEditingReview(r);
    setReviewRating(r.rating);
    setReviewComment(r.comment);
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!property?.id) return;
    if (!reviewComment.trim()) {
      Alert.alert('Validation', 'Please write a comment.');
      return;
    }
    setReviewSubmitting(true);
    try {
      if (editingReview) {
        await updateReview(editingReview.id, {
          propertyId: property.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
      } else {
        await createReview({
          propertyId: property.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
        setUserHasReviewed(true);
      }
      setReviewModalVisible(false);
      loadReviews();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = (id: string) => {
    setDeletingReviewId(id);
    setDeleteModalVisible(true);
  };
  const confirmDeleteReview = async () => {
    if (!deletingReviewId) return;
    setDeleteLoading(true);
    try {
      await deleteReview(deletingReviewId);
      setUserHasReviewed(false);
      setDeleteModalVisible(false);
      setDeletingReviewId(null);
      loadReviews();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to delete review');
    } finally {
      setDeleteLoading(false);
    }
  };
  const cancelDeleteReview = () => {
    setDeleteModalVisible(false);
    setDeletingReviewId(null);
  };

  // ── Offer handlers ─────────────────────────────────────────────────────────
  const submitOffer = async () => {
    if (!property?.id) return;
    const price = parseFloat(offerPrice);
    if (!offerPrice || isNaN(price) || price <= 0) {
      Alert.alert('Validation', 'Please enter a valid price.');
      return;
    }
    if (offerType === OfferType.RENT && (!rentStart.trim() || !rentEnd.trim())) {
      Alert.alert('Validation', 'Please enter rent start and end dates (YYYY-MM-DD).');
      return;
    }
    setOfferSubmitting(true);
    try {
      const dto: OfferRequest = {
        propertyId: property.id,
        type: offerType,
        proposedPrice: price,
        message: offerMessage.trim() || undefined,
        rentStartDate:
          offerType === OfferType.RENT ? `${padDate(rentStart)}T00:00:00` : undefined,
        rentEndDate:
          offerType === OfferType.RENT ? `${padDate(rentEnd)}T00:00:00` : undefined,
      };
      await createOffer(dto);
      setOfferModalVisible(false);
      Alert.alert('Success', 'Your offer has been submitted!');
      resetOfferForm();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to submit offer');
    } finally {
      setOfferSubmitting(false);
    }
  };

  const resetOfferForm = () => {
    setOfferType(OfferType.RENT);
    setOfferPrice('');
    setOfferMessage('');
    setRentStart('');
    setRentEnd('');
  };

  // ── Edit property handler ──────────────────────────────────────────────────
  const handleEditSubmit = async (data: EditPropertyFormData) => {
    if (!localProperty?.id) return;

    const cityId = localProperty.cityId;
    if (!cityId) {
      Alert.alert('Error', 'City information is missing. Cannot update property.');
      return;
    }

    setEditSubmitting(true);
    try {
      await updatePropertyAPI(localProperty.id, data, cityId);
      setLocalProperty((prev) =>
        prev
          ? {
              ...prev,
              title: data.title,
              description: data.description,
              bedrooms: parseInt(data.bedrooms),
              bathrooms: parseInt(data.bathrooms),
              type: data.type as any,
              address: data.address,
              area: parseFloat(data.area),
              pricePerMonth: parseFloat(data.pricePerMonth),
              status: data.status as any,
            }
          : prev
      );
      setEditModalVisible(false);
      Alert.alert('Success', 'Property updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update property');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete property handler ────────────────────────────────────────────────
  const handleDeleteProperty = async () => {
    if (!localProperty?.id) return;
    try {
      console.log('Attempting to delete property with ID:', localProperty.id);
      await deletePropertyAPI(localProperty.id);
      setEditModalVisible(false);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to delete property');
    }
  };

  const buildEditInitialData = (): EditPropertyFormData => ({
    title: localProperty?.title ?? '',
    description: localProperty?.description ?? '',
    bedrooms: String(localProperty?.bedrooms ?? ''),
    bathrooms: String(localProperty?.bathrooms ?? ''),
    type: (localProperty?.type as any) ?? 'APARTMENT',
    address: localProperty?.address ?? '',
    area: String(localProperty?.area ?? ''),
    pricePerMonth: String(localProperty?.pricePerMonth ?? ''),
    status: (localProperty?.status as any) ?? 'AVAILABLE',
  });

  if (!localProperty) {
    return (
      <View style={s.errorScreen}>
        <MaterialCommunityIcons name="home-alert-outline" size={56} color="#CCC" />
        <Text style={s.errorText}>Property not found.</Text>
        <TouchableOpacity style={s.backBtnPlain} onPress={() => router.back()}>
          <Text style={s.backBtnPlainText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use galleryImageUrls state (updated live by modal) instead of localProperty.imageUrls
  const galleryImages: GalleryImage[] = galleryImageUrls.length > 0
    ? galleryImageUrls.map((url) => ({ uri: url }))
    : [];

  const statusColor = STATUS_COLORS[localProperty.status] ?? '#95A5A6';
  const canReview =
    !isOwner && !userHasReviewed && localProperty.status === 'AVAILABLE';
  const canOffer = !isOwner && localProperty.status === 'AVAILABLE';

  const offerStatusLabel =
    localProperty.status === 'AVAILABLE' || localProperty.status === 'PENDING'
      ? offerType === OfferType.RENT
        ? 'À louer'
        : 'À vendre'
      : 'À louer';

  const TYPE_TO_API: Record<string, string> = {
    APARTMENT: 'Appartement',
    HOUSE: 'Villa',
    STUDIO: 'Studio',
    OFFICE: 'Bureau',
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Gallery — re-renders automatically when galleryImageUrls changes */}
        <View style={{ position: 'relative' }}>
          <ImageGallery images={galleryImages} />

          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={[s.statusPill, { backgroundColor: statusColor }]}>
            <Text style={s.statusPillText}>{localProperty.status}</Text>
          </View>
        </View>

        {/* Content */}
        <Animated.View
          style={[
            s.content,
            {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Title row */}
          <View style={s.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.propertyTitle}>{localProperty.title}</Text>
              <Text style={s.propertyAddress}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={13}
                  color={Colors.textSecondary}
                />{' '}
                {localProperty.address}
                {localProperty.cityName ? `, ${localProperty.cityName}` : ''}
              </Text>
            </View>
            <View style={s.titleRight}>
              <View style={s.typeBadge}>
                <Text style={s.typeText}>{localProperty.type}</Text>
              </View>
              {!permissionsLoading && isOwner && (
                <>
                  <TouchableOpacity
                    style={s.editIconBtn}
                    onPress={() => setEditModalVisible(true)}
                    hitSlop={10}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={16}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.deleteIconBtn}
                    onPress={handleDeleteProperty}
                    hitSlop={10}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={16}
                      color="#E74C3C"
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            {[
              { icon: 'bed-outline', value: localProperty.bedrooms, label: 'Beds' },
              { icon: 'shower', value: localProperty.bathrooms, label: 'Baths' },
              {
                icon: 'ruler-square',
                value: localProperty.area ? `${localProperty.area}m²` : '—',
                label: 'Area',
              },
              {
                icon: 'star',
                value: avgRating ? avgRating.toFixed(1) : '—',
                label: 'Rating',
                color: '#F4B942',
              },
            ].map((stat) => (
              <View key={stat.label} style={s.statItem}>
                <MaterialCommunityIcons
                  name={stat.icon as any}
                  size={22}
                  color={stat.color ?? Colors.primary}
                />
                <Text style={s.statValue}>{String(stat.value)}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {localProperty.description ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About this property</Text>
              <Text style={s.heroPrice}>
                {localProperty.pricePerMonth?.toLocaleString()} TND
                <Text style={s.heroPerMonth}> / month</Text>
              </Text>
              <Text style={s.description}>{localProperty.description}</Text>
            </View>
          ) : null}

          {/* Action buttons for non-owners */}
          {permissionsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginBottom: 24 }} />
          ) : (
            !isOwner &&
            (canOffer || canReview || userHasReviewed) && (
              <View style={s.actionsRow}>
                {canOffer && (
                  <TouchableOpacity
                    style={[s.actionBtn, s.offerBtn]}
                    onPress={() => setOfferModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="handshake-outline"
                      size={20}
                      color="#fff"
                    />
                    <Text style={s.actionBtnText}>Make an Offer</Text>
                  </TouchableOpacity>
                )}
                {canReview && (
                  <TouchableOpacity
                    style={[s.actionBtn, s.reviewBtn]}
                    onPress={openCreateReview}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="star-plus-outline"
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={[s.actionBtnText, { color: Colors.primary }]}>
                      Write a Review
                    </Text>
                  </TouchableOpacity>
                )}
                {!isOwner && userHasReviewed && (
                  <View style={s.alreadyReviewed}>
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color="#27AE60"
                    />
                    <Text style={s.alreadyReviewedText}>
                      You've reviewed this property
                    </Text>
                  </View>
                )}
              </View>
            )
          )}

          {/* Reviews */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                Reviews{reviews.length > 0 ? ` (${reviews.length})` : ''}
              </Text>
              <View style={s.sortRow}>
                {(['createdAt', 'rating'] as const).map((field) => (
                  <TouchableOpacity
                    key={field}
                    style={[
                      s.sortChip,
                      reviewSort.by === field && s.sortChipActive,
                    ]}
                    onPress={() => setReviewSort((p) => ({ ...p, by: field }))}
                  >
                    <Text
                      style={[
                        s.sortChipText,
                        reviewSort.by === field && s.sortChipTextActive,
                      ]}
                    >
                      {field === 'createdAt' ? 'Date' : 'Rating'}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={s.sortDirBtn}
                  onPress={() =>
                    setReviewSort((p) => ({
                      ...p,
                      dir: p.dir === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                >
                  <MaterialCommunityIcons
                    name={
                      reviewSort.dir === 'desc' ? 'sort-descending' : 'sort-ascending'
                    }
                    size={18}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {reviewsLoading ? (
              <ActivityIndicator
                color={Colors.primary}
                style={{ marginVertical: 20 }}
              />
            ) : reviews.length === 0 ? (
              <View style={s.emptyReviews}>
                <MaterialCommunityIcons name="comment-outline" size={40} color="#CCC" />
                <Text style={s.emptyReviewsText}>No reviews yet</Text>
                {canReview && (
                  <Text style={s.emptyReviewsSub}>Be the first to leave a review!</Text>
                )}
              </View>
            ) : (
              reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  isOwnReview={ownReviews.has(r.id)}
                  onEdit={openEditReview}
                  onDelete={handleDeleteReview}
                />
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={submitReview}
        editingReview={editingReview}
        rating={reviewRating}
        onRatingChange={setReviewRating}
        comment={reviewComment}
        onCommentChange={setReviewComment}
        submitting={reviewSubmitting}
      />

      <OfferModal
        visible={offerModalVisible}
        onClose={() => {
          setOfferModalVisible(false);
          resetOfferForm();
        }}
        onSubmit={submitOffer}
        offerType={offerType}
        onOfferTypeChange={setOfferType}
        price={offerPrice}
        onPriceChange={setOfferPrice}
        message={offerMessage}
        onMessageChange={setOfferMessage}
        rentStart={rentStart}
        onRentStartChange={setRentStart}
        rentEnd={rentEnd}
        onRentEndChange={setRentEnd}
        submitting={offerSubmitting}
        propertyPrice={localProperty.pricePerMonth}
        propertyMeta={{
          status: offerStatusLabel,
          propertyType: TYPE_TO_API[localProperty.type as string] ?? 'Appartement',
          city: localProperty.cityName ?? 'Tunis',
          state: localProperty.stateName ?? localProperty.cityName ?? 'Tunis',
          bedrooms: localProperty.bedrooms ?? 1,
          bathrooms: localProperty.bathrooms ?? 1,
          sizeM2: localProperty.area ?? 0,
        }}
      />

      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={cancelDeleteReview}
        onConfirm={confirmDeleteReview}
        loading={deleteLoading}
      />

      <EditPropertyModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        onDelete={handleDeleteProperty}
        initialData={buildEditInitialData()}
        propertyId={localProperty.id}
        cityName={localProperty.cityName}
        submitting={editSubmitting}
        onImagesChanged={handleImagesChanged}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  deleteIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E74C3C15',
    borderWidth: 1.5,
    borderColor: '#E74C3C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.background,
  },
  errorText: { fontSize: 16, color: Colors.textSecondary },
  backBtnPlain: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  backBtnPlainText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 28,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  statusPill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 28,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
  },
  statusPillText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  content: { padding: 20 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  propertyTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, lineHeight: 26 },
  propertyAddress: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  titleRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  typeBadge: {
    backgroundColor: `${Colors.primary}18`,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeText: { color: Colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  editIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: `${Colors.primary}15`,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}35`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  heroPrice: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  heroPerMonth: { fontSize: 14, fontWeight: '400', color: Colors.textSecondary },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 140,
  },
  offerBtn: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewBtn: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  alreadyReviewed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  alreadyReviewedText: { fontSize: 13, color: '#27AE60', fontWeight: '600' },
  sortRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  sortChipActive: { backgroundColor: Colors.primary },
  sortChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  sortChipTextActive: { color: '#fff' },
  sortDirBtn: { padding: 4 },
  emptyReviews: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyReviewsText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  emptyReviewsSub: { fontSize: 13, color: '#AAA' },
});