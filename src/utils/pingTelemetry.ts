import {
  apiAppendPingTelemetry,
  apiGetPingTelemetry,
  apiClearPingTelemetry,
} from '../api/mockApi.ts';
import { PingTelemetryRecord } from '../types.ts';

export const PING_TELEMETRY_BATCH_LIMIT = 250;
const LAST_PING_SAVE_GUARD_KEY = 'pathology_ping_last_save_guard';
const DUPLICATE_WINDOW_MS = 30_000;

export const isPingTelemetryRoute = (path: string, search = ''): boolean => {
  const normalizedPath = path.toLowerCase();
  const params = new URLSearchParams(search);
  if (normalizedPath.endsWith('/ping') || normalizedPath.endsWith('/ping/')) {
    return true;
  }

  return (
    params.has('ping') ||
    params.get('v') === 'ping' ||
    params.get('mode') === 'ping'
  );
};

export const isPingProbeVisible = (search = ''): boolean => {
  const params = new URLSearchParams(search);
  return (
    params.get('debug') === 'ping' ||
    params.get('mode') === 'ping-probe' ||
    params.get('probe') === '1' ||
    params.get('view') === 'ping'
  );
};

const LAST_PING_BEACON_GUARD_KEY = 'pathology_ping_last_beacon_guard';
const BEACON_DUPLICATE_WINDOW_MS = 30_000;

const buildPingBeaconSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem('pathology_ping_session_id');
  if (existing) return existing;
  const generated = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    window.localStorage.setItem('pathology_ping_session_id', generated);
  } catch {
    return generated;
  }
  return generated;
};

const buildPingBeaconUrl = (sessionId: string): string => {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams();
  params.set('beacon', '1');
  params.set('path', window.location.pathname);
  params.set('query', window.location.search);
  params.set('host', window.location.host);
  params.set('ts', String(Date.now()));
  params.set('sid', sessionId);
  return `${window.location.origin}${import.meta.env.BASE_URL}ping-beacon.html?${params.toString()}`;
};

const shouldEmitBackgroundBeacon = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(LAST_PING_BEACON_GUARD_KEY);
    const lastTs = raw ? Number(raw) : NaN;
    if (Number.isFinite(lastTs) && Date.now() - lastTs < BEACON_DUPLICATE_WINDOW_MS) {
      return false;
    }
  } catch {
    return true;
  }
  return true;
};

const recordBeaconEmission = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_PING_BEACON_GUARD_KEY, String(Date.now()));
  } catch {
    // Ignore storage guard failures.
  }
};

export const triggerPingBeacon = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!shouldEmitBackgroundBeacon()) return;

  const sessionId = buildPingBeaconSessionId();
  const beaconUrl = buildPingBeaconUrl(sessionId);
  if (!beaconUrl) return;

  recordBeaconEmission();
  const frame = document.createElement('iframe');
  frame.src = beaconUrl;
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.title = 'pathology-telemetry-beacon';
  frame.style.cssText = 'position:fixed;left:-10000px;width:0;height:0;opacity:0;';
  frame.referrerPolicy = 'no-referrer';

  const cleanup = () => {
    frame.removeEventListener('load', cleanup);
    frame.remove();
  };
  frame.addEventListener('load', cleanup);
  document.body.appendChild(frame);
};

const DEVICE_MODELS: [RegExp, string][] = [
  [/\biphone\b/i, 'iPhone'],
  [/\bipad\b/i, 'iPad'],
  [/\bipod\b/i, 'iPod'],
  [/\bsams(a|ung)-?\s*([^;/ )]+)/i, 'Samsung'],
  [/\bsm-[a-z0-9-]+/i, 'Samsung'],
  [/\b(huawei)[-\s]?[a-z0-9]+/i, 'Huawei'],
  [/\b(oneplus)[-\s]?[a-z0-9]*/i, 'OnePlus'],
  [/\b(lg)-?htc/i, 'LG'],
  [/\blenovo[-\s][a-z0-9]+/i, 'Lenovo'],
  [/\b(moto|motorola)[-\s]?[a-z0-9]*/i, 'Motorola'],
  [/\b(macintosh|mac os x)/i, 'Mac'],
  [/\bwindows nt/i, 'Windows PC'],
  [/\bx11|linux/i, 'Linux PC'],
];

