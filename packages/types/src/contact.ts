export type ContactSubject = 'general' | 'support' | 'business' | 'partnership';

export interface SubmitContactInput {
  name: string;
  email: string;
  phone: string;
  subject: ContactSubject;
  message: string;
}
