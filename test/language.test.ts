import { describe, expect, it } from 'vitest';

import { matchLanguage, resolveLanguage } from '@/lib/language';

describe('matchLanguage', () => {
  it('splits Chinese by script and region', () => {
    expect(matchLanguage('zh')).toBe('zh-CN');
    expect(matchLanguage('zh-CN')).toBe('zh-CN');
    expect(matchLanguage('zh-SG')).toBe('zh-CN');
    expect(matchLanguage('zh-Hans-HK')).toBe('zh-CN');
    expect(matchLanguage('zh-TW')).toBe('zh-Hant');
    expect(matchLanguage('zh-hk')).toBe('zh-Hant');
    expect(matchLanguage('zh-MO')).toBe('zh-Hant');
    expect(matchLanguage('zh-Hant')).toBe('zh-Hant');
  });

  it('matches other languages on the primary subtag', () => {
    expect(matchLanguage('en-GB')).toBe('en');
    expect(matchLanguage('ja-JP')).toBe('ja');
    expect(matchLanguage('ko-KR')).toBe('ko');
    expect(matchLanguage('de-DE')).toBe('de');
    expect(matchLanguage('fr-FR')).toBe('fr');
    expect(matchLanguage('it-IT')).toBe('it');
    expect(matchLanguage('es-ES')).toBe('es');
    expect(matchLanguage('pt-BR')).toBe('pt');
    expect(matchLanguage('ru-RU')).toBeNull();
  });
});

describe('resolveLanguage', () => {
  it('prefers a language chosen by hand', () => {
    expect(resolveLanguage('en', ['zh-CN'])).toBe('en');
    expect(resolveLanguage('zh-Hant', ['en'])).toBe('zh-Hant');
    expect(resolveLanguage('ja', ['en'])).toBe('ja');
    expect(resolveLanguage('ko', ['en'])).toBe('ko');
    expect(resolveLanguage('de', ['en'])).toBe('de');
    expect(resolveLanguage('fr', ['en'])).toBe('fr');
    expect(resolveLanguage('it', ['en'])).toBe('it');
    expect(resolveLanguage('es', ['en'])).toBe('es');
    expect(resolveLanguage('pt', ['en'])).toBe('pt');
  });

  it('ignores an unknown choice and follows the browser in order', () => {
    expect(resolveLanguage('xx', ['ru', 'zh-HK', 'en'])).toBe('zh-Hant');
    expect(resolveLanguage(null, ['zh-TW', 'en'])).toBe('zh-Hant');
    expect(resolveLanguage(null, ['ja-JP', 'en'])).toBe('ja');
    expect(resolveLanguage(null, ['ko-KR', 'en'])).toBe('ko');
    expect(resolveLanguage(null, ['de-DE', 'en'])).toBe('de');
    expect(resolveLanguage(null, ['fr-FR', 'en'])).toBe('fr');
    expect(resolveLanguage(null, ['it-IT', 'en'])).toBe('it');
    expect(resolveLanguage(null, ['es-ES', 'en'])).toBe('es');
    expect(resolveLanguage(null, ['pt-BR', 'en'])).toBe('pt');
  });

  it('falls back to English', () => {
    expect(resolveLanguage(null, ['ru', 'nl'])).toBe('en');
    expect(resolveLanguage(null, [])).toBe('en');
  });
});
