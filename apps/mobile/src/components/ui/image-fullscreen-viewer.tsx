import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageFullscreenViewerProps {
  images: string[];
  visible: boolean;
  initialIndex?: number;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function ImageFullscreenViewer({
  images,
  visible,
  initialIndex = 0,
  onClose,
}: ImageFullscreenViewerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<string>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(initialIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
  }, [visible, initialIndex]);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <View className="flex-1 bg-black">
        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(uri, index) => `${uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onMomentumScrollEnd={onMomentumScrollEnd}
          renderItem={({ item }) => (
            <View
              style={{ width: screenWidth, height: screenHeight }}
              className="items-center justify-center"
            >
              <Image
                source={{ uri: item }}
                style={{ width: screenWidth, height: screenHeight * 0.75 }}
                resizeMode="contain"
              />
            </View>
          )}
        />

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{
              position: 'absolute',
              top: insets.top + 8,
              right: 16,
              zIndex: 100,
              elevation: 100,
            }}
            className="h-11 w-11 items-center justify-center rounded-full bg-black/55"
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={26} color="#ffffff" />
          </Pressable>

          {images.length > 1 ? (
            <View
              pointerEvents="none"
              className="absolute left-0 right-0 items-center"
              style={{ top: insets.top + 16 }}
            >
              <Text className="rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {currentIndex + 1} / {images.length}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

interface PressableFullscreenImageProps {
  uri: string;
  gallery?: string[];
  galleryIndex?: number;
  className?: string;
  imageClassName?: string;
  height?: number;
}

export function PressableFullscreenImage({
  uri,
  gallery,
  galleryIndex = 0,
  className,
  imageClassName,
  height = 224,
}: PressableFullscreenImageProps) {
  const [visible, setVisible] = useState(false);
  const images = gallery && gallery.length > 0 ? gallery : [uri];

  return (
    <>
      <Pressable onPress={() => setVisible(true)} className={`relative ${className ?? ''}`}>
        <Image
          source={{ uri }}
          className={imageClassName}
          style={{ height, width: '100%' }}
          resizeMode="cover"
        />
        <View
          className="absolute bottom-3 right-3 rounded-full bg-black/45 p-2"
          pointerEvents="none"
        >
          <Ionicons name="expand-outline" size={18} color="#ffffff" />
        </View>
      </Pressable>

      <ImageFullscreenViewer
        images={images}
        visible={visible}
        initialIndex={galleryIndex}
        onClose={() => setVisible(false)}
      />
    </>
  );
}
