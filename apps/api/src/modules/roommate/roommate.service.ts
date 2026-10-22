import {
  RoommatePost,
  type IRoommatePost,
  type RoommateGenderPreference,
  type RoommatePostStatus,
} from '../../models/roommate-post.model.js';
import type { Campus } from '../../models/user.model.js';
import { AppError } from '../../errors/app-error.js';
import type { TokenPayload } from '../../utils/auth-tokens.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export interface CreateRoommatePostInput {
  title: string;
  description: string;
  campus: Campus;
  budgetMax: number;
  targetMoveInDate: Date;
  preferredRoommateGender?: RoommateGenderPreference;
  lifestyleHabits?: string[];
}

export interface UpdateRoommatePostInput extends Partial<CreateRoommatePostInput> {
  id: string;
  status?: RoommatePostStatus;
}

export interface RoommatePostFilterInput {
  campus?: Campus;
  budgetMax?: number;
  preferredRoommateGender?: RoommateGenderPreference;
  status?: RoommatePostStatus;
  limit?: number;
  offset?: number;
}

export class RoommateService {
  static async createPost(
    input: CreateRoommatePostInput,
    user: TokenPayload
  ): Promise<IRoommatePost> {
    if (input.budgetMax < 0) {
      throw AppError.badRequest('Budget cannot be negative');
    }

    const post = await RoommatePost.create({
      author: user.userId,
      title: input.title.trim(),
      description: input.description.trim(),
      campus: input.campus,
      budgetMax: input.budgetMax,
      targetMoveInDate: input.targetMoveInDate,
      preferredRoommateGender: input.preferredRoommateGender || 'ANY',
      lifestyleHabits: input.lifestyleHabits || [],
      status: 'OPEN',
    });

    NotificationsService.notifyCampusUsers(post.campus, {
      title: 'Nouvelle recherche de colocataire',
      message: `${post.title} - Budget max : ${post.budgetMax} MAD`,
      type: 'NEW_ROOMMATE_POST',
      link: '/roommates',
      excludeUserId: user.userId,
    }).catch(() => {});

    return post;
  }

  static async updatePost(
    input: UpdateRoommatePostInput,
    user: TokenPayload
  ): Promise<IRoommatePost> {
    const post = await RoommatePost.findById(input.id);
    if (!post) {
      throw AppError.notFound('Roommate post not found');
    }

    const isAuthor = post.author.toString() === user.userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      throw AppError.forbidden('You do not have permission to modify this roommate post');
    }

    if (input.title) post.title = input.title.trim();
    if (input.description) post.description = input.description.trim();
    if (input.campus) post.campus = input.campus;
    if (input.budgetMax !== undefined) post.budgetMax = input.budgetMax;
    if (input.targetMoveInDate) post.targetMoveInDate = input.targetMoveInDate;
    if (input.preferredRoommateGender) post.preferredRoommateGender = input.preferredRoommateGender;
    if (input.lifestyleHabits) post.lifestyleHabits = input.lifestyleHabits;
    if (input.status) post.status = input.status;

    await post.save();
    return post;
  }

  static async deletePost(id: string, user: TokenPayload): Promise<boolean> {
    const post = await RoommatePost.findById(id);
    if (!post) {
      throw AppError.notFound('Roommate post not found');
    }

    const isAuthor = post.author.toString() === user.userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      throw AppError.forbidden('You do not have permission to delete this roommate post');
    }

    await RoommatePost.findByIdAndDelete(id);
    return true;
  }

  static async getPostById(id: string): Promise<IRoommatePost | null> {
    return RoommatePost.findById(id).populate('author');
  }

  static async queryPosts(
    filter: RoommatePostFilterInput
  ): Promise<{ items: IRoommatePost[]; total: number }> {
    const query: Record<string, unknown> = {};

    query.status = filter.status || 'OPEN';

    if (filter.campus) {
      query.campus = filter.campus;
    }

    if (filter.budgetMax !== undefined) {
      query.budgetMax = { $lte: filter.budgetMax };
    }

    if (filter.preferredRoommateGender && filter.preferredRoommateGender !== 'ANY') {
      query.preferredRoommateGender = { $in: [filter.preferredRoommateGender, 'ANY'] };
    }

    const limit = Math.min(filter.limit || 20, 50);
    const offset = filter.offset || 0;

    const [items, total] = await Promise.all([
      RoommatePost.find(query).populate('author').sort({ createdAt: -1 }).skip(offset).limit(limit),
      RoommatePost.countDocuments(query),
    ]);

    return { items, total };
  }
}
