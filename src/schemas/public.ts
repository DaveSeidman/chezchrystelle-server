import { z } from 'zod';

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional()
);

function isValidPhoneNumber(phone: string) {
  const digitCount = phone.replace(/\D/g, '').length;

  return /^[+\d\s().-]+$/.test(phone) && digitCount >= 10 && digitCount <= 15;
}

export const contactSchema = z
  .object({
    name: z.string().trim().min(1, { message: 'Tell us who you are' }),
    email: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.email().optional()
    ),
    phone: optionalTrimmedString,
    message: z.string().trim().min(1, { message: 'What would you like to say' }),
    newsletter: z.boolean().optional().default(false),
    contactReason: optionalTrimmedString
  })
  .refine((value) => value.email || value.phone, {
    message: 'We need a way to get back to you, please add your email address or phone number',
    path: ['email']
  })
  .refine((value) => !value.phone || isValidPhoneNumber(value.phone), {
    message: 'Please add a valid phone number',
    path: ['phone']
  });
