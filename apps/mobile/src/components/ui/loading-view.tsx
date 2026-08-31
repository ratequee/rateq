import { ActivityIndicator, View } from 'react-native';

export function LoadingView() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-dm-bg">
      <ActivityIndicator size="large" color="#8E2157" />
    </View>
  );
}
