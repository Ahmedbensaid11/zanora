import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CreatePropertyModal from '../../components/Createpropertymodal ';
import EmptyHouseAnimation from '../../components/Emptyhouseanimation';
import PropertyCard from '../../components/PropertyCard';
import { Colors } from '../../constants/Colors';
import {
  fetchMyOffers,
  fetchMyProperties,
  fetchIncomingOffers,
  respondToOffer,
  OfferPage,
  OfferResponseDTO,
  PropertyFilterParams,
  PropertyPage,
  PropertyResponseDTO,
} from '../../services/Propertyservice';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'properties' | 'myOffers' | 'receivedOffers';

const OFFER_STATUS_COLORS: Record<string, string> = {
  PENDING:   '#F39C12',
  ACCEPTED:  '#27AE60',
  REJECTED:  '#E74C3C',
  CANCELLED: '#95A5A6',
  DECLINED:  '#E74C3C',
};

const OFFER_STATUS_ICONS: Record<string, string> = {
  PENDING:   'clock-outline',
  ACCEPTED:  'check-circle-outline',
  REJECTED:  'close-circle-outline',
  CANCELLED: 'cancel',
  DECLINED:  'close-circle-outline',
};

const DEFAULT_FILTERS: PropertyFilterParams = {
  page: 0,
  size: 10,
  sortBy: 'createdAt',
  sortDirection: 'desc',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return num.toLocaleString();
};

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '—';
  return new Date(value as any).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ─── My Offer Detail Modal (buyer view — read only) ───────────────────────────

