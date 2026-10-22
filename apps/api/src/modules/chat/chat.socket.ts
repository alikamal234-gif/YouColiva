import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken, type TokenPayload } from '../../utils/auth-tokens.js';
import { ChatService } from './chat.service.js';
import { Conversation } from '../../models/conversation.model.js';
import { env } from '../../config/env.js';

interface AuthenticatedSocket extends Socket {
  data: {
    user: TokenPayload;
  };
}

export function setupChatSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as AuthenticatedSocket).data.user = payload;
      next();
    } catch {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const user = socket.data.user;

    // Join personal notification room
    socket.join(`user_${user.userId}`);

    // Join specific conversation room after verifying membership
    socket.on('join_conversation', async ({ conversationId }: { conversationId: string }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.participants.some((p) => p.toString() === user.userId)) {
          socket.join(`conversation_${conversationId}`);
          socket.emit('joined_conversation', { conversationId });
        } else {
          socket.emit('error', { message: 'Unauthorized to join this conversation' });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Send and broadcast message
    socket.on(
      'send_message',
      async ({ conversationId, content }: { conversationId: string; content: string }) => {
        try {
          const message = await ChatService.sendMessage(conversationId, content, user);
          const populatedSender = message.sender as any;
          const formattedMessage = {
            id: message._id.toString(),
            conversationId: message.conversationId.toString(),
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            sender: {
              id: (populatedSender?._id || populatedSender?.id || user.userId).toString(),
              firstName: populatedSender?.firstName || user.email.split('@')[0],
              lastName: populatedSender?.lastName || '',
              role: populatedSender?.role || user.role,
            },
          };
          io.to(`conversation_${conversationId}`).emit('new_message', formattedMessage);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to send message';
          socket.emit('error', { message });
        }
      }
    );
  });

  return io;
}
