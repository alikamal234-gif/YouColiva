import {
  Report,
  type IReport,
  type ReportTargetType,
  type ReportStatus,
} from '../../models/report.model.js';
import { AppError } from '../../errors/app-error.js';
import type { TokenPayload } from '../../utils/auth-tokens.js';
import mongoose from 'mongoose';

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}

export class ReportsService {
  static async createReport(input: CreateReportInput, user: TokenPayload): Promise<IReport> {
    if (!input.reason.trim()) {
      throw AppError.badRequest('Report reason is required');
    }

    return Report.create({
      reporter: user.userId,
      targetType: input.targetType,
      targetId: new mongoose.Types.ObjectId(input.targetId),
      reason: input.reason.trim(),
      details: input.details?.trim(),
      status: 'PENDING',
    });
  }

  static async listReports(status?: ReportStatus, user?: TokenPayload): Promise<IReport[]> {
    if (!user || user.role !== 'ADMIN') {
      throw AppError.forbidden('Only administrators can view reports');
    }

    const query = status ? { status } : {};
    return Report.find(query).populate('reporter').sort({ createdAt: -1 });
  }

  static async resolveReport(
    id: string,
    status: ReportStatus,
    actionTaken: string,
    user: TokenPayload
  ): Promise<IReport> {
    if (user.role !== 'ADMIN') {
      throw AppError.forbidden('Only administrators can resolve reports');
    }

    const report = await Report.findById(id);
    if (!report) {
      throw AppError.notFound('Report not found');
    }

    report.status = status;
    report.actionTaken = actionTaken.trim();
    report.resolvedBy = new mongoose.Types.ObjectId(user.userId);

    await report.save();
    return report;
  }
}
