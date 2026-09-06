import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface DocumentFullscreenViewerProps {
  uri: string;
  visible: boolean;
  title?: string;
  onClose: () => void;
}

function getWebViewSource(uri: string) {
  if (uri.startsWith('http')) {
    return { uri };
  }

  if (Platform.OS === 'android') {
    return { uri };
  }

  return { uri };
}

export function DocumentFullscreenViewer({
  uri,
  visible,
  title,
  onClose,
}: DocumentFullscreenViewerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="fullScreen"
    >
      <StatusBar barStyle="light-content" />
      <View className="flex-1 bg-black">
        <View
          className="flex-row items-center justify-between border-b border-white/10 px-4 pb-3"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Text className="flex-1 pr-3 text-base font-semibold text-white" numberOfLines={1}>
            {title ?? t('profile.edit.viewingDocument')}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </Pressable>
        </View>

        <WebView
          source={getWebViewSource(uri)}
          style={styles.webview}
          originWhitelist={['*']}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
});