const MyOfferDetailModal = ({
  offer,
  visible,
  onClose,
}: {
  offer: OfferResponseDTO | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!offer) return null;
  const statusColor = OFFER_STATUS_COLORS[offer.status] ?? Colors.textSecondary;
  const statusIcon  = OFFER_STATUS_ICONS[offer.status]  ?? 'help-circle-outline';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={modalStyles.sheet}>

          {offer.propertyImageBase64 ? (
            <Image source={{ uri: offer.propertyImageBase64 }} style={modalStyles.heroImage} resizeMode="cover" />
          ) : (
            <View style={modalStyles.heroPlaceholder}>
              <MaterialCommunityIcons name="home-city" size={52} color={Colors.primary} />
              <Text style={modalStyles.heroPlaceholderText}>No photo available</Text>
            </View>
          )}

          <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={18} color="#fff" />
          </TouchableOpacity>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            <View style={modalStyles.content}>
              <Text style={modalStyles.propTitle} numberOfLines={2}>
                {offer.propertyTitle ?? 'Property Offer'}
              </Text>
              <Text style={modalStyles.priceText}>TND {formatPrice(offer.proposedPrice)}</Text>

              <View style={modalStyles.divider} />

              <View style={modalStyles.row}>
                <Text style={modalStyles.rowLabel}>Status</Text>
                <View style={[modalStyles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                  <MaterialCommunityIcons name={statusIcon} size={13} color={statusColor} />
                  <Text style={[modalStyles.statusText, { color: statusColor }]}>{offer.status}</Text>
                </View>
              </View>

              {!!offer.type && (
                <View style={modalStyles.row}>
                  <Text style={modalStyles.rowLabel}>Offer type</Text>
                  <Text style={modalStyles.rowValue}>{offer.type}</Text>
                </View>
              )}

              <View style={modalStyles.row}>
                <Text style={modalStyles.rowLabel}>Submitted</Text>
                <Text style={modalStyles.rowValue}>{formatDate(offer.createdAt as any)}</Text>
              </View>

              {!!offer.respondedAt && (
                <View style={modalStyles.row}>
                  <Text style={modalStyles.rowLabel}>Responded</Text>
                  <Text style={modalStyles.rowValue}>{formatDate(offer.respondedAt as any)}</Text>
                </View>
              )}

              {!!offer.rentStartDate && (
                <View style={modalStyles.row}>
                  <Text style={modalStyles.rowLabel}>Rent start</Text>
                  <Text style={modalStyles.rowValue}>{formatDate(offer.rentStartDate as any)}</Text>
                </View>
              )}

              {!!offer.rentEndDate && (
                <View style={modalStyles.row}>
                  <Text style={modalStyles.rowLabel}>Rent end</Text>
                  <Text style={modalStyles.rowValue}>{formatDate(offer.rentEndDate as any)}</Text>
                </View>
              )}

              {!!offer.message && (
                <View style={[modalStyles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={modalStyles.rowLabel}>Your message</Text>
                  <Text style={[modalStyles.rowValue, { fontWeight: '400', color: Colors.textSecondary, textAlign: 'left' }]}>
                    {offer.message}
                  </Text>
                </View>
              )}

              {!!offer.ownerNote && (
                <View style={[modalStyles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={modalStyles.rowLabel}>Owner note</Text>
                  <Text style={[modalStyles.rowValue, { fontWeight: '400', color: Colors.textSecondary, textAlign: 'left' }]}>
                    {offer.ownerNote}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={modalStyles.dismissBtn} onPress={onClose}>
                <Text style={modalStyles.dismissBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Received Offer Respond Modal (owner view) ────────────────────────────────

const RespondOfferModal = ({
  offer,
  visible,
  onClose,
  onResponded,
}: {
  offer: OfferResponseDTO | null;
  visible: boolean;
  onClose: () => void;
  onResponded: () => void;
}) => {
  const [ownerNote, setOwnerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setOwnerNote('');
      setError(null);
    }
  }, [visible]);

  if (!offer) return null;

  const statusColor = OFFER_STATUS_COLORS[offer.status] ?? Colors.textSecondary;
  const statusIcon  = OFFER_STATUS_ICONS[offer.status]  ?? 'help-circle-outline';
  const isPending   = offer.status === 'PENDING';

  const handleRespond = async (decision: 'ACCEPTED' | 'DECLINED') => {
    try {
      setSubmitting(true);
      setError(null);
      await respondToOffer(offer.id, { decision, ownerNote: ownerNote.trim() || undefined });
      onResponded();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={modalStyles.sheet}>

          {offer.propertyImageBase64 ? (
            <Image source={{ uri: offer.propertyImageBase64 }} style={modalStyles.heroImage} resizeMode="cover" />
          ) : (
            <View style={modalStyles.heroPlaceholder}>
              <MaterialCommunityIcons name="home-city" size={52} color={Colors.primary} />
              <Text style={modalStyles.heroPlaceholderText}>No photo available</Text>
            </View>
          )}

          <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={18} color="#fff" />
          </TouchableOpacity>

          <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
            <View style={modalStyles.content}>

              <Text style={modalStyles.propTitle} numberOfLines={2}>
                {offer.propertyTitle ?? 'Incoming Offer'}
              </Text>
              <Text style={modalStyles.priceText}>TND {formatPrice(offer.proposedPrice)}</Text>

              <View style={modalStyles.divider} />

              <View style={modalStyles.row}>
                <Text style={modalStyles.rowLabel}>Status</Text>
                <View style={[modalStyles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                  <MaterialCommunityIcons name={statusIcon} size={13} color={statusColor} />
                  <Text style={[modalStyles.statusText, { color: statusColor }]}>{offer.status}</Text>
                </View>
              </View>

              <View style={modalStyles.row}>
                <Text style={modalStyles.rowLabel}>From</Text>
                <Text style={modalStyles.rowValue}>{offer.buyerUsername ?? '—'}</Text>
              </View>

              {!!offer.type && (
                <View style={modalStyles.row}>
                  <Text style={modalStyles.rowLabel}>Offer type</Text>
                  <Text style={modalStyles.rowValue}>{offer.type}</Text>
                </View>
              )}

              <View style={modalStyles.row}>
                <Text style={modalStyles.rowLabel}>Submitted</Text>
                <Text style={modalStyles.rowValue}>{formatDate(offer.createdAt as any)}</Text>
              </View>

              {!!offer.rentStartDate && (
                <View style={modalStyles.row}>
                  <Text style={modalStyles.rowLabel}>Rent start</Text>
                  <Text style={modalStyles.rowValue}>{formatDate(offer.rentStartDate as any)}</Text>
                </View>
              )}

              {!!offer.rentEndDate && (
                <View style={modalStyles.row}>
                  <Text style={modalStyles.rowLabel}>Rent end</Text>
                  <Text style={modalStyles.rowValue}>{formatDate(offer.rentEndDate as any)}</Text>
                </View>
              )}

              {!!offer.message && (
                <View style={[modalStyles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={modalStyles.rowLabel}>Buyer message</Text>
                  <Text style={[modalStyles.rowValue, { fontWeight: '400', color: Colors.textSecondary, textAlign: 'left' }]}>
                    {offer.message}
                  </Text>
                </View>
              )}

              {!isPending && !!offer.ownerNote && (
                <View style={[modalStyles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                  <Text style={modalStyles.rowLabel}>Your note</Text>
                  <Text style={[modalStyles.rowValue, { fontWeight: '400', color: Colors.textSecondary, textAlign: 'left' }]}>
                    {offer.ownerNote}
                  </Text>
                </View>
              )}

              {isPending && (
                <>
                  <View style={respondStyles.sectionHeader}>
                    <MaterialCommunityIcons name="reply" size={16} color={Colors.primary} />
                    <Text style={respondStyles.sectionTitle}>Your response</Text>
                  </View>

                  <TextInput
                    style={respondStyles.noteInput}
                    placeholder="Write a note to the buyer (optional)..."
                    placeholderTextColor={Colors.textSecondary}
                    value={ownerNote}
                    onChangeText={setOwnerNote}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                  />

                  {!!error && (
                    <View style={respondStyles.errorBox}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#E74C3C" />
                      <Text style={respondStyles.errorText}>{error}</Text>
                    </View>
                  )}

                  <View style={respondStyles.actionRow}>
                    <TouchableOpacity
                      style={[respondStyles.actionBtn, respondStyles.declineBtn]}
                      onPress={() => handleRespond('DECLINED')}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#E74C3C" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="close-circle-outline" size={18} color="#E74C3C" />
                          <Text style={[respondStyles.actionBtnText, { color: '#E74C3C' }]}>Decline</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[respondStyles.actionBtn, respondStyles.acceptBtn]}
                      onPress={() => handleRespond('ACCEPTED')}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
                          <Text style={[respondStyles.actionBtnText, { color: '#fff' }]}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {!isPending && (
                <TouchableOpacity style={modalStyles.dismissBtn} onPress={onClose}>
                  <Text style={modalStyles.dismissBtnText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Offer Card ───────────────────────────────────────────────────────────────

const OfferCard = ({
  offer,
  index,
  onPress,
  isIncoming = false,
}: {
  offer: OfferResponseDTO;
  index: number;
  onPress: () => void;
  isIncoming?: boolean;
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 70,
      friction: 10,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const statusColor = OFFER_STATUS_COLORS[offer.status] ?? Colors.textSecondary;
  const statusIcon  = OFFER_STATUS_ICONS[offer.status]  ?? 'help-circle-outline';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Animated.View
        style={[
          offerCardStyles.card,
          offer.status === 'PENDING' && isIncoming && offerCardStyles.cardPending,
          {
            opacity: anim,
            transform: [{
              translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
            }],
          },
        ]}
      >
        {offer.propertyImageBase64 ? (
          <Image source={{ uri: offer.propertyImageBase64 }} style={offerCardStyles.thumb} resizeMode="cover" />
        ) : (
          <View style={[offerCardStyles.thumb, offerCardStyles.thumbPlaceholder]}>
            <MaterialCommunityIcons name="home-city" size={28} color={Colors.primary} />
          </View>
        )}

        <View style={offerCardStyles.info}>
          <Text style={offerCardStyles.propertyTitle} numberOfLines={1}>
            {offer.propertyTitle ?? `Property #${offer.propertyId}`}
          </Text>
          {isIncoming && !!offer.buyerUsername && (
            <Text style={offerCardStyles.buyerName}>
              <MaterialCommunityIcons name="account-outline" size={12} color={Colors.textSecondary} />
              {' '}{offer.buyerUsername}
            </Text>
          )}
          <Text style={offerCardStyles.price}>TND {formatPrice(offer.proposedPrice)}</Text>
          <Text style={offerCardStyles.date}>{formatDate(offer.createdAt as any)}</Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[offerCardStyles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <MaterialCommunityIcons name={statusIcon} size={14} color={statusColor} />
            <Text style={[offerCardStyles.statusText, { color: statusColor }]}>{offer.status}</Text>
          </View>
          {isIncoming && offer.status === 'PENDING' && (
            <Text style={offerCardStyles.tapHint}>Tap to respond</Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  const [selectedMyOffer, setSelectedMyOffer] = useState<OfferResponseDTO | null>(null);
  const [selectedReceivedOffer, setSelectedReceivedOffer] = useState<OfferResponseDTO | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const tabIndicator = useRef(new Animated.Value(0)).current;

  // ── Properties state ──────────────────────────────────────────────────────
  const [propFilters, setPropFilters] = useState<PropertyFilterParams>(DEFAULT_FILTERS);
  const [propData, setPropData] = useState<PropertyPage | null>(null);
  const [properties, setProperties] = useState<PropertyResponseDTO[]>([]);
  const [propLoading, setPropLoading] = useState(false);
  const [propRefreshing, setPropRefreshing] = useState(false);
  const [propLoadingMore, setPropLoadingMore] = useState(false);

  // ── My Offers state ───────────────────────────────────────────────────────
  const [offerData, setOfferData] = useState<OfferPage | null>(null);
  const [offers, setOffers] = useState<OfferResponseDTO[]>([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerRefreshing, setOfferRefreshing] = useState(false);
  const [offerLoadingMore, setOfferLoadingMore] = useState(false);

  // ── Received Offers state ─────────────────────────────────────────────────
  const [receivedOffers, setReceivedOffers] = useState<OfferResponseDTO[]>([]);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [receivedRefreshing, setReceivedRefreshing] = useState(false);

  // ── Entry animations ──────────────────────────────────────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const tabBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(tabBarAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(fabAnim,    { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Tab switch ────────────────────────────────────────────────────────────
  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    Animated.spring(tabIndicator, {
      toValue: tab === 'properties' ? 0 : tab === 'myOffers' ? 1 : 2,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
  };

  // ── Load properties ───────────────────────────────────────────────────────
  const loadProperties = useCallback(async (filters: PropertyFilterParams, append = false) => {
    try {
      if (!append) setPropLoading(true);
      else setPropLoadingMore(true);
      const result = await fetchMyProperties(filters);
      setPropData(result);
      setProperties((prev) => append ? [...prev, ...result.content] : result.content);
    } catch (e) { console.error(e); }
    finally {
      setPropLoading(false);
      setPropLoadingMore(false);
      setPropRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProperties(propFilters); }, [propFilters]);

  // ── Load my offers ────────────────────────────────────────────────────────
  const loadOffers = useCallback(async (page = 0, append = false) => {
    try {
      if (!append) setOfferLoading(true);
      else setOfferLoadingMore(true);
      const result = await fetchMyOffers({ page, size: 10 });
      setOfferData(result);
      setOffers((prev) => append ? [...prev, ...result.content] : result.content);
    } catch (e) { console.error(e); }
    finally {
      setOfferLoading(false);
      setOfferLoadingMore(false);
      setOfferRefreshing(false);
    }
  }, []);

  // ── Load received offers ──────────────────────────────────────────────────
  const loadReceivedOffers = useCallback(async () => {
    try {
      setReceivedLoading(true);
      const result = await fetchIncomingOffers();
      setReceivedOffers(result);
    } catch (e) { console.error(e); }
    finally {
      setReceivedLoading(false);
      setReceivedRefreshing(false);
    }
  }, []);

  // ── EAGER LOAD: fetch counts for all tabs on mount so badges show immediately
  useEffect(() => {
    loadOffers(0);
    loadReceivedOffers();
  }, []);

  // ── Reload when switching tabs (only if empty to avoid double fetch) ──────
  useEffect(() => {
    if (activeTab === 'myOffers' && offers.length === 0) loadOffers(0);
    if (activeTab === 'receivedOffers' && receivedOffers.length === 0) loadReceivedOffers();
  }, [activeTab]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePropRefresh = () => {
    setPropRefreshing(true);
    setProperties([]);
    loadProperties({ ...propFilters, page: 0 }, false);
  };

  const handlePropLoadMore = () => {
    if (propLoadingMore || !propData) return;
    const next = (propData.number ?? 0) + 1;
    if (next >= propData.totalPages) return;
    const nextFilters = { ...propFilters, page: next };
    setPropFilters(nextFilters);
    loadProperties(nextFilters, true);
  };

  const handleOfferRefresh = () => {
    setOfferRefreshing(true);
    setOffers([]);
    loadOffers(0, false);
  };

  const handleOfferLoadMore = () => {
    if (offerLoadingMore || !offerData) return;
    const next = (offerData.number ?? 0) + 1;
    if (next >= offerData.totalPages) return;
    loadOffers(next, true);
  };

  const handleReceivedRefresh = () => {
    setReceivedRefreshing(true);
    setReceivedOffers([]);
    loadReceivedOffers();
  };

  const handleOfferResponded = () => {
    setReceivedOffers([]);
    loadReceivedOffers();
  };

  const pendingReceivedCount = receivedOffers.filter(o => o.status === 'PENDING').length;
  const pendingMyOffersCount = offers.filter(o => o.status === 'PENDING').length;

  const indicatorLeft = tabIndicator.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['1%', '34%', '67%'],
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }),
            }],
          },
        ]}
      >
        <Text style={styles.headerTitle}>Manage your</Text>
        <Text style={styles.headerAccent}>Properties & Offers</Text>
      </Animated.View>

      {/* Tab bar */}
      <Animated.View
        style={[
          styles.tabBarOuter,
          {
            opacity: tabBarAnim,
            transform: [{
              translateY: tabBarAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
            }],
          },
        ]}
      >
        <View style={styles.tabBar}>
          <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />

          {/* Properties tab */}
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('properties')} activeOpacity={0.8}>
            <MaterialCommunityIcons
              name="home-outline" size={16}
              color={activeTab === 'properties' ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === 'properties' && styles.tabLabelActive]}>
              Properties
            </Text>
            {propData && propData.totalElements > 0 && (
              <View style={styles.tabCount}>
                <Text style={styles.tabCountText}>{propData.totalElements}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* My Offers tab */}
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('myOffers')} activeOpacity={0.8}>
            <MaterialCommunityIcons
              name="tag-outline" size={16}
              color={activeTab === 'myOffers' ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === 'myOffers' && styles.tabLabelActive]}>
              My Offers
            </Text>
            {/* Badge: show total count normally, highlight in orange if there are pending */}
            {offerData && offerData.totalElements > 0 && (
              <View style={[
                styles.tabCount,
                pendingMyOffersCount > 0 && { backgroundColor: '#F39C12' },
              ]}>
                <Text style={styles.tabCountText}>
                  {pendingMyOffersCount > 0 ? pendingMyOffersCount : offerData.totalElements}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Received Offers tab */}
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('receivedOffers')} activeOpacity={0.8}>
            <MaterialCommunityIcons
              name="inbox-arrow-down-outline" size={16}
              color={activeTab === 'receivedOffers' ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === 'receivedOffers' && styles.tabLabelActive]}>
              Received
            </Text>
            {/* Red dot for pending received offers */}
            {pendingReceivedCount > 0 && (
              <View style={[styles.tabCount, { backgroundColor: '#E74C3C' }]}>
                <Text style={styles.tabCountText}>{pendingReceivedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Results count */}
      {activeTab === 'properties' && propData && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {propData.totalElements} propert{propData.totalElements !== 1 ? 'ies' : 'y'} listed
          </Text>
        </View>
      )}
      {activeTab === 'myOffers' && offerData && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {offerData.totalElements} offer{offerData.totalElements !== 1 ? 's' : ''} submitted
            {pendingMyOffersCount > 0 && (
              <Text style={{ color: '#F39C12' }}> · {pendingMyOffersCount} pending</Text>
            )}
          </Text>
        </View>
      )}
      {activeTab === 'receivedOffers' && !receivedLoading && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {receivedOffers.length} offer{receivedOffers.length !== 1 ? 's' : ''} received
            {pendingReceivedCount > 0 && (
              <Text style={{ color: '#E74C3C' }}> · {pendingReceivedCount} pending</Text>
            )}
          </Text>
        </View>
      )}

      {/* ── Properties list ── */}
      {activeTab === 'properties' &&
        (propLoading && !propRefreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your properties...</Text>
          </View>
        ) : (
          <FlatList
            data={properties}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => <PropertyCard property={item} index={index} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={propRefreshing} onRefresh={handlePropRefresh} tintColor={Colors.primary} />}
            onEndReached={handlePropLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={propLoadingMore ? <ActivityIndicator color={Colors.primary} style={{ paddingVertical: 20 }} /> : null}
            ListEmptyComponent={<EmptyHouseAnimation title="No properties yet" subtitle="Tap + to list your first property" />}
          />
        ))}

      {/* ── My Offers list ── */}
      {activeTab === 'myOffers' &&
        (offerLoading && !offerRefreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your offers...</Text>
          </View>
        ) : (
          <FlatList
            data={offers}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <OfferCard offer={item} index={index} onPress={() => setSelectedMyOffer(item)} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={offerRefreshing} onRefresh={handleOfferRefresh} tintColor={Colors.primary} />}
            onEndReached={handleOfferLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={offerLoadingMore ? <ActivityIndicator color={Colors.primary} style={{ paddingVertical: 20 }} /> : null}
            ListEmptyComponent={<EmptyHouseAnimation title="No offers yet" subtitle="Browse properties and make an offer" />}
          />
        ))}

      {/* ── Received Offers list ── */}
      {activeTab === 'receivedOffers' &&
        (receivedLoading && !receivedRefreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading received offers...</Text>
          </View>
        ) : (
          <FlatList
            data={receivedOffers}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <OfferCard
                offer={item}
                index={index}
                isIncoming
                onPress={() => setSelectedReceivedOffer(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={receivedRefreshing} onRefresh={handleReceivedRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={<EmptyHouseAnimation title="No offers received yet" subtitle="Offers on your properties will appear here" />}
          />
        ))}

      {/* FAB — only on properties tab */}
      {activeTab === 'properties' && (
        <Animated.View style={[fabStyles.fab, { opacity: fabAnim, transform: [{ scale: fabAnim }] }]}>
          <TouchableOpacity style={fabStyles.fabBtn} onPress={() => setCreateModalVisible(true)} activeOpacity={0.88}>
            <Text style={fabStyles.fabIcon}>+</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Create Property Modal */}
      <CreatePropertyModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={() => { setCreateModalVisible(false); handlePropRefresh(); }}
      />

      {/* My Offer Detail Modal */}
      <MyOfferDetailModal
        offer={selectedMyOffer}
        visible={!!selectedMyOffer}
        onClose={() => setSelectedMyOffer(null)}
      />

      {/* Received Offer Respond Modal */}
      <RespondOfferModal
        offer={selectedReceivedOffer}
        visible={!!selectedReceivedOffer}
        onClose={() => setSelectedReceivedOffer(null)}
        onResponded={handleOfferResponded}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
  },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '300', color: Colors.textSecondary, lineHeight: 30 },
  headerAccent: { fontSize: 32, fontWeight: '800', color: Colors.primary, lineHeight: 36 },
  tabBarOuter: { paddingHorizontal: 16, marginBottom: 8 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#F0F0F0',
    borderRadius: 16, padding: 4,
    position: 'relative', height: 52, alignItems: 'center',
  },
  tabIndicator: {
    position: 'absolute', width: '32%', height: 44,
    backgroundColor: Colors.primary, borderRadius: 13,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 4, zIndex: 1,
  },
  tabLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabLabelActive: { color: Colors.white },
  tabCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },
  tabCountText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  resultsRow: { paddingHorizontal: 20, paddingVertical: 8 },
  resultsText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  list: { paddingTop: 4, paddingBottom: 100 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 15 },
});

const fabStyles = StyleSheet.create({
  fab: { position: 'absolute', bottom: 28, right: 24, zIndex: 50 },
  fabBtn: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabIcon: { fontSize: 30, color: Colors.white, fontWeight: '300', lineHeight: 34 },
});

const offerCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
    elevation: 3, gap: 12,
  },
  cardPending: {
    borderLeftWidth: 3,
    borderLeftColor: '#F39C12',
  },
  thumb: { width: 64, height: 64, borderRadius: 12, flexShrink: 0 },
  thumbPlaceholder: {
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, gap: 3, minWidth: 0 },
  propertyTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  buyerName: { fontSize: 12, color: Colors.textSecondary },
  price: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  date: { fontSize: 12, color: Colors.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 9, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  tapHint: { fontSize: 10, color: Colors.textSecondary, fontStyle: 'italic' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: 210 },
  heroPlaceholder: {
    width: '100%', height: 160,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  heroPlaceholderText: { color: Colors.textSecondary, fontSize: 13 },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  propTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  priceText: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    gap: 8,
  },
  rowLabel: { fontSize: 14, color: Colors.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '600', color: Colors.text, flexShrink: 1, textAlign: 'right' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  dismissBtn: {
    marginTop: 20, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center',
  },
  dismissBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
});

const respondStyles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  noteInput: {
    borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 12, padding: 12,
    fontSize: 14, color: Colors.text,
    minHeight: 80, textAlignVertical: 'top',
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, backgroundColor: '#FDEDEC',
    padding: 10, borderRadius: 10, marginBottom: 12,
  },
  errorText: { fontSize: 13, color: '#E74C3C', flex: 1 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  declineBtn: { borderColor: '#E74C3C', backgroundColor: '#FDEDEC' },
  acceptBtn:  { borderColor: Colors.primary, backgroundColor: Colors.primary },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
});