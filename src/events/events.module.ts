import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [JwtModule.register({}), ConfigModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
