import { Conversation, type IConversation } from '../../models/conversation.model.js';
import { Message, type IMessage } from '../../models/message.model.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AppError } from '../../errors/app-error.js';
import type { TokenPayload } from '../../utils/auth-tokens.js';
import mongoose from 'mongoose';

export class ChatService {
  static async getOrCreateConversation(
    recipientId: string,
    user: TokenPayload,
    options: { listingId?: string; roommatePostId?: string } = {}
  ): Promise<IConversation> {
    if (recipientId === user.userId) {
      throw AppError.badRequest('You cannot start a conversation with yourself');
    }

    const participants = [
      new mongoose.Types.ObjectId(user.userId),
      new mongoose.Types.ObjectId(recipientId),
    ];

    // Look for existing conversation between these two users (optionally tied to listing/roommate post)
    const existing = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
      ...(options.listingId ? { listingId: options.listingId } : {}),
      ...(options.roommatePostId ? { roommatePostId: options.roommatePostId } : {}),
    }).populate('participants');

    if (existing) {
      return existing;
    }

    const conversation = await Conversation.create({
      participants,
      listingId: options.listingId,
      roommatePostId: options.roommatePostId,
      lastMessageAt: new Date(),
    });

    return conversation.populate('participants');
  }

  static async getUserConversations(user: TokenPayload): Promise<IConversation[]> {
    return Conversation.find({
      participants: new mongoose.Types.ObjectId(user.userId),
    })
      .populate('participants')
      .populate('listingId')
      .populate('roommatePostId')
      .sort({ lastMessageAt: -1 });
  }

  static async getConversationMessages(
    conversationId: string,
    user: TokenPayload,
    limit = 50,
    offset = 0
  ): Promise<{ items: IMessage[]; total: number }> {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw AppError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some((p) => p.toString() === user.userId);
    const isAdmin = user.role === 'ADMIN';

    if (!isParticipant && !isAdmin) {
      throw AppError.forbidden('You are not authorized to view messages in this conversation');
    }

    const query = { conversationId: new mongoose.Types.ObjectId(conversationId) };

    const [rawItems, total] = await Promise.all([
      Message.find(query)
        .populate('sender')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(Math.min(limit, 100)),
      Message.countDocuments(query),
    ]);

    // Reverse to chronological order (oldest to newest) for chat display
    const items = rawItems.reverse();

    return { items, total };
  }

  static async sendMessage(
    conversationId: string,
    content: string,
    user: TokenPayload
  ): Promise<IMessage> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw AppError.badRequest('Message content cannot be empty');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw AppError.notFound('Conversation not found');
    }

    const isParticipant = conversation.participants.some((p) => p.toString() === user.userId);

    if (!isParticipant) {
      throw AppError.forbidden('You can only send messages to conversations you participate in');
    }

    const message = await Message.create({
      conversationId: conversation._id,
      sender: user.userId,
      content: trimmed,
      readBy: [user.userId],
    });

    conversation.lastMessage = trimmed.substring(0, 100);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Notify other participant(s)
    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== user.userId
    );
    for (const recipientId of otherParticipants) {
      NotificationsService.createNotification(recipientId.toString(), {
        title: 'Nouveau message reçu',
        message: `${trimmed.substring(0, 80)}`,
        type: 'NEW_MESSAGE',
        link: `/messages?conversationId=${conversation._id}`,
      }).catch(() => {});
    }

    return message.populate('sender');
  }
}
