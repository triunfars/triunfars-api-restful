import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from '../course/course.service';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly courseService: CourseService,
    ) { }

    async handleWebhook(body: any) {
        const { event } = body;

        if (!event) {
            this.logger.warn('Invalid webhook payload: missing event object');
            return;
        }

        const { type, app_user_id, expiration_at_ms } = event;

        console.log("eevent ==>>", event)

        this.logger.log(`Received webhook for user ${app_user_id}`);

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
                isPremium = true;
                subscriptionStatus = 'active';
                if (expiration_at_ms) {
                    subscriptionExpiresAt = new Date(expiration_at_ms);
                }
                this.logger.log(`User ${app_user_id} has started a new subscription`);
                break;
            case 'CANCELLATION':
                // User turned off auto-renew, but still has access until expiration
                isPremium = true;
                subscriptionStatus = 'cancelled';
                if (expiration_at_ms) {
                    subscriptionExpiresAt = new Date(expiration_at_ms);
                }
                this.logger.log(`User ${app_user_id} cancelled subscription`);
                break;
            case 'EXPIRATION':
                isPremium = false;
                subscriptionStatus = 'expired';
                if (expiration_at_ms) {
                    subscriptionExpiresAt = new Date(expiration_at_ms);
                } else {
                    subscriptionExpiresAt = new Date();
                }
                this.logger.log(`User ${app_user_id} subscription expired`);
                break;
            case 'TEST':
                this.logger.log('Received TEST webhook event');
                return;
            case 'NON_RENEWING_PURCHASE':
                await this.handleSinglePurchase(event);
                return;
            default:
                this.logger.warn(`Unhandled event type: ${type}`);
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

    private async handleSinglePurchase(event: any) {
        const { product_id, app_user_id } = event;
        this.logger.log(`Handling single purchase: ${product_id} for user ${app_user_id}`);

        try {
            const course = await this.prisma.course.findUnique({
                where: { revenueCatIdentifierId: product_id },
            });

            if (!course) {
                this.logger.warn(`No course found for RevenueCat product ID: ${product_id}`);
                return;
            }

            // Check if app_user_id is a valid MongoDB ObjectId
            const objectIdPattern = /^[0-9a-fA-F]{24}$/;
            if (!objectIdPattern.test(app_user_id)) {
                this.logger.warn(`Invalid User ID format: ${app_user_id}. Cannot enroll user.`);
                return;
            }

            console.log("courseId", course.id)

            await this.courseService.enrollUser(course.id, app_user_id);
            this.logger.log(`Successfully enrolled user ${app_user_id} in course ${course.title}`);
        } catch (error) {
            this.logger.error(`Failed to handle single purchase for user ${app_user_id}`, error);
        }
    }
}
