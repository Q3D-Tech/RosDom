"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TuyaOpenApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaOpenApiClient = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let TuyaOpenApiClient = TuyaOpenApiClient_1 = class TuyaOpenApiClient {
    configService;
    logger = new common_1.Logger(TuyaOpenApiClient_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    isConfigured() {
        return Boolean(this.optionalClientId && this.optionalClientSecret);
    }
    createAuthorizationUrl(region, state) {
        const normalizedRegion = this.resolveRegion(region);
        const raw = this.resolveAuthorizationUrl(normalizedRegion);
        if (!raw) {
            throw new Error(`Tuya authorization URL is not configured for region ${normalizedRegion}`);
        }
        const url = new URL(raw);
        if (url.searchParams.has('state')) {
            url.searchParams.set('state', state);
        }
        else {
            url.searchParams.append('state', state);
        }
        return url.toString();
    }
    async exchangeAuthorizationCode(code, region) {
        const normalizedRegion = this.resolveRegion(region);
        const result = await this.request({
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
    async loginAssociatedUser({ username, password, countryCode, schema, region, }) {
        const normalizedRegion = this.resolveRegion(region);
        const resolvedSchema = this.resolveAssociatedAppSchema(schema);
        const result = await this.request({
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
    async refreshAccessToken(bundle) {
        const result = await this.request({
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
    async getUserDevices(bundle) {
        const result = await this.request({
            method: 'GET',
            region: bundle.region,
            path: `/v1.0/users/${encodeURIComponent(bundle.uid)}/devices`,
            accessToken: bundle.accessToken,
        });
        const rawDevices = Array.isArray(result)
            ? result
            : Array.isArray(result?.devices)
                ? (result.devices ?? [])
                : Array.isArray(result?.list)
                    ? (result.list ?? [])
                    : [];
        return rawDevices
            .map((item) => this.mapUserDevice(item))
            .filter((item) => item !== null);
    }
    async getDeviceSpecifications(deviceId, bundle) {
        const result = await this.request({
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
    async getDeviceStatus(deviceId, bundle) {
        const result = await this.request({
            method: 'GET',
            region: bundle.region,
            path: `/v1.0/devices/${encodeURIComponent(deviceId)}/status`,
            accessToken: bundle.accessToken,
        });
        const rawItems = Array.isArray(result)
            ? result
            : Array.isArray(result?.result)
                ? (result.result ?? [])
                : [];
        return rawItems
            .map((item) => {
            if (typeof item !== 'object' || item === null) {
                return null;
            }
            const row = item;
            const code = this.asString(row.code);
            if (!code) {
                return null;
            }
            return {
                code,
                value: row.value,
            };
        })
            .filter((item) => item !== null);
    }
    async sendDeviceCommands(deviceId, commands, bundle) {
        return this.request({
            method: 'POST',
            region: bundle.region,
            path: `/v1.0/devices/${encodeURIComponent(deviceId)}/commands`,
            accessToken: bundle.accessToken,
            body: {
                commands,
            },
        });
    }
    async request({ method, region, path, query, accessToken, body, }) {
        const baseUrl = this.resolveApiBaseUrl(region);
        const url = new URL(path, baseUrl);
        for (const [key, value] of Object.entries(query ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        }
        const bodyString = body === undefined ? '' : (JSON.stringify(body) ?? '');
        const timestamp = Date.now().toString();
        const nonce = (0, node_crypto_1.randomUUID)().replace(/-/g, '');
        const stringToSign = this.buildStringToSign(method, url, bodyString, undefined);
        const signBase = accessToken
            ? `${this.clientId}${accessToken}${timestamp}${nonce}${stringToSign}`
            : `${this.clientId}${timestamp}${nonce}${stringToSign}`;
        const sign = (0, node_crypto_1.createHmac)('sha256', this.clientSecret)
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
        let parsed;
        try {
            parsed = text ? JSON.parse(text) : {};
        }
        catch {
            this.logger.error(`Failed to parse Tuya response for ${method} ${url.pathname}: ${text}`);
            throw new Error('Tuya returned a non-JSON response');
        }
        if (!response.ok || parsed.success === false) {
            const message = parsed.msg ||
                parsed.message ||
                `Tuya request failed with HTTP ${response.status}`;
            const code = parsed.code ?? response.status;
            const tidSuffix = parsed.tid ? ` (tid: ${parsed.tid})` : '';
            throw new Error(`Tuya error ${code}${tidSuffix}: ${message}`);
        }
        return (parsed.result ?? parsed);
    }
    buildStringToSign(method, url, body, signatureHeaders) {
        const contentHash = (0, node_crypto_1.createHash)('sha256').update(body, 'utf8').digest('hex');
        const optionalSignatureHeaders = Object.entries(signatureHeaders ?? {})
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${value}`)
            .join('\n');
        const sortedParams = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
        const queryString = new URLSearchParams(sortedParams).toString();
        const requestUrl = `${url.pathname}${queryString ? `?${queryString}` : ''}`;
        return [
            method.toUpperCase(),
            contentHash,
            optionalSignatureHeaders,
            requestUrl,
        ].join('\n');
    }
    mapUserDevice(value) {
        if (typeof value !== 'object' || value === null) {
            return null;
        }
        const row = value;
        const id = this.asString(row.id) ??
            this.asString(row.device_id) ??
            this.asString(row.devId);
        if (!id) {
            return null;
        }
        return {
            id,
            name: this.asString(row.name) ??
                this.asString(row.custom_name) ??
                'Smart Device',
            productName: this.asString(row.product_name) ??
                this.asString(row.productName) ??
                this.asString(row.name) ??
                'Smart Device',
            category: this.asString(row.category) ??
                this.asString(row.device_type) ??
                this.asString(row.product_id) ??
                'other',
            iconUrl: this.asString(row.icon) ?? this.asString(row.icon_url),
            online: typeof row.online === 'boolean'
                ? row.online
                : this.asString(row.online) === 'true',
            model: this.asString(row.model) ??
                this.asString(row.product_model) ??
                this.asString(row.product_name),
            productId: this.asString(row.product_id),
        };
    }
    mapFunctionSpecs(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        const mapped = [];
        for (const item of value) {
            if (typeof item !== 'object' || item === null) {
                continue;
            }
            const row = item;
            const code = this.asString(row.code) ?? this.asString(row.dp_id);
            const type = this.asString(row.type);
            if (!code || !type) {
                continue;
            }
            mapped.push({
                code,
                type,
                values: typeof row.values === 'string' || typeof row.values === 'object'
                    ? row.values
                    : null,
            });
        }
        return mapped;
    }
    resolveApiBaseUrl(region) {
        const explicit = this.configService.get(`TUYA_API_BASE_URL_${region.toUpperCase()}`) ?? this.configService.get('TUYA_API_BASE_URL');
        if (explicit) {
            return explicit.endsWith('/') ? explicit : `${explicit}/`;
        }
        const fallbackByRegion = {
            eu: 'https://openapi.tuyaeu.com/',
            us: 'https://openapi.tuyaus.com/',
            cn: 'https://openapi.tuyacn.com/',
            in: 'https://openapi.tuyain.com/',
        };
        return fallbackByRegion[region];
    }
    resolveAuthorizationUrl(region) {
        const direct = this.configService.get(`TUYA_AUTHORIZATION_URL_${region.toUpperCase()}`) ?? this.configService.get('TUYA_AUTHORIZATION_URL');
        if (direct?.trim()) {
            return direct.trim();
        }
        const template = this.configService.get(`TUYA_AUTHORIZATION_URL_TEMPLATE_${region.toUpperCase()}`) ?? this.configService.get('TUYA_AUTHORIZATION_URL_TEMPLATE');
        if (template?.trim()) {
            return template
                .replaceAll('{{clientId}}', this.clientId)
                .replaceAll('{{redirectUri}}', encodeURIComponent(this.redirectUrl))
                .replaceAll('{{region}}', region)
                .replaceAll('{{state}}', '');
        }
        return null;
    }
    resolveRegion(value) {
        const normalized = value?.trim().toLowerCase();
        if (normalized === 'eu' ||
            normalized === 'us' ||
            normalized === 'cn' ||
            normalized === 'in') {
            return normalized;
        }
        const fallback = this.configService
            .get('TUYA_DEFAULT_REGION')
            ?.trim()
            .toLowerCase();
        if (fallback === 'eu' ||
            fallback === 'us' ||
            fallback === 'cn' ||
            fallback === 'in') {
            return fallback;
        }
        return 'eu';
    }
    resolveAssociatedAppSchema(value) {
        return (value?.trim() ||
            this.configService.get('TUYA_ASSOCIATED_APP_SCHEMA')?.trim() ||
            this.configService.get('TUYA_APP_SCHEMA')?.trim() ||
            'tuyaSmart');
    }
    resolveOAuthIdentifier() {
        return (this.configService.get('TUYA_APP_AUTH_IDENTIFIER')?.trim() ||
            this.configService.get('TUYA_APP_SCHEMA')?.trim() ||
            this.resolveAssociatedAppSchema());
    }
    asString(value) {
        return typeof value === 'string' && value.trim().length > 0
            ? value.trim()
            : null;
    }
    get optionalClientId() {
        return this.configService.get('TUYA_CLIENT_ID')?.trim();
    }
    get optionalClientSecret() {
        return this.configService.get('TUYA_CLIENT_SECRET')?.trim();
    }
    get clientId() {
        const value = this.optionalClientId;
        if (!value) {
            throw new Error('TUYA_CLIENT_ID is not configured');
        }
        return value;
    }
    get clientSecret() {
        const value = this.optionalClientSecret;
        if (!value) {
            throw new Error('TUYA_CLIENT_SECRET is not configured');
        }
        return value;
    }
    get redirectUrl() {
        const value = this.configService.get('TUYA_REDIRECT_URL')?.trim();
        if (!value) {
            throw new Error('TUYA_REDIRECT_URL is not configured');
        }
        return value;
    }
};
exports.TuyaOpenApiClient = TuyaOpenApiClient;
exports.TuyaOpenApiClient = TuyaOpenApiClient = TuyaOpenApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TuyaOpenApiClient);
//# sourceMappingURL=tuya-open-api.client.js.map