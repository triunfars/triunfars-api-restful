import { Controller, Post, Body, Headers, UnauthorizedException, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly configService: ConfigService,
    ) { }

    @Post('webhook')
    @HttpCode(200)
    async handleWebhook(
        @Body() body: any,
        @Headers('authorization') authorization: string,
    ) {
        const secret = this.configService.get('REVENUECAT_WEBHOOK_SECRET');

        // Validate Authorization header
        // We support both "Bearer <secret>" and just "<secret>" depending on how user configured it in RevenueCat
        if (!authorization) {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const expectedBearer = `Bearer ${secret}`;

        if (authorization !== expectedBearer && authorization !== secret) {
            throw new UnauthorizedException('Invalid webhook secret');
        }

        await this.paymentService.handleWebhook(body);
        return { received: true };
    }
}
