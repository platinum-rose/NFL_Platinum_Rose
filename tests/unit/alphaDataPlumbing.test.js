import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = (relativePath) => fs.readFileSync(path.resolve(__dirname, '../../', relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.resolve(__dirname, '../../', relativePath));

describe('Alpha data packet plumbing', () => {
  it('does not expose Alpha packet or sandbox as standalone UI tabs', () => {
    const app = source('src/App.jsx');
    const header = source('src/components/layout/Header.jsx');
    const profiles = source('src/lib/profiles.js');

    expect(app).not.toContain("'alpha-packet'");
    expect(app).not.toContain("'alpha-sandbox'");
    expect(header).not.toContain('Alpha Packet');
    expect(header).not.toContain('Alpha Sandbox');
    expect(profiles).not.toContain('alpha-packet');
    expect(profiles).not.toContain('alpha-sandbox');
    expect(exists('src/components/alpha/AlphaDataPacket.jsx')).toBe(false);
    expect(exists('src/components/alpha/AlphaSandboxPortfolio.jsx')).toBe(false);
  });

  it('loads the Alpha packet under the normal dashboard shell only in Alpha mode', () => {
    const app = source('src/App.jsx');
    const context = source('src/lib/alphaDataPacketContext.jsx');
    const store = source('src/lib/alphaDataPacketStore.js');

    expect(app).toContain('AlphaDataPacketProvider');
    expect(app).toContain('enabled={profileMode === PROFILE_MODES.ALPHA}');
    expect(store).toContain('alpha/alpha-packet-2026.json');
    expect(context).toContain('fetch(ALPHA_PACKET_URL)');
  });

  it('feeds the Futures report from the local packet in Alpha mode without exposing regenerate', () => {
    const report = source('src/components/futures/FuturesIntelReport.jsx');

    expect(report).toContain('useAlphaDataPacket');
    expect(report).toContain('AlphaPacketFuturesReport');
    expect(report).toContain('Alpha mode is reading the local packet only');
    expect(report).toContain('Regenerate');
    expect(report).toContain('function SupabaseFuturesIntelReport()');
  });
});
