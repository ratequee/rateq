import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';
import { Label } from './label';

function formatDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string): Date {
  if (!value) return new Date();
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

interface DatePickerFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string;
}

export function DatePickerField({
  label,
  required,
  value,
  onChange,
  maximumDate,
  minimumDate,
  error,
}: DatePickerFieldProps) {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = parseDateValue(value);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed' || !date) return;
    onChange(formatDateIso(date));
  };

  return (
    <View>
      <Label required={required}>{label}</Label>
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowPicker(true)}
        className={cn(
          'mt-1 h-12 justify-center rounded-xl border border-slate-200 bg-white px-4 dark:border-dm-border dark:bg-dm-elevated',
          error && 'border-red-500',
        )}
      >
        <Text
          className={cn(
            'text-base',
            value ? 'text-ink dark:text-white' : 'text-ink-muted dark:text-white/60',
          )}
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {value || t('onboarding.selectDate')}
        </Text>
      </Pressable>

      {showPicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === 'ios' && showPicker ? (
        <Pressable onPress={() => setShowPicker(false)} className="mt-2 self-end">
          <Text
            className="text-sm font-medium text-brand-600 dark:text-brand-400"
            style={{ fontFamily: getFontFamily('medium') }}
          >
            {t('onboarding.datePickerDone')}
          </Text>
        </Pressable>
      ) : null}

      {error ? (
        <Text
          className="mt-1 text-sm text-red-500"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
