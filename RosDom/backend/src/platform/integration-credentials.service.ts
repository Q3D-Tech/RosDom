import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IntegrationCredentialsService {
  constructor(private readonly configService: ConfigService) {}

  encrypt(value: unknown): Buffer {
    const key = this.resolveKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]);
  }

  decrypt<T>(payload: Buffer | Uint8Array | null | undefined): T | null {
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
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString('utf8')) as T;
  }

  private resolveKey(): Buffer {
    const raw = this.configService
      .get<string>('INTEGRATION_CREDENTIALS_SECRET')
      ?.trim();
    if (!raw) {
      throw new Error(
        'INTEGRATION_CREDENTIALS_SECRET must be configured for provider token storage',
      );
    }

    const base64 = Buffer.from(raw, 'base64');
    if (base64.length === 32) {
      return base64;
    }

    const utf8 = Buffer.from(raw, 'utf8');
    if (utf8.length === 32) {
      return utf8;
    }

    throw new Error(
      'INTEGRATION_CREDENTIALS_SECRET must resolve to exactly 32 bytes',
    );
  }
}
