import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(private readonly prisma: PrismaService) { }

    async handleWebhook(body: any) {
        const { event } = body;

        if (!event) {
            this.logger.warn('Invalid webhook payload: missing event object');
            return;
        }

        const { type, app_user_id, expiration_at_ms } = event;

        this.logger.log(`Received webhook: ${type} for user ${app_user_id}`);

        if (!app_user_id) {
            this.logger.warn('Webhook received without app_user_id');
            return;
        }

        let isPremium = false;
        let subscriptionStatus = 'inactive';
        let subscriptionExpiresAt: Date | null = null;

        switch (type) {
            case 'INITIAL_PURCHASE':
            case 'RENEWAL':
            case 'UNCANCELLATION':
            case 'NON_RENEWING_PURCHASE':
                isPremium = true;
                subscriptionStatus = 'active';
                if (expiration_at_ms) {
                    subscriptionExpiresAt = new Date(expiration_at_ms);
                }
                break;
            case 'CANCELLATION':
                // User turned off auto-renew, but still has access until expiration
                isPremium = true;
                subscriptionStatus = 'cancelled';
                if (expiration_at_ms) {
                    subscriptionExpiresAt = new Date(expiration_at_ms);
                }
                break;
            case 'EXPIRATION':
                isPremium = false;
                subscriptionStatus = 'expired';
                if (expiration_at_ms) {
                    subscriptionExpiresAt = new Date(expiration_at_ms);
                } else {
                    subscriptionExpiresAt = new Date();
                }
                break;
            case 'TEST':
                this.logger.log('Received TEST webhook event');
                return;
            default:
                this.logger.log(`Unhandled event type: ${type}`);
                return;
        }

        try {
            await this.prisma.user.update({
                where: { id: app_user_id },
                data: {
                    isPremium,
                    subscriptionStatus,
                    subscriptionExpiresAt
                }
            });
            this.logger.log(`Updated user ${app_user_id}: premium=${isPremium}, status=${subscriptionStatus}`);
        } catch (error) {
            this.logger.error(`Failed to update user ${app_user_id}`, error);
            // We catch the error to ensure we still return 200 OK to RevenueCat, 
            // otherwise they will retry sending the webhook.
        }
    }
}
