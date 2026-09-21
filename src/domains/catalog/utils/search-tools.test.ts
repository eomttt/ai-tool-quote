import { describe, expect, it } from 'vitest';
import { createAppI18n } from '../../../common/utils/create-i18n';
import { scenarios } from '../data/scenarios';
import { tools } from '../data/tools';
import type { Medium } from '../models/model-tool';
import { localizeTool } from './localize-catalog';
import { matchesToolSearch, searchTools } from './search-tools';

function findTools(query: string, medium: Medium, language = 'ko') {
  const instance = createAppI18n();
  const t = instance.getFixedT(language, 'catalog');
  return tools
    .map((tool) => localizeTool(tool, t))
    .filter((tool) => tool.media.includes(medium) && matchesToolSearch(tool, medium, query))
    .map((tool) => tool.id);
}

describe('searching by situation', () => {
  it('finds tools for everyday Korean requests without matching the whole sentence', () => {
    expect(findTools('유튜브 쇼츠 만들고 싶어요', 'video')).toContain('veed');
    expect(findTools('내 사진을 움직이게 하고 싶어', 'video')).toContain('kling');
    expect(findTools('촬영 비하인드', 'video')).toContain('higgsfield');
    expect(findTools('상품 사진 쇼핑몰', 'image')).toContain('photoroom');
    expect(findTools('얼굴 공개 없이 설명 영상', 'video')).toContain('heygen');
  });

  it('matches English situations and punctuation in either interface language', () => {
    for (const language of ['ko', 'en']) {
      expect(findTools('I want to animate a photo', 'video', language)).toContain('midjourney');
      expect(findTools('behind-the-scenes', 'video', language)).toContain('higgsfield');
      expect(findTools('YouTube thumbnail', 'image', language)).toContain('canva');
      expect(findTools('product photos', 'image', language)).toContain('photoroom');
    }
  });

  it('includes video clip creation tools when searching for short-form content', () => {
    for (const query of ['쇼츠', '릴스', '쇼츠, 릴스', 'Shorts and Reels']) {
      expect(findTools(query, 'video')).toContain('runway');
    }
  });

  it('keeps name, alias, and feature searches working', () => {
    expect(findTools('  RUNWAY  ', 'video')).toEqual(['runway']);
    expect(findTools('higgs field', 'video')).toEqual(['higgsfield']);
    expect(findTools('나노 바나나', 'image')).toContain('gemini');
    expect(findTools('자막', 'video')).toContain('veed');
    expect(findTools('upscale', 'image', 'en')).toContain('magnific');
  });

  it('ranks the strongest matches first while tolerating unknown words in a situation', () => {
    expect(searchTools('higgsfield 촬영 비하인드')[0]?.id).toBe('higgsfield');
    expect(searchTools('higgsfield 촬영 비하인드 없는검색어')[0]?.id).toBe('higgsfield');
    expect(findTools('전혀없는도구', 'video')).toEqual([]);
    expect(searchTools('촬영 비하인드')[0]?.scenario?.medium).toBe('video');
    expect(findTools('   ', 'video')).toHaveLength(28);
  });

  it('keeps all scenario choices discoverable and translated', () => {
    const instance = createAppI18n();
    const t = instance.getFixedT('en', 'catalog');
    for (const scenario of scenarios) {
      expect(t(scenario.label)).not.toMatch(/[가-힣]/);
      expect(t(scenario.description)).not.toMatch(/[가-힣]/);
      const koreanResults = findTools(scenario.label, scenario.medium);
      const englishResults = findTools(t(scenario.label), scenario.medium, 'en');
      for (const id of scenario.toolIds) {
        expect(koreanResults).toContain(id);
        expect(englishResults).toContain(id);
      }
    }
  });
});
