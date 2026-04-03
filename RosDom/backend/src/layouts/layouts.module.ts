import { Module } from '@nestjs/common';
import { LayoutsService } from './layouts.service';
import { LayoutsController } from './layouts.controller';

@Module({
  providers: [LayoutsService],
  controllers: [LayoutsController],
})
export class LayoutsModule {}
