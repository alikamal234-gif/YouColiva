import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type TokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export interface IToken extends Document {
  user: Types.ObjectId;
  tokenHash: string;
  type: TokenType;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'],
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL index to auto-expire tokens
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

tokenSchema.index({ tokenHash: 1, type: 1 });

export const Token: Model<IToken> =
  mongoose.models.Token || mongoose.model<IToken>('Token', tokenSchema);
