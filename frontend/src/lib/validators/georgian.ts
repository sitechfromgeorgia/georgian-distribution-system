/**
 * Georgian-specific validation rules and utilities
 */

import { z } from 'zod';

/**
 * Georgian phone number validation
 * Format: 5XXXXXXXX (9 digits starting with 5)
 * With country code: +995 5XX XX XX XX
 */
export const GEORGIAN_PHONE_REGEX = /^5\d{8}$/;
export const GEORGIAN_PHONE_WITH_CODE_REGEX = /^(\+?995)?5\d{8}$/;

/**
 * Georgian postal code validation
 * Format: 4 digits (e.g., 0100 for Tbilisi)
 */
export const GEORGIAN_POSTAL_CODE_REGEX = /^\d{4}$/;

/**
 * Georgian personal ID number (Personal Number)
 * Format: 11 digits
 */
export const GEORGIAN_PERSONAL_ID_REGEX = /^\d{11}$/;

/**
 * Georgian tax identification number (TIN/EDRPOU)
 * Format: 9 digits for individuals, 9 digits for legal entities
 */
export const GEORGIAN_TIN_REGEX = /^\d{9}$/;

/**
 * Georgian bank account number (IBAN)
 * Format: GE + 2 check digits + 2 bank code + 16 account number = 22 characters
 */
export const GEORGIAN_IBAN_REGEX = /^GE\d{2}[A-Z]{2}\d{16}$/;

/**
 * Georgian cities (major cities)
 */
export const GEORGIAN_CITIES = [
  'თბილისი', // Tbilisi
  'ქუთაისი', // Kutaisi
  'ბათუმი', // Batumi
  'რუსთავი', // Rustavi
  'გორი', // Gori
  'ზუგდიდი', // Zugdidi
  'ფოთი', // Poti
  'ხაშური', // Khashuri
  'სამტრედია', // Samtredia
  'სენაკი', // Senaki
  'ზესტაფონი', // Zestaponi
  'მარნეული', // Marneuli
  'თელავი', // Telavi
  'ახალციხე', // Akhaltsikhe
  'ქობულეთი', // Kobuleti
  'ოზურგეთი', // Ozurgeti
  'ახალქალაქი', // Akhalkalaki
  'წყალტუბო', // Tskaltubo
  'მცხეთა', // Mtskheta
  'გარდაბანი', // Gardabani
] as const;

/**
 * Zod schema for Georgian phone number validation
 */
export const georgianPhoneSchema = z.string()
  .regex(GEORGIAN_PHONE_WITH_CODE_REGEX, 'validation.georgianPhone')
  .transform((val) => {
    // Normalize phone number - remove country code and non-digits
    const digits = val.replace(/\D/g, '');
    if (digits.startsWith('995')) {
      return digits.slice(3);
    }
    return digits;
  });

/**
 * Zod schema for Georgian postal code validation
 */
export const georgianPostalCodeSchema = z.string()
  .regex(GEORGIAN_POSTAL_CODE_REGEX, 'Invalid postal code. Must be 4 digits.');

/**
 * Zod schema for Georgian personal ID validation
 */
export const georgianPersonalIdSchema = z.string()
  .regex(GEORGIAN_PERSONAL_ID_REGEX, 'Invalid personal ID. Must be 11 digits.');

/**
 * Zod schema for Georgian TIN validation
 */
export const georgianTinSchema = z.string()
  .regex(GEORGIAN_TIN_REGEX, 'Invalid TIN. Must be 9 digits.');

/**
 * Zod schema for Georgian IBAN validation
 */
export const georgianIbanSchema = z.string()
  .regex(GEORGIAN_IBAN_REGEX, 'Invalid IBAN format for Georgia.');

/**
 * Zod schema for Georgian city validation
 */
export const georgianCitySchema = z.enum(GEORGIAN_CITIES as unknown as [string, ...string[]]);

/**
 * Zod schema for Georgian address
 */
export const georgianAddressSchema = z.object({
  street: z.string().min(3, 'Street address must be at least 3 characters'),
  city: georgianCitySchema.or(z.string().min(2, 'City must be at least 2 characters')),
  postalCode: georgianPostalCodeSchema.optional(),
  apartment: z.string().optional(),
  floor: z.string().optional(),
  entrance: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Validate Georgian phone number
 */
export function isValidGeorgianPhone(phone: string): boolean {
  const normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('995')) {
    return GEORGIAN_PHONE_REGEX.test(normalized.slice(3));
  }
  return GEORGIAN_PHONE_REGEX.test(normalized);
}

/**
 * Validate Georgian postal code
 */
export function isValidGeorgianPostalCode(code: string): boolean {
  return GEORGIAN_POSTAL_CODE_REGEX.test(code);
}

/**
 * Validate Georgian personal ID
 */
export function isValidGeorgianPersonalId(id: string): boolean {
  if (!GEORGIAN_PERSONAL_ID_REGEX.test(id)) {
    return false;
  }

  // TODO: Add checksum validation if needed
  // Georgian personal IDs have a checksum algorithm
  return true;
}

/**
 * Validate Georgian TIN
 */
export function isValidGeorgianTin(tin: string): boolean {
  if (!GEORGIAN_TIN_REGEX.test(tin)) {
    return false;
  }

  // TODO: Add checksum validation if needed
  return true;
}

/**
 * Validate Georgian IBAN
 */
export function isValidGeorgianIban(iban: string): boolean {
  if (!GEORGIAN_IBAN_REGEX.test(iban)) {
    return false;
  }

  // IBAN checksum validation (mod 97)
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  // Calculate mod 97
  let remainder = numeric;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(block.length);
  }

  return parseInt(remainder, 10) % 97 === 1;
}

/**
 * Format Georgian address for display
 */
export function formatGeorgianAddress(address: z.infer<typeof georgianAddressSchema>): string {
  const parts: string[] = [address.street];

  if (address.apartment) {
    parts.push(`ბინა ${address.apartment}`);
  }
  if (address.floor) {
    parts.push(`სართული ${address.floor}`);
  }
  if (address.entrance) {
    parts.push(`სადარბაზო ${address.entrance}`);
  }

  parts.push(address.city);

  if (address.postalCode) {
    parts.push(address.postalCode);
  }

  return parts.join(', ');
}

/**
 * Georgian business registration number validation
 * Format: 9 digits
 */
export const georgianBusinessRegNumberSchema = z.string()
  .regex(/^\d{9}$/, 'Invalid business registration number. Must be 9 digits.');
