import { describe, expect, it } from '@jest/globals';
import { attachToolLogo, getDomainFromUrl, getToolLogoUrl } from './productLogo.js';

describe('productLogo helpers', () => {
  it('extracts a clean domain from a url', () => {
    expect(getDomainFromUrl('https://www.notion.so/product')).toBe('notion.so');
  });

  it('returns a favicon url when the tool has a url', () => {
    const logoUrl = getToolLogoUrl({ name: 'Slack', url: 'https://slack.com' });
    expect(logoUrl).toContain('google.com/s2/favicons?sz=128&domain=slack.com');
  });

  it('maps product names like canva and indesign to brand domains', () => {
    const canvaLogo = getToolLogoUrl({ name: 'Canva' });
    const indesignLogo = getToolLogoUrl({ name: 'InDesign' });

    expect(canvaLogo).toContain('domain=canva.com');
    expect(indesignLogo).toContain('domain=adobe.com');
  });

  it('falls back to an inline svg when no url exists', () => {
    const logoUrl = getToolLogoUrl({ name: 'Custom Internal Tool' });
    expect(logoUrl.startsWith('data:image/svg+xml;charset=UTF-8,')).toBe(true);
  });

  it('attaches a logoUrl to a tool object', () => {
    const tool = attachToolLogo({ name: 'Figma', url: 'https://figma.com' });
    expect(tool).toHaveProperty('logoUrl');
  });
});
