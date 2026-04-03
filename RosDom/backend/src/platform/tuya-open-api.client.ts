import { createHash, createHmac, randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type TuyaRegion = 'eu' | 'us' | 'cn' | 'in';

export interface TuyaTokenBundle {
  accessToken: string;
  refreshToken: string;
  uid: string;
  expiresAt: string;
  region: TuyaRegion;
  schema?: string;
}

export interface TuyaUserDevice {
  id: string;
  name: string;
  productName: string;
  category: string;
  iconUrl?: string | null;
  online: boolean;
  model?: string | null;
  productId?: string | null;
}

export interface TuyaDeviceFunctionSpec {
  code: string;
  type: string;
  values?: string | Record<string, unknown> | null;
}

export interface TuyaDeviceStatus {
  code: string;
  value: unknown;
}

interface TuyaApiEnvelope<T> {
  success?: boolean;
  code?: number | string;
  msg?: string;
  message?: string;
  result?: T;
  t?: number;
  tid?: string;
}

@Injectable()
export class TuyaOpenApiClient {
  private readonly logger = new Logger(TuyaOpenApiClient.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured() {
    return Boolean(this.optionalClientId && this.optionalClientSecret);
  }

  createAuthorizationUrl(region: string | undefined, state: string): string {
    const normalizedRegion = this.resolveRegion(region);
    const raw = this.resolveAuthorizationUrl(normalizedRegion);
    if (!raw) {
      throw new Error(
        `Tuya authorization URL is not configured for region ${normalizedRegion}`,
      );
    }

    const url = new URL(raw);
    if (url.searchParams.has('state')) {
      url.searchParams.set('state', state);
    } else {
      url.searchParams.append('state', state);
    }
    return url.toString();
  }

  async exchangeAuthorizationCode(
    code: string,
    region: string | undefined,
  ): Promise<TuyaTokenBundle> {
    const normalizedRegion = this.resolveRegion(region);
    const result = await this.request<{
      access_token: string;
      refresh_token: string;
      expire_time: number;
      uid: string;
    }>({
      method: 'GET',
      region: normalizedRegion,
      path: '/v1.0/token',
      query: {
        grant_type: '2',
        code,
      },
    });

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      uid: result.uid,
      expiresAt: new Date(Date.now() + result.expire_time * 1000).toISOString(),
      region: normalizedRegion,
      schema: this.resolveOAuthIdentifier(),
    };
  }

  async loginAssociatedUser({
    username,
    password,
    countryCode,
    schema,
    region,
  }: {
    username: string;
    password: string;
    countryCode: string;
    schema?: string;
    region?: string;
  }): Promise<TuyaTokenBundle> {
    const normalizedRegion = this.resolveRegion(region);
    const resolvedSchema = this.resolveAssociatedAppSchema(schema);
    const result = await this.request<{
      access_token: string;
      refresh_token: string;
      expire_time: number;
      uid: string;
    }>({
      method: 'POST',
      region: normalizedRegion,
      path: '/v1.0/iot-01/associated-users/actions/authorized-login',
      body: {
        username,
        password,
        country_code: countryCode,
        schema: resolvedSchema,
      },
    });

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      uid: result.uid,
      expiresAt: new Date(Date.now() + result.expire_time * 1000).toISOString(),
      region: normalizedRegion,
      schema: resolvedSchema,
    };
  }

  async refreshAccessToken(bundle: TuyaTokenBundle): Promise<TuyaTokenBundle> {
    const result = await this.request<{
      access_token: string;
      refresh_token: string;
      expire_time: number;
      uid: string;
    }>({
      method: 'GET',
      region: bundle.region,
      path: `/v1.0/token/${encodeURIComponent(bundle.refreshToken)}`,
    });

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      uid: result.uid ?? bundle.uid,
      expiresAt: new Date(Date.now() + result.expire_time * 1000).toISOString(),
      region: bundle.region,
      schema: bundle.schema,
    };
  }

  async getUserDevices(bundle: TuyaTokenBundle): Promise<TuyaUserDevice[]> {
    const result = await this.request<unknown[]>({
      method: 'GET',
      region: bundle.region,
      path: `/v1.0/users/${encodeURIComponent(bundle.uid)}/devices`,
      accessToken: bundle.accessToken,
    });

    const rawDevices = Array.isArray(result)
      ? result
      : Array.isArray((result as { devices?: unknown[] } | null)?.devices)
        ? ((result as { devices?: unknown[] }).devices ?? [])
        : Array.isArray((result as { list?: unknown[] } | null)?.list)
          ? ((result as { list?: unknown[] }).list ?? [])
          : [];

    return rawDevices
      .map((item) => this.mapUserDevice(item))
      .filter((item): item is TuyaUserDevice => item !== null);
  }

  async getDeviceSpecifications(
    deviceId: string,
    bundle: TuyaTokenBundle,
  ): Promise<TuyaDeviceFunctionSpec[]> {
    const result = await this.request<{
      functions?: unknown[];
      status?: unknown[];
    }>({
      method: 'GET',
      region: bundle.region,
      path: `/v1.0/devices/${encodeURIComponent(deviceId)}/specifications`,
      accessToken: bundle.accessToken,
    });

    return [
      ...this.mapFunctionSpecs(result.functions),
      ...this.mapFunctionSpecs(result.status),
    ];
  }

  async getDeviceStatus(
    deviceId: string,
    bundle: TuyaTokenBundle,
  ): Promise<TuyaDeviceStatus[]> {
    const result = await this.request<unknown[]>({
      method: 'GET',
      region: bundle.region,
      path: `/v1.0/devices/${encodeURIComponent(deviceId)}/status`,
      accessToken: bundle.accessToken,
    });

    const rawItems = Array.isArray(result)
      ? result
      : Array.isArray((result as { result?: unknown[] } | null)?.result)
        ? ((result as { result?: unknown[] }).result ?? [])
        : [];

    return rawItems
      .map((item) => {
        if (typeof item !== 'object' || item === null) {
          return null;
        }
        const row = item as Record<string, unknown>;
        const code = this.asString(row.code);
        if (!code) {
          return null;
        }
        return {
          code,
          value: row.value,
        } satisfies TuyaDeviceStatus;
      })
      .filter((item): item is TuyaDeviceStatus => item !== null);
  }

  async sendDeviceCommands(
    deviceId: string,
    commands: Array<{ code: string; value: unknown }>,
    bundle: TuyaTokenBundle,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>({
      method: 'POST',
      region: bundle.region,
      path: `/v1.0/devices/${encodeURIComponent(deviceId)}/commands`,
      accessToken: bundle.accessToken,
      body: {
        commands,
      },
    });
  }

  private async request<T>({
    method,
    region,
    path,
    query,
    accessToken,
    body,
  }: {
    method: 'GET' | 'POST';
    region: TuyaRegion;
    path: string;
    query?: Record<string, string | undefined>;
    accessToken?: string;
    body?: unknown;
  }): Promise<T> {
    const baseUrl = this.resolveApiBaseUrl(region);
    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(query ?? {}).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    }

    const bodyString = body === undefined ? '' : (JSON.stringify(body) ?? '');
    const timestamp = Date.now().toString();
    const nonce = randomUUID().replace(/-/g, '');
    const stringToSign = this.buildStringToSign(
      method,
      url,
      bodyString,
      undefined,
    );
    const signBase = accessToken
      ? `${this.clientId}${accessToken}${timestamp}${nonce}${stringToSign}`
      : `${this.clientId}${timestamp}${nonce}${stringToSign}`;
    const sign = createHmac('sha256', this.clientSecret)
      .update(signBase, 'utf8')
      .digest('hex')
      .toUpperCase();

    const response = await fetch(url, {
      method,
      headers: {
        client_id: this.clientId,
        sign,
        t: timestamp,
        nonce,
        sign_method: 'HMAC-SHA256',
        ...(accessToken ? { access_token: accessToken } : {}),
        ...(bodyString
          ? {
              'Content-Type': 'application/json',
            }
          : {}),
      },
      body: bodyString || undefined,
    });

    const text = await response.text();
    let parsed: TuyaApiEnvelope<T>;
    try {
      parsed = text ? (JSON.parse(text) as TuyaApiEnvelope<T>) : {};
    } catch {
      this.logger.error(
        `Failed to parse Tuya response for ${method} ${url.pathname}: ${text}`,
      );
      throw new Error('Tuya returned a non-JSON response');
    }

    if (!response.ok || parsed.success === false) {
      const message =
        parsed.msg ||
        parsed.message ||
        `Tuya request failed with HTTP ${response.status}`;
      const code = parsed.code ?? response.status;
      const tidSuffix = parsed.tid ? ` (tid: ${parsed.tid})` : '';
      throw new Error(`Tuya error ${code}${tidSuffix}: ${message}`);
    }

    return (parsed.result ?? (parsed as unknown)) as T;
  }

  private buildStringToSign(
    method: string,
    url: URL,
    body: string,
    signatureHeaders?: Record<string, string>,
  ) {
    const contentHash = createHash('sha256').update(body, 'utf8').digest('hex');
    const optionalSignatureHeaders = Object.entries(signatureHeaders ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('\n');

    const sortedParams = [...url.searchParams.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const queryString = new URLSearchParams(sortedParams).toString();
    const requestUrl = `${url.pathname}${queryString ? `?${queryString}` : ''}`;
    return [
      method.toUpperCase(),
      contentHash,
      optionalSignatureHeaders,
      requestUrl,
    ].join('\n');
  }

  private mapUserDevice(value: unknown): TuyaUserDevice | null {
    if (typeof value !== 'object' || value === null) {
      return null;
    }

    const row = value as Record<string, unknown>;
    const id =
      this.asString(row.id) ??
      this.asString(row.device_id) ??
      this.asString(row.devId);
    if (!id) {
      return null;
    }

    return {
      id,
      name:
        this.asString(row.name) ??
        this.asString(row.custom_name) ??
        'Smart Device',
      productName:
        this.asString(row.product_name) ??
        this.asString(row.productName) ??
        this.asString(row.name) ??
        'Smart Device',
      category:
        this.asString(row.category) ??
        this.asString(row.device_type) ??
        this.asString(row.product_id) ??
        'other',
      iconUrl: this.asString(row.icon) ?? this.asString(row.icon_url),
      online:
        typeof row.online === 'boolean'
          ? row.online
          : this.asString(row.online) === 'true',
      model:
        this.asString(row.model) ??
        this.asString(row.product_model) ??
        this.asString(row.product_name),
      productId: this.asString(row.product_id),
    };
  }

  private mapFunctionSpecs(value: unknown): TuyaDeviceFunctionSpec[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const mapped: TuyaDeviceFunctionSpec[] = [];
    for (const item of value) {
      if (typeof item !== 'object' || item === null) {
        continue;
      }
      const row = item as Record<string, unknown>;
      const code = this.asString(row.code) ?? this.asString(row.dp_id);
      const type = this.asString(row.type);
      if (!code || !type) {
        continue;
      }
      mapped.push({
        code,
        type,
        values:
          typeof row.values === 'string' || typeof row.values === 'object'
            ? (row.values as string | Record<string, unknown>)
            : null,
      });
    }
    return mapped;
  }

  private resolveApiBaseUrl(region: TuyaRegion) {
    const explicit =
      this.configService.get<string>(
        `TUYA_API_BASE_URL_${region.toUpperCase()}`,
      ) ?? this.configService.get<string>('TUYA_API_BASE_URL');
    if (explicit) {
      return explicit.endsWith('/') ? explicit : `${explicit}/`;
    }

    const fallbackByRegion: Record<TuyaRegion, string> = {
      eu: 'https://openapi.tuyaeu.com/',
      us: 'https://openapi.tuyaus.com/',
      cn: 'https://openapi.tuyacn.com/',
      in: 'https://openapi.tuyain.com/',
    };
    return fallbackByRegion[region];
  }

  private resolveAuthorizationUrl(region: TuyaRegion): string | null {
    const direct =
      this.configService.get<string>(
        `TUYA_AUTHORIZATION_URL_${region.toUpperCase()}`,
      ) ?? this.configService.get<string>('TUYA_AUTHORIZATION_URL');
    if (direct?.trim()) {
      return direct.trim();
    }

    const template =
      this.configService.get<string>(
        `TUYA_AUTHORIZATION_URL_TEMPLATE_${region.toUpperCase()}`,
      ) ?? this.configService.get<string>('TUYA_AUTHORIZATION_URL_TEMPLATE');
    if (template?.trim()) {
      return template
        .replaceAll('{{clientId}}', this.clientId)
        .replaceAll('{{redirectUri}}', encodeURIComponent(this.redirectUrl))
        .replaceAll('{{region}}', region)
        .replaceAll('{{state}}', '');
    }

    return null;
  }

  private resolveRegion(value?: string): TuyaRegion {
    const normalized = value?.trim().toLowerCase();
    if (
      normalized === 'eu' ||
      normalized === 'us' ||
      normalized === 'cn' ||
      normalized === 'in'
    ) {
      return normalized;
    }

    const fallback = this.configService
      .get<string>('TUYA_DEFAULT_REGION')
      ?.trim()
      .toLowerCase();
    if (
      fallback === 'eu' ||
      fallback === 'us' ||
      fallback === 'cn' ||
      fallback === 'in'
    ) {
      return fallback;
    }
    return 'eu';
  }

  private resolveAssociatedAppSchema(value?: string) {
    return (
      value?.trim() ||
      this.configService.get<string>('TUYA_ASSOCIATED_APP_SCHEMA')?.trim() ||
      this.configService.get<string>('TUYA_APP_SCHEMA')?.trim() ||
      'tuyaSmart'
    );
  }

  private resolveOAuthIdentifier() {
    return (
      this.configService.get<string>('TUYA_APP_AUTH_IDENTIFIER')?.trim() ||
      this.configService.get<string>('TUYA_APP_SCHEMA')?.trim() ||
      this.resolveAssociatedAppSchema()
    );
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private get optionalClientId() {
    return this.configService.get<string>('TUYA_CLIENT_ID')?.trim();
  }

  private get optionalClientSecret() {
    return this.configService.get<string>('TUYA_CLIENT_SECRET')?.trim();
  }

  private get clientId() {
    const value = this.optionalClientId;
    if (!value) {
      throw new Error('TUYA_CLIENT_ID is not configured');
    }
    return value;
  }

  private get clientSecret() {
    const value = this.optionalClientSecret;
    if (!value) {
      throw new Error('TUYA_CLIENT_SECRET is not configured');
    }
    return value;
  }

  private get redirectUrl() {
    const value = this.configService.get<string>('TUYA_REDIRECT_URL')?.trim();
    if (!value) {
      throw new Error('TUYA_REDIRECT_URL is not configured');
    }
    return value;
  }
}
