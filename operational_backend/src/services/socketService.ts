import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { authenticateSocket } from '../middleware/socketAuth';
import db from '../models';
const { User } = db;

type UserType = typeof User;

class SocketService {
  private io: SocketIOServer;
  private users: Map<number, string> = new Map(); // Map<userId, socketId>
  private User: UserType;

  constructor(server: HttpServer) {
    this.User = User;
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.initializeSocket();
  }

  private initializeSocket() {
    // Socket.IO middleware for authentication
    this.io.use(authenticateSocket);

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user as InstanceType<UserType>;
      console.log(`User ${user.id} connected`);

      // Store user's socket ID
      this.users.set(user.id, socket.id);

      // Join user to their own room for private messaging
      socket.join(`user_${user.id}`);

      // Join specific rooms if needed
      if (user.role === 'admin') {
        socket.join('admin');
      }

      // Handle joining a chat room
      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${user.id} joined room ${roomId}`);
      });

      // Handle leaving a chat room
      socket.on('leave_room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`User ${user.id} left room ${roomId}`);
      });

      // Handle typing indicator
      socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
        socket.to(data.roomId).emit('user_typing', {
          userId: user.id,
          isTyping: data.isTyping,
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${user.id} disconnected`);
        this.users.delete(user.id);
      });
    });
  }

  // Get socket.io instance
  public getIO(): SocketIOServer {
    return this.io;
  }

  // Get socket ID for a user
  public getSocketId(userId: number): string | undefined {
    return this.users.get(userId);
  }

  // Send a message to a specific user
  public sendToUser(userId: number, event: string, data: any) {
    const socketId = this.getSocketId(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Send a message to a room
  public sendToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  // Broadcast to all connected clients
  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }
}

export default SocketService;
