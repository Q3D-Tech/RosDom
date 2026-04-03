import { Module } from '@nestjs/common';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';

@Module({
  providers: [FamiliesService],
  controllers: [FamiliesController],
})
export class FamiliesModule {}