const detectDeviceModel = (userAgent: string): string | undefined => {
  if (!userAgent) return undefined;
  const hit = DEVICE_MODELS.find(([pattern]) => pattern.test(userAgent));
  return hit ? hit[1] : undefined;
};

const detectBrowser = (ua: string): string => {
  if (!ua) return 'Unknown';
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua) && !/chromium/i.test(ua) && !/edg/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/opera|opr/i.test(ua)) return 'Opera';
  return 'Unknown';
};

const detectOs = (ua: string): string => {
  if (!ua) return 'Unknown';
  if (/windows nt/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown';
};

const detectDeviceType = (ua: string): string => {
  if (!ua) return 'Unknown';
  if (/mobi|iphone|android/i.test(ua)) return 'Mobile';
  if (/ipad/i.test(ua) || /tablet/i.test(ua)) return 'Tablet';
  return 'Desktop';
};

const parseOwnerFromMetadata = (record: Pick<PingTelemetryRecord, 'asn' | 'isp' | 'org'>) => {
  if (!record.org && !record.asn && !record.isp) return 'Unknown';
  const candidates = [record.org, record.asn, record.isp].filter(Boolean);
  return candidates.join(' / ');
};

const fetchWithTimeout = async (url: string, timeoutMs = 2500) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    return response.ok ? response.json() : null;
  } finally {
    clearTimeout(timeout);
  }
};

const getPublicIp = async (): Promise<string | undefined> => {
  const ipify = await fetchWithTimeout('https://api.ipify.org?format=json');
  if (ipify?.ip) return String(ipify.ip);

  return undefined;
};

