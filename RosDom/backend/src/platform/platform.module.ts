import { Global, Module } from '@nestjs/common';
import { IntegrationCredentialsService } from './integration-credentials.service';
import { PlatformService } from './platform.service';
import { TuyaOpenApiClient } from './tuya-open-api.client';

@Global()
@Module({
  providers: [
    PlatformService,
    IntegrationCredentialsService,
    TuyaOpenApiClient,
  ],
  exports: [PlatformService, IntegrationCredentialsService, TuyaOpenApiClient],
})
export class PlatformModule {}
