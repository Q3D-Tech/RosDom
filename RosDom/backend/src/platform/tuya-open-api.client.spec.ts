import { ConfigService } from '@nestjs/config';
import { TuyaOpenApiClient } from './tuya-open-api.client';

describe('TuyaOpenApiClient', () => {
  const createClient = (overrides: Record<string, string> = {}) =>
    new TuyaOpenApiClient(
      new ConfigService({
        TUYA_CLIENT_ID: 'client-id-123',
        TUYA_CLIENT_SECRET: 'client-secret-456',
        TUYA_APP_AUTH_IDENTIFIER: 'ru.rosdom',
        TUYA_ASSOCIATED_APP_SCHEMA: 'tuyaSmart',
        TUYA_REDIRECT_URL:
          'https://rosdom.example.com/v1/integrations/tuya/oauth/callback',
        TUYA_DEFAULT_REGION: 'eu',
        TUYA_AUTHORIZATION_URL_TEMPLATE:
          'https://auth.example.com/oauth?client_id={{clientId}}&redirect_uri={{redirectUri}}&region={{region}}&state={{state}}',
        ...overrides,
      }),
    );

  it('creates an authorization URL with region and state', () => {
    const client = createClient();

    const authorizationUrl = new URL(
      client.createAuthorizationUrl('us', 'state-123'),
    );

    expect(authorizationUrl.origin).toBe('https://auth.example.com');
    expect(authorizationUrl.searchParams.get('client_id')).toBe(
      'client-id-123',
    );
    expect(authorizationUrl.searchParams.get('region')).toBe('us');
    expect(authorizationUrl.searchParams.get('state')).toBe('state-123');
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
      'https://rosdom.example.com/v1/integrations/tuya/oauth/callback',
    );
  });

  it('falls back to the configured default region', () => {
    const client = createClient({
      TUYA_DEFAULT_REGION: 'in',
    });

    const authorizationUrl = new URL(
      client.createAuthorizationUrl(undefined, 'state-default'),
    );

    expect(authorizationUrl.searchParams.get('region')).toBe('in');
  });

  it('reports configured state when client credentials are present', () => {
    const client = createClient({
      TUYA_AUTHORIZATION_URL_TEMPLATE: '',
    });

    expect(client.isConfigured()).toBe(true);
  });
});
