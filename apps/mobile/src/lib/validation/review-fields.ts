export type ReviewFieldErrors = {
  title?: string;
  content?: string;
  proof?: string;
};

export function sanitizeReviewTitle(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/^\s+/, '');
}

export function sanitizeReviewContent(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/^\s+/, '');
}

export function validateReviewFields(
  fields: { title: string; content: string },
  messages: {
    title: { required: string; min: string; max: string };
    content: { required: string; min: string; max: string };
  },
): ReviewFieldErrors {
  const errors: ReviewFieldErrors = {};
  const title = fields.title.trim();
  const content = fields.content.trim();

  if (!title) {
    errors.title = messages.title.required;
  } else if (title.length < 3) {
    errors.title = messages.title.min;
  } else if (title.length > 120) {
    errors.title = messages.title.max;
  }

  if (!content) {
    errors.content = messages.content.required;
  } else if (content.length < 20) {
    errors.content = messages.content.min;
  } else if (content.length > 2000) {
    errors.content = messages.content.max;
  }

  return errors;
}

export function hasReviewValidationErrors(errors: ReviewFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
