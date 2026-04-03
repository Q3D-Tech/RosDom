import { Module } from '@nestjs/common';
import { PairingService } from './pairing.service';
import { PairingController } from './pairing.controller';

@Module({
  providers: [PairingService],
  controllers: [PairingController],
})
export class PairingModule {}
