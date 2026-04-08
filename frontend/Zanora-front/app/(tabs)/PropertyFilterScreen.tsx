import React, { useCallback, useEffect, useRef, useState } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EmptyHouseAnimation from '../../components/Emptyhouseanimation';

import {
    ActivityIndicator,
    Animated,
    FlatList,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import CreatePropertyModal from '../../components/Createpropertymodal ';
import FilterSheet from '../../components/FilterSheet';
import PropertyCard from '../../components/PropertyCard';
import SearchBar from '../../components/SearchBar';
import { Colors } from '../../constants/Colors';
import {
    fetchCitySuggestions,
    fetchProperties,
    fetchStateSuggestions,
    PropertyFilterParams,
    PropertyPage,
    PropertyResponseDTO,
    SuggestionDTO,
} from '../../services/Propertyservice';

const DEFAULT_FILTERS: PropertyFilterParams = {
  page: 0,
  size: 10,
  sortBy: 'createdAt',
  sortDirection: 'desc',
};

const PropertyFilterScreen = () => {
  // ── Modal / FAB state ─────────────────────────────────────────────────────
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<PropertyFilterParams>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] =
    useState<PropertyFilterParams>(DEFAULT_FILTERS);

  // ── Location search state ─────────────────────────────────────────────────
  const [stateQuery, setStateQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [stateSuggestions, setStateSuggestions] = useState<SuggestionDTO[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<SuggestionDTO[]>([]);
  const [selectedState, setSelectedState] = useState<SuggestionDTO | null>(null);
  const [selectedCity, setSelectedCity] = useState<SuggestionDTO | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // ── Results state ─────────────────────────────────────────────────────────
  const [data, setData] = useState<PropertyPage | null>(null);
  const [properties, setProperties] = useState<PropertyResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [sheetVisible, setSheetVisible] = useState(false);

  // ── Animations ────────────────────────────────────────────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const filterBtnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(filterBtnAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(fabAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Fetch properties ──────────────────────────────────────────────────────
  const loadProperties = useCallback(
    async (pageFilters: PropertyFilterParams, append = false) => {
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        const result = await fetchProperties(pageFilters);

        setData(result);
        setProperties((prev) =>
          append ? [...prev, ...result.content] : result.content
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProperties(filters);
  }, [filters]);

  // ── State suggestions ─────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!stateQuery.trim()) {
        setStateSuggestions([]);
        return;
      }
      setSuggestionLoading(true);
      const s = await fetchStateSuggestions(stateQuery);
      setStateSuggestions(s);
      setSuggestionLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [stateQuery]);

  // ── City suggestions ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!cityQuery.trim()) {
        setCitySuggestions([]);
        return;
      }
      const s = await fetchCitySuggestions(cityQuery, selectedState?.id);
      setCitySuggestions(s);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery, selectedState]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectState = (item: SuggestionDTO) => {
    setSelectedState(item);
    setStateQuery(item.name);
    setStateSuggestions([]);
    setFilters((prev) => ({
      ...prev,
      stateId: item.id,
      cityId: undefined,
      page: 0,
    }));
    setSelectedCity(null);
    setCityQuery('');
  };

  const handleSelectCity = (item: SuggestionDTO) => {
    setSelectedCity(item);
    setCityQuery(item.name);
    setCitySuggestions([]);
    setFilters((prev) => ({ ...prev, cityId: item.id, page: 0 }));
  };

  const handleApplyFilters = () => {
    setFilters({ ...pendingFilters, page: 0 });
    setSheetVisible(false);
  };

  const handleResetFilters = () => {
    setPendingFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setSelectedState(null);
    setSelectedCity(null);
    setStateQuery('');
    setCityQuery('');
    setSheetVisible(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setProperties([]);
    loadProperties({ ...filters, page: 0 }, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || !data) return;
    const nextPage = (data.number ?? 0) + 1;
    if (nextPage >= data.totalPages) return;
    const nextFilters = { ...filters, page: nextPage };
    setFilters(nextFilters);
    loadProperties(nextFilters, true);
  };

  const activeFilterCount = [
    pendingFilters.type,
    pendingFilters.status,
    pendingFilters.bedrooms,
    pendingFilters.bathrooms,
    pendingFilters.minRating,
    pendingFilters.sortBy !== 'createdAt' ? pendingFilters.sortBy : null,
  ].filter(Boolean).length;

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
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.headerTitle}>Find your</Text>
        <Text style={styles.headerAccent}>Perfect Property</Text>
      </Animated.View>

      {/* Search + Filter row */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBarWrapper, { zIndex: 20 }]}>
          <SearchBar
            placeholder="Search state..."
            value={stateQuery}
            onChangeText={(t) => {
              setStateQuery(t);
              if (!t) {
                setSelectedState(null);
                setFilters((p) => ({ ...p, stateId: undefined, page: 0 }));
              }
            }}
            suggestions={stateSuggestions}
            onSelectSuggestion={handleSelectState}
            loading={suggestionLoading}
            icon={<MaterialCommunityIcons name="map-marker" size={20} color="#666" />}
          />
        </View>

        <View style={[styles.searchBarWrapper, { zIndex: 10, marginTop: 10 }]}>
          <SearchBar
            placeholder="Search city..."
            value={cityQuery}
            onChangeText={(t) => {
              setCityQuery(t);
              if (!t) {
                setSelectedCity(null);
                setFilters((p) => ({ ...p, cityId: undefined, page: 0 }));
              }
            }}
            suggestions={citySuggestions}
            onSelectSuggestion={handleSelectCity}
            icon={<MaterialCommunityIcons name="map-marker" size={20} color="#666" />}
          />
        </View>

        <Animated.View
          style={{
            opacity: filterBtnAnim,
            transform: [
              {
                scale: filterBtnAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            marginTop: 12,
          }}
        >
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setSheetVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.filterBtnIcon}><MaterialCommunityIcons name="cog" size={22} color="#000" /></Text>
            <Text style={styles.filterBtnText}>Filters</Text>
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Results count */}
      {data && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {data.totalElements} propert{data.totalElements !== 1 ? 'ies' : 'y'} found
          </Text>
        </View>
      )}

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding properties...</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <PropertyCard property={item} index={index} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={Colors.primary}
                style={{ paddingVertical: 20 }}
              />
            ) : null
          }
            ListEmptyComponent={
            <EmptyHouseAnimation
                title="No properties found"
                subtitle="Try adjusting your filters"
            />
            }
        />
      )}

      {/* Filter Sheet */}
      <FilterSheet
        visible={sheetVisible}
        filters={pendingFilters}
        onChange={(partial) =>
          setPendingFilters((prev) => ({ ...prev, ...partial }))
        }
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onClose={() => setSheetVisible(false)}
      />

      {/* FAB — must be after FlatList so it sits on top */}
      <Animated.View
        style={[
          fabStyles.fab,
          {
            opacity: fabAnim,
            transform: [{ scale: fabAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={fabStyles.fabBtn}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.88}
        >
          <Text style={fabStyles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Create Property Modal */}
      <CreatePropertyModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={() => {
          setCreateModalVisible(false);
          handleRefresh();
        }}
      />
    </View>
  );
};

export default PropertyFilterScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textSecondary,
    lineHeight: 30,
  },
  headerAccent: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 36,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBarWrapper: { position: 'relative' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterBtnIcon: { fontSize: 15 },
  filterBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  badge: {
    backgroundColor: '#E74C3C',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  resultsRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  list: { paddingTop: 4, paddingBottom: 100 },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 15 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
});

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    zIndex: 50,
  },
  fabBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 30,
    color: Colors.white,
    fontWeight: '300',
    lineHeight: 34,
  },
});