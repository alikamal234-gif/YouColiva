import {
  RoommateService,
  type CreateRoommatePostInput,
  type UpdateRoommatePostInput,
  type RoommatePostFilterInput,
} from './roommate.service.js';
import type { IRoommatePost } from '../../models/roommate-post.model.js';
import type { GraphQLContext } from '../../graphql/context.js';
import { AppError } from '../../errors/app-error.js';

export const roommateResolvers = {
  RoommatePost: {
    id: (parent: IRoommatePost) => parent._id.toString(),
    targetMoveInDate: (parent: IRoommatePost) => parent.targetMoveInDate.toISOString(),
  },

  Query: {
    roommatePost: async (_parent: unknown, { id }: { id: string }) => {
      return RoommateService.getPostById(id);
    },
    roommatePosts: async (_parent: unknown, { filter }: { filter?: RoommatePostFilterInput }) => {
      return RoommateService.queryPosts(filter || {});
    },
  },

  Mutation: {
    createRoommatePost: async (
      _parent: unknown,
      { input }: { input: CreateRoommatePostInput },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to create a roommate post');
      }
      return RoommateService.createPost(input, context.user);
    },

    updateRoommatePost: async (
      _parent: unknown,
      { input }: { input: UpdateRoommatePostInput },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to update a roommate post');
      }
      return RoommateService.updatePost(input, context.user);
    },

    deleteRoommatePost: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to delete a roommate post');
      }
      return RoommateService.deletePost(id, context.user);
    },
  },
};
