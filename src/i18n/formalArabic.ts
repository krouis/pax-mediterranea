export const forbiddenArabicDialectTerms = [
  'شنوة',
  'توا',
  'توة',
  'برشة',
  'متاع',
  'متاعك',
  'تنجم',
  'تنجّم',
  'تنجمش',
  'تنجّمش',
  'ماكش',
  'باش',
  'ياسر',
  'يلزمك',
  'موش',
  'فما',
  'فمّا',
  'هاذي',
  'عدي',
  'عدّي',
  'سكر',
  'سكّر',
  'كمل',
  'كمّل',
  'خذا',
  'بعثهولك',
  'ما عندكش',
] as const;

export function normalizeArabic(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\u0640/gu, '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function containsArabicTerm(value: string, term: string): boolean {
  const normalizedValue = normalizeArabic(value);
  const normalizedTerm = normalizeArabic(term);
  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[\\s،؛.!؟:])${escaped}(?:$|[\\s،؛.!؟:])`, 'u').test(normalizedValue);
}

export function findForbiddenArabicDialectTerms(value: string): string[] {
  return forbiddenArabicDialectTerms.filter((term) => containsArabicTerm(value, term));
}
