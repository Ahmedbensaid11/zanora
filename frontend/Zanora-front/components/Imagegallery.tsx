import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CAROUSEL_HEIGHT = 260;
const THUMB_SIZE = 60;
const THUMB_GAP = 8;

export interface GalleryImage {
  uri: string;
  isPrimary?: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

// ─── Fullscreen Viewer ────────────────────────────────────────────────────────
const FullscreenViewer = ({
  images,
  startIndex,
  visible,
  onClose,
}: {
  images: GalleryImage[];
  startIndex: number;
  visible: boolean;
  onClose: () => void;
}) => {
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const flatRef = useRef<FlatList>(null);
  const thumbRef = useRef<FlatList>(null);

  React.useEffect(() => {
    if (visible) {
      setActiveIndex(startIndex);
      setTimeout(() => {
        flatRef.current?.scrollToIndex({ index: startIndex, animated: false });
      }, 50);
    }
  }, [visible, startIndex]);

  const goTo = (index: number) => {
    flatRef.current?.scrollToIndex({ index, animated: true });
    thumbRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
    setActiveIndex(index);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={fsStyles.container}>
        {/* Close button */}
        <TouchableOpacity style={fsStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Counter */}
        {images.length > 1 && (
          <View style={fsStyles.counter}>
            <Text style={fsStyles.counterText}>
              {activeIndex + 1} / {images.length}
            </Text>
          </View>
        )}

        {/* Main image pager */}
        <FlatList
          ref={flatRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          initialScrollIndex={startIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_W,
            offset: SCREEN_W * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            thumbRef.current?.scrollToIndex({
              index: idx,
              animated: true,
              viewPosition: 0.5,
            });
            setActiveIndex(idx);
          }}
          renderItem={({ item }) => (
            <View style={fsStyles.imageWrapper}>
              <Image source={{ uri: item.uri }} style={fsStyles.image} resizeMode="contain" />
            </View>
          )}
        />

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <View style={fsStyles.thumbStrip}>
            <FlatList
              ref={thumbRef}
              data={images}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => `thumb-fs-${i}`}
              contentContainerStyle={{ paddingHorizontal: 12, gap: THUMB_GAP }}
              getItemLayout={(_, index) => ({
                length: THUMB_SIZE + THUMB_GAP,
                offset: (THUMB_SIZE + THUMB_GAP) * index,
                index,
              })}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => goTo(index)}
                  activeOpacity={0.8}
                  style={[
                    fsStyles.thumb,
                    index === activeIndex && fsStyles.thumbActive,
                  ]}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={fsStyles.thumbImage}
                    resizeMode="cover"
                  />
                  {index !== activeIndex && <View style={fsStyles.thumbDim} />}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

// ─── Image Gallery (Carousel) ─────────────────────────────────────────────────
const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const mainRef = useRef<FlatList>(null);
  const thumbRef = useRef<FlatList>(null);

  const goTo = (index: number) => {
    mainRef.current?.scrollToIndex({ index, animated: true });
    thumbRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
    setActiveIndex(index);
  };

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenVisible(true);
  };

  if (images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <MaterialCommunityIcons name="home-city-outline" size={72} color="rgba(255,255,255,0.3)" />
        <Text style={styles.placeholderText}>No photos available</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.wrapper}>
        {/* ── Main carousel ── */}
        <View style={styles.mainCarousel}>
          <FlatList
            ref={mainRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `main-${i}`}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              thumbRef.current?.scrollToIndex({
                index: idx,
                animated: true,
                viewPosition: 0.5,
              });
              setActiveIndex(idx);
            }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => openFullscreen(index)}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
                {/* Expand hint */}
                <View style={styles.expandHint}>
                  <MaterialCommunityIcons
                    name="fullscreen"
                    size={16}
                    color="rgba(255,255,255,0.9)"
                  />
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Counter badge */}
          {images.length > 1 && (
            <View style={styles.counterBadge}>
              <MaterialCommunityIcons name="image-multiple" size={12} color="#fff" />
              <Text style={styles.counterText}>
                {activeIndex + 1} / {images.length}
              </Text>
            </View>
          )}

          {/* Left / Right arrows */}
          {images.length > 1 && activeIndex > 0 && (
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft]}
              onPress={() => goTo(activeIndex - 1)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          {images.length > 1 && activeIndex < images.length - 1 && (
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              onPress={() => goTo(activeIndex + 1)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Thumbnail strip ── */}
        {images.length > 1 && (
          <View style={styles.thumbStrip}>
            <FlatList
              ref={thumbRef}
              data={images}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => `thumb-${i}`}
              contentContainerStyle={{ paddingHorizontal: 12, gap: THUMB_GAP }}
              getItemLayout={(_, index) => ({
                length: THUMB_SIZE + THUMB_GAP,
                offset: (THUMB_SIZE + THUMB_GAP) * index,
                index,
              })}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => goTo(index)}
                  activeOpacity={0.8}
                  style={[
                    styles.thumb,
                    index === activeIndex && styles.thumbActive,
                  ]}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                  {index !== activeIndex && <View style={styles.thumbDim} />}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      <FullscreenViewer
        images={images}
        startIndex={fullscreenIndex}
        visible={fullscreenVisible}
        onClose={() => setFullscreenVisible(false)}
      />
    </>
  );
};

export default ImageGallery;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1a2340',
  },
  placeholder: {
    width: SCREEN_W,
    height: CAROUSEL_HEIGHT,
    backgroundColor: '#1a2340',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  // Main carousel
  mainCarousel: {
    width: SCREEN_W,
    height: CAROUSEL_HEIGHT,
  },
  mainImage: {
    width: SCREEN_W,
    height: CAROUSEL_HEIGHT,
  },
  expandHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 6,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  arrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },

  // Thumbnail strip
  thumbStrip: {
    paddingVertical: 10,
    backgroundColor: '#111827',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#fff',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});

const fsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 28,
    right: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 28,
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Thumbnail strip in fullscreen
  thumbStrip: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#fff',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});