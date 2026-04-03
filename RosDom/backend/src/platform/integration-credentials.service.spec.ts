import { ConfigService } from '@nestjs/config';
import { IntegrationCredentialsService } from './integration-credentials.service';

describe('IntegrationCredentialsService', () => {
  const createService = (secret: string) =>
    new IntegrationCredentialsService(
      new ConfigService({
        INTEGRATION_CREDENTIALS_SECRET: secret,
      }),
    );

  it('encrypts and decrypts provider credential payloads', () => {
    const service = createService(Buffer.alloc(32, 7).toString('base64'));
    const payload = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      uid: 'user-123',
    };

    const encrypted = service.encrypt(payload);
    const decrypted = service.decrypt<typeof payload>(encrypted);

    expect(Buffer.isBuffer(encrypted)).toBe(true);
    expect(encrypted.length).toBeGreaterThan(28);
    expect(decrypted).toEqual(payload);
  });

  it('rejects secrets that do not resolve to exactly 32 bytes', () => {
    const service = createService('too-short');

    expect(() => service.encrypt({ hello: 'world' })).toThrow(
      'INTEGRATION_CREDENTIALS_SECRET must resolve to exactly 32 bytes',
    );
  });
});
