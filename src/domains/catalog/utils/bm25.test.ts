import { expect, it } from 'vitest';
import { createBm25Index } from './bm25';
import { tokenizeSearch } from './tokenize-search';
import { searchTools } from './search-tools';

it('applies field weights before a single saturation step', () => {
  const index = createBm25Index([
    {
      id: 'a',
      fields: [
        { text: 'photo', weight: 5 },
        { text: 'photo', weight: 3 },
      ],
    },
  ]);
  expect(index.search('photo')[0]?.score).toBeCloseTo(
    (Math.log(1 + 0.5 / 1.5) * 8 * 2.2) / (8 + 1.2),
  );
  expect(index.search('photo photo')[0]?.score).toBe(index.search('photo')[0]?.score);
});

it('rewards rare terms and normalizes document length', () => {
  const index = createBm25Index([
    { id: 'specific', fields: [{ text: 'photo caption', weight: 1 }] },
    {
      id: 'long',
      fields: [{ text: 'photo caption scenery landscape travel wildlife mountain', weight: 1 }],
    },
    { id: 'common', fields: [{ text: 'photo landscape', weight: 1 }] },
  ]);
  expect(index.search('photo caption').map((item) => item.id)).toEqual([
    'specific',
    'long',
    'common',
  ]);
  expect(index.search('unknown')).toEqual([]);
  expect(createBm25Index([]).search('photo')).toEqual([]);
});

it('normalizes ordinary Korean phrases, typos, and English equivalents', () => {
  expect(tokenizeSearch('사진을 유투브 쇼츠로')).toEqual(['photo', 'youtube', 'shorts']);
  expect(tokenizeSearch('얼굴 안 나오게')).toEqual(['faceless']);
  expect(tokenizeSearch('behind-the-scenes')).toEqual(['behindscenes']);
  expect(tokenizeSearch('photos for YouTube Shorts')).toEqual(['photo', 'youtube', 'shorts']);
});

it('recommends tools for goals without requiring names or technical vocabulary', () => {
  expect(
    searchTools('나 이런 걸로 쇼츠 만들어서 유튜브에 올려보고 싶어')
      .slice(0, 3)
      .some((result) => ['invideo', 'veed', 'pictory', 'fliki'].includes(result.id)),
  ).toBe(true);
  expect(
    searchTools('집에서 찍은 상품 사진 배경을 바꿔서 쇼핑몰에 올리고 싶어')
      .slice(0, 3)
      .some((result) => result.id === 'photoroom'),
  ).toBe(true);
  expect(
    searchTools('얼굴 안 나오게 대본으로 강의 설명 영상을 만들고 싶어')
      .slice(0, 5)
      .some((result) => ['heygen', 'synthesia', 'colossyan'].includes(result.id)),
  ).toBe(true);
  expect(
    searchTools('여행 사진 몇 장으로 짧은 영상을 만들고 싶어')
      .slice(0, 5)
      .some((result) => ['luma', 'kling', 'runway', 'vidu'].includes(result.id)),
  ).toBe(true);
});
