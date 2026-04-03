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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationCredentialsService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let IntegrationCredentialsService = class IntegrationCredentialsService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    encrypt(value) {
        const key = this.resolveKey();
        const iv = (0, node_crypto_1.randomBytes)(12);
        const cipher = (0, node_crypto_1.createCipheriv)('aes-256-gcm', key, iv);
        const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
        const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, encrypted]);
    }
    decrypt(payload) {
        if (!payload || payload.length === 0) {
            return null;
        }
        const buffer = Buffer.from(payload);
        if (buffer.length < 29) {
            throw new Error('Encrypted integration credentials payload is malformed');
        }
        const key = this.resolveKey();
        const iv = buffer.subarray(0, 12);
        const tag = buffer.subarray(12, 28);
        const ciphertext = buffer.subarray(28);
        const decipher = (0, node_crypto_1.createDecipheriv)('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
        return JSON.parse(decrypted.toString('utf8'));
    }
    resolveKey() {
        const raw = this.configService
            .get('INTEGRATION_CREDENTIALS_SECRET')
            ?.trim();
        if (!raw) {
            throw new Error('INTEGRATION_CREDENTIALS_SECRET must be configured for provider token storage');
        }
        const base64 = Buffer.from(raw, 'base64');
        if (base64.length === 32) {
            return base64;
        }
        const utf8 = Buffer.from(raw, 'utf8');
        if (utf8.length === 32) {
            return utf8;
        }
        throw new Error('INTEGRATION_CREDENTIALS_SECRET must resolve to exactly 32 bytes');
    }
};
exports.IntegrationCredentialsService = IntegrationCredentialsService;
exports.IntegrationCredentialsService = IntegrationCredentialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IntegrationCredentialsService);
//# sourceMappingURL=integration-credentials.service.js.map