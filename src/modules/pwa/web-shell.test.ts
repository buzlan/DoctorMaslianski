import { theme } from '@/shared/theme';

declare const require: (id: string) => {
  readFileSync(path: string, encoding: string): string;
  join(...parts: string[]): string;
};
declare const __dirname: string;

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '../../..');

describe('patient web shell', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'),
  ) as {
    name: string;
    short_name: string;
    id: string;
    scope: string;
    display: string;
    orientation: string;
    background_color: string;
    theme_color: string;
    icons: { src: string; sizes: string }[];
  };
  const worker = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
  const background = theme.colors.light.background;

  it('forces a light document shell', () => {
    expect(html).toContain('name="color-scheme" content="light"');
    expect(html).toContain('color-scheme: light');
    expect(html).toContain(`content="${background}"`);
    expect(html.toLowerCase()).toContain(`background-color: ${background.toLowerCase()}`);
    expect(html).toContain('apple-mobile-web-app-status-bar-style" content="default"');
    expect(html).toContain('overflow: visible');
  });

  it('publishes a standalone manifest in the light shell color', () => {
    expect(manifest.name).toBe('Доктор Маслянский');
    expect(manifest.short_name).toBe('Доктор Маслянский');
    expect(manifest.id).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.background_color).toBe(background);
    expect(manifest.theme_color).toBe(background);
    expect(manifest.icons.map((icon) => icon.sizes).sort()).toEqual(['192x192', '512x512']);
    expect(html).toContain('href="/manifest.webmanifest"');
    expect(html).toContain('href="/apple-touch-icon.png"');
  });

  it('registers a service worker that does not cache responses', () => {
    expect(worker).not.toMatch(/caches\.(open|match|put)/);
    expect(worker).not.toMatch(/addEventListener\(\s*['"]fetch['"]/);
    expect(worker).not.toMatch(/supabase/i);
    expect(worker).not.toMatch(/invite/i);
  });
});
