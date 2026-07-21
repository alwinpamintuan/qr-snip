import { describe, expect, it } from 'vitest';
import { assessLinkSecurity } from '../src/security/link-security';

describe('link security assessment', () => {
  it('does not add friction to an ordinary HTTPS destination', () => {
    expect(assessLinkSecurity('https://example.com/path')).toEqual({
      requiresConfirmation: false,
      risks: [],
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
});

