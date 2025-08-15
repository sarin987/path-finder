import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, success: boolean) => void) => {
          // Allow WebSocket connections from ngrok in development
          if (
            process.env.NODE_ENV === 'development' &&
            origin &&
            (origin === 'https://3bf6-2401-4900-881e-1353-d678-d6fc-de47-c356.ngrok-free.app' ||
              origin.endsWith('.ngrok-free.app'))
          ) {
            return callback(null, true);
          }
          
          // Allow localhost and other development origins
          const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://localhost:19006',
            'http://127.0.0.1:3000',
            'http://10.0.2.2:3000',
            'http://192.168.1.100:3000',
            'http://192.168.0.100:3000',
            'exp://',
          ];

          if (origin && (allowedOrigins.includes(origin) || origin.startsWith('exp://'))) {
            return callback(null, true);
          }

          // Allow all origins in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Allowing connection from origin in development:', origin);
            return callback(null, true);
          }

          // In production, only allow specific origins
          const allowedProductionOrigins = [
            'https://your-production-domain.com',
            'https://app.your-production-domain.com',
          ];

          if (origin && allowedProductionOrigins.includes(origin)) {
            return callback(null, true);
          }

          callback(new Error('Not allowed by CORS'), false);
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.initializeSocketHandlers();
  }

  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('New client connected:', socket.id);

      // Handle authentication
      socket.on('authenticate', (data: { userId: string; token: string }) => {
        if (data && data.userId && data.token) {
          // Here you would validate the token
          this.connectedUsers.set(data.userId, socket.id);
          console.log(`User ${data.userId} authenticated on socket ${socket.id}`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove user from connected users
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            console.log(`User ${userId} disconnected`);
            break;
          }
        }
      });
    });
  }

  /**
   * Send a message to a specific user
   */
  public sendToUser(userId: string, event: string, data: any): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    } else {
      console.warn(`User ${userId} is not connected`);
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Get the socket instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export { SocketService };