const getGeoFromIp = async (ip: string): Promise<Record<string, string | number | null>> => {
  const fallback: Record<string, string | number | null> = {
    city: null,
    region: null,
    country: null,
    countryCode: null,
    postal: null,
    timezone: null,
    asn: null,
    org: null,
    isp: null,
    latitude: null,
    longitude: null,
  };

  const payload = await fetchWithTimeout(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
  if (!payload) return fallback;

  return {
    city: payload.city ?? null,
    region: payload.region ?? null,
    country: payload.country_name ?? null,
    countryCode: payload.country ?? null,
    postal: payload.postal ?? null,
    timezone: payload.timezone ?? null,
    asn: payload.asn ? String(payload.asn) : null,
    org: payload.org ?? null,
    isp: payload.org ?? null,
    latitude: payload.latitude != null ? Number(payload.latitude) : null,
    longitude: payload.longitude != null ? Number(payload.longitude) : null,
  };
};

export const capturePingTelemetry = async (): Promise<PingTelemetryRecord> => {
  const clientIp = await getPublicIp().catch(() => undefined);
  const fallbackGeo = {
    city: 'unknown',
    region: 'unknown',
    country: 'unknown',
    countryCode: 'unknown',
    postal: 'unknown',
    timezone: 'unknown',
    asn: 'unknown',
    org: 'unknown',
    isp: 'unknown',
    latitude: null,
    longitude: null,
  } as const;
  const geo = clientIp ? await getGeoFromIp(clientIp).catch(() => fallbackGeo) : fallbackGeo;

  const normalizedGeo = {
    city: typeof geo.city === 'string' ? geo.city : 'unknown',
    region: typeof geo.region === 'string' ? geo.region : 'unknown',
    country: typeof geo.country === 'string' ? geo.country : 'unknown',
    countryCode: typeof geo.countryCode === 'string' ? geo.countryCode : 'unknown',
    postal: typeof geo.postal === 'string' ? geo.postal : 'unknown',
    timezone: typeof geo.timezone === 'string' ? geo.timezone : 'unknown',
    asn: typeof geo.asn === 'string' ? geo.asn : 'unknown',
    org: typeof geo.org === 'string' ? geo.org : 'unknown',
    isp: typeof geo.isp === 'string' ? geo.isp : 'unknown',
    latitude: typeof geo.latitude === 'number' ? geo.latitude : undefined,
    longitude: typeof geo.longitude === 'number' ? geo.longitude : undefined,
  };
  const userAgent = window.navigator.userAgent || 'unknown';

  const asn = normalizedGeo.asn;
  const owner = parseOwnerFromMetadata({
    asn,
    isp: normalizedGeo.isp,
    org: normalizedGeo.org,
  });

  const record: PingTelemetryRecord = {
    id: `ping-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    timestamp: Date.now(),
    sourceIp: clientIp || 'unknown',
    city: normalizedGeo.city,
    region: normalizedGeo.region,
    country: normalizedGeo.country,
    countryCode: normalizedGeo.countryCode,
    postalCode: normalizedGeo.postal,
    timezone: normalizedGeo.timezone,
    asn,
    isp: normalizedGeo.isp,
    org: normalizedGeo.org,
    owner,
    deviceType: detectDeviceType(userAgent),
    deviceModel: detectDeviceModel(userAgent),
    os: detectOs(userAgent),
    browser: detectBrowser(userAgent),
    userAgent,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    language: window.navigator.language || 'unknown',
    path: window.location.pathname,
    method: 'GET',
    referer: document.referrer || 'direct',
    userAgentRaw: userAgent,
    query: window.location.search || '',
    host: window.location.host,
    physicalAddressNote: 'No street-level data from browser/request metadata only.',
    latitude: normalizedGeo.latitude,
    longitude: normalizedGeo.longitude,
  };

  return record;
};

const buildPingFingerprint = (record: PingTelemetryRecord): string => {
  return `${record.timestamp}-${record.path}-${record.sourceIp}-${record.userAgentRaw.slice(0, 24)}`;
};

const readPingSaveGuard = (): string | null => {
  try {
    return window.localStorage.getItem(LAST_PING_SAVE_GUARD_KEY);
  } catch {
    return null;
  }
};

const writePingSaveGuard = (fingerprint: string) => {
  try {
    window.localStorage.setItem(LAST_PING_SAVE_GUARD_KEY, fingerprint);
  } catch {
    // Ignore localStorage failures; persistence to IndexedDB is still attempted.
  }
};

export const appendPingRecord = async (record: PingTelemetryRecord) => {
  await apiAppendPingTelemetry(record);
};

export const captureAndPersistPingTelemetry = async (): Promise<PingTelemetryRecord> => {
  const record = await capturePingTelemetry();
  const fingerprint = buildPingFingerprint(record);
  const now = Date.now();
  const rawGuard = readPingSaveGuard();
  const [lastFingerprint, rawTimestamp] = rawGuard ? rawGuard.split('::') : [];
  const lastTs = Number(rawTimestamp);

  if (lastFingerprint === fingerprint && Number.isFinite(lastTs) && now - lastTs < DUPLICATE_WINDOW_MS) {
    return record;
  }

  await appendPingRecord(record);
  writePingSaveGuard(`${fingerprint}::${now}`);
  return record;
};

export const getStoredPingRecords = async (): Promise<PingTelemetryRecord[]> => {
  const rows = await apiGetPingTelemetry(PING_TELEMETRY_BATCH_LIMIT);
  return rows;
};

export const clearPingRecords = async () => {
  await apiClearPingTelemetry();
};

export const buildPingCsv = (records: PingTelemetryRecord[]): string => {
  const headers = [
    'timestamp',
    'sourceIp',
    'city',
    'region',
    'country',
    'countryCode',
    'postalCode',
    'timezone',
    'asn',
    'isp',
    'org',
    'owner',
    'deviceType',
    'deviceModel',
    'os',
    'browser',
    'viewportWidth',
    'viewportHeight',
    'screenWidth',
    'screenHeight',
    'devicePixelRatio',
    'language',
    'path',
    'method',
    'referer',
    'query',
    'host',
    'userAgent',
    'physicalAddressNote',
  ];

  const quote = (value: unknown) => {
    const safe = String(value ?? '');
    const normalized = safe.replace(/"/g, '""');
    return `"${normalized}"`;
  };

  const rows = records.map((record) => headers
    .map((header) => quote((record as Record<string, unknown>)[header as keyof PingTelemetryRecord]))
    .join(','));

  return [
    headers.join(','),
    ...rows,
  ].join('\n');
};
