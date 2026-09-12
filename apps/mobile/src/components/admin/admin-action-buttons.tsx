import { Button } from '@/components/ui/button';
import { View } from 'react-native';

interface AdminActionButtonsProps {
  acting?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onResolve?: () => void;
  onDelete?: () => void;
  approveLabel: string;
  rejectLabel: string;
  resolveLabel?: string;
  deleteLabel?: string;
}

export function AdminActionButtons({
  acting,
  onApprove,
  onReject,
  onResolve,
  onDelete,
  approveLabel,
  rejectLabel,
  resolveLabel,
  deleteLabel,
}: AdminActionButtonsProps) {
  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {onApprove ? (
        <Button
          title={approveLabel}
          size="md"
          className="min-w-[100px] flex-1"
          loading={acting}
          onPress={onApprove}
        />
      ) : null}
      {onReject ? (
        <Button
          title={rejectLabel}
          variant="outline"
          size="md"
          className="min-w-[100px] flex-1"
          disabled={acting}
          onPress={onReject}
        />
      ) : null}
      {onResolve && resolveLabel ? (
        <Button
          title={resolveLabel}
          variant="gold"
          size="md"
          className="min-w-[100px] flex-1"
          disabled={acting}
          onPress={onResolve}
        />
      ) : null}
      {onDelete && deleteLabel ? (
        <Button
          title={deleteLabel}
          variant="ghost"
          size="md"
          className="min-w-[100px] flex-1"
          disabled={acting}
          onPress={onDelete}
        />
      ) : null}
    </View>
  );
}
