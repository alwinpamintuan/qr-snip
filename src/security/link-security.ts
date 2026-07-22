export type LinkRisk = Readonly<{
  code: 'unencrypted' | 'credentials' | 'internationalized-domain' | 'ip-address' | 'local-network' | 'unusual-port';
  detail?: string;
}>;

export type LinkSecurityAssessment = Readonly<{
  requiresConfirmation: boolean;
  risks: readonly LinkRisk[];
  hostname: Readonly<{
    ascii: string;
    unicode: string;
  }>;
}>;

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

export function assessLinkSecurity(value: string, toUnicode: (hostname: string) => string = (hostname) => hostname): LinkSecurityAssessment {
  const url = new URL(value);
  const risks: LinkRisk[] = [];

  if (url.protocol === 'http:') {
    risks.push({ code: 'unencrypted' });
  }

  if (url.username || url.password) {
    risks.push({ code: 'credentials' });
  }

  if (url.hostname.toLowerCase().includes('xn--')) {
    risks.push({
      code: 'internationalized-domain',
    });
  }

  if (isIpAddress(url.hostname)) {
    risks.push({ code: 'ip-address' });
  }

  if (isLocalNetworkHost(url.hostname)) {
    risks.push({ code: 'local-network' });
  }

  if (usesUnusualPort(url)) {
    risks.push({ code: 'unusual-port', detail: url.port });
  }

  return {
    requiresConfirmation: risks.length > 0,
    risks,
    hostname: {
      ascii: url.hostname,
      unicode: toUnicode(url.hostname),
    },
  };
}

function isIpAddress(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':');
}

function isLocalNetworkHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return normalizedHost === 'localhost'
    || normalizedHost === '::1'
    || normalizedHost.endsWith('.local')
    || PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(normalizedHost));
}

function usesUnusualPort(url: URL): boolean {
  if (!url.port) return false;
  return !((url.protocol === 'http:' && url.port === '80')
    || (url.protocol === 'https:' && url.port === '443'));
}
