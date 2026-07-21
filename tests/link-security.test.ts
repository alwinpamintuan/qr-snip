import { describe, expect, it } from 'vitest';
import { assessLinkSecurity } from '../src/security/link-security';

describe('link security assessment', () => {
  it('does not add friction to an ordinary HTTPS destination', () => {
    expect(assessLinkSecurity('https://example.com/path')).toEqual({
      requiresConfirmation: false,
      risks: [],
      hostname: { ascii: 'example.com', unicode: 'example.com' },
    });
  });

  it('flags unencrypted destinations', () => {
    expect(assessLinkSecurity('http://example.com').risks.map((risk) => risk.code)).toContain('unencrypted');
  });

  it('flags encoded internationalized domains and embedded credentials', () => {
    const codes = assessLinkSecurity('https://user:pass@xn--pple-43d.com').risks.map((risk) => risk.code);
    expect(codes).toContain('credentials');
    expect(codes).toContain('internationalized-domain');
  });

  it('flags local/private network destinations and unusual ports', () => {
    const codes = assessLinkSecurity('https://192.168.1.2:8443').risks.map((risk) => risk.code);
    expect(codes).toContain('ip-address');
    expect(codes).toContain('local-network');
    expect(codes).toContain('unusual-port');
  });

  it.each([
    ['http://example.com', ['unencrypted']],
    ['https://user:pass@example.com', ['credentials']],
    ['https://xn--pple-43d.com', ['internationalized-domain']],
    ['https://127.0.0.1', ['ip-address', 'local-network']],
    ['https://10.2.3.4', ['ip-address', 'local-network']],
    ['https://172.31.2.4', ['ip-address', 'local-network']],
    ['https://192.168.2.4', ['ip-address', 'local-network']],
    ['https://printer.local', ['local-network']],
    ['https://example.com:8443', ['unusual-port']],
  ])('maps the documented threat signal for %s', (url, expectedCodes) => {
    expect(assessLinkSecurity(url).risks.map((risk) => risk.code)).toEqual(expect.arrayContaining(expectedCodes));
  });

  it('provides both ASCII and Unicode hostname forms through the reviewed IDNA adapter', () => {
    expect(assessLinkSecurity('https://xn--bcher-kva.example', () => 'bücher.example').hostname).toEqual({
      ascii: 'xn--bcher-kva.example',
      unicode: 'bücher.example',
    });
  });
});
