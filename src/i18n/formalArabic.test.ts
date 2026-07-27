import { describe, expect, it } from 'vitest';
import { findForbiddenArabicDialectTerms, normalizeArabic } from './formalArabic';

describe('formal Arabic policy', () => {
  it.each([
    ['شنوة تحب تعمل؟', 'شنوة'],
    ['ما تنجّمش تحرّك الوحدة توّة.', 'تنجّمش'],
    ['فمّا نسخة جديدة.', 'فمّا'],
    ['كمّل الدور.', 'كمّل'],
  ])('rejects dialectal production wording: %s', (value, expected) => {
    expect(findForbiddenArabicDialectTerms(value)).toContain(expected);
  });

  it('normalizes Arabic marks so spelling variants cannot bypass validation', () => {
    expect(normalizeArabic('توّة')).toBe(normalizeArabic('توة'));
    expect(findForbiddenArabicDialectTerms('استعملها توّة.')).toContain('توة');
  });

  it('does not reject approved formal Arabic or historical names', () => {
    expect(
      findForbiddenArabicDialectTerms('اختر قرطاج، ثم حرّك حنبعل برقة واطلب حظوة بعل حمون.'),
    ).toEqual([]);
  });
});
