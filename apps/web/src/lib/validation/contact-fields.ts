import type { ContactSubject, SubmitContactInput } from '@rateq/types';
import { isValidQatarPhone } from '@/lib/qatar-phone';

export {
  QATAR_PHONE_PREFIX,
  QATAR_PHONE_DIGITS,
  sanitizeQatarPhoneDigits,
  formatQatarPhoneForSubmit,
} from '@/lib/qatar-phone';

const NAME_PATTERN = /^[\p{L}]+(?:\s+[\p{L}]+)*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTACT_SUBJECTS: ContactSubject[] = ['general', 'support', 'business', 'partnership'];

export type ContactFieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
};

export function validateContactFields(
  input: SubmitContactInput,
  messages: {
    name: { required: string; invalid: string; min: string; max: string };
    email: { required: string; invalid: string };
    phone: { required: string; invalid: string };
    subject: { required: string; invalid: string };
    message: { required: string; min: string; max: string };
  },
): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const message = input.message.trim();

  if (!name) {
    errors.name = messages.name.required;
  } else if (name.length < 2) {
    errors.name = messages.name.min;
  } else if (name.length > 100) {
    errors.name = messages.name.max;
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = messages.name.invalid;
  }

  if (!email) {
    errors.email = messages.email.required;
  } else if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    errors.email = messages.email.invalid;
  }

  if (!phone) {
    errors.phone = messages.phone.required;
  } else if (!isValidQatarPhone(phone)) {
    errors.phone = messages.phone.invalid;
  }

  if (!input.subject) {
    errors.subject = messages.subject.required;
  } else if (!CONTACT_SUBJECTS.includes(input.subject)) {
    errors.subject = messages.subject.invalid;
  }

  if (!message) {
    errors.message = messages.message.required;
  } else if (message.length < 20) {
    errors.message = messages.message.min;
  } else if (message.length > 2000) {
    errors.message = messages.message.max;
  }

  return errors;
}
