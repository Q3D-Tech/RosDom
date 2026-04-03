import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DemoService } from './demo.service';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
