import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*', // Adjust this for production security
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                this.logger.warn(`Connection attempt without token: ${client.id}`);
                client.disconnect();
                return;
            }

            const secret = this.configService.get<string>('JWT_SECRET');
            const payload = this.jwtService.verify(token, { secret });

            // Assume payload.sub is the userId
            const userId = payload.sub;
            const roomName = `user_${userId}`;

            await client.join(roomName);
            // Store userId on the socket instance for future reference if needed
            (client as any).userId = userId;

            this.logger.log(`Client connected: ${client.id} (User: ${userId}) joined ${roomName}`);
        } catch (error) {
            this.logger.error(`Connection unauthorized: ${client.id}`, error.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    notifyEnrollment(userId: string, courseId: string) {
        const roomName = `user_${userId}`;
        this.logger.log(`Emitting enrollment_success to ${roomName} for course ${courseId}`);
        this.server.to(roomName).emit('enrollment_success', {
            courseId,
            timestamp: new Date().toISOString(),
        });
    }

    private extractToken(client: Socket): string | null {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
            return authHeader.split(' ')[1];
        }
        // Fallback to query param if needed (common in some socket clients)
        const queryToken = client.handshake.query.token;
        if (queryToken && typeof queryToken === 'string') {
            return queryToken;
        }
        return null;
    }
}
