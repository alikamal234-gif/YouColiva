import { ReportsService, type CreateReportInput } from './reports.service.js';
import type { IReport, ReportStatus } from '../../models/report.model.js';
import type { GraphQLContext } from '../../graphql/context.js';
import { AppError } from '../../errors/app-error.js';

export const reportsResolvers = {
  Report: {
    id: (parent: IReport) => parent._id.toString(),
    targetId: (parent: IReport) => parent.targetId.toString(),
  },

  Query: {
    reports: async (
      _parent: unknown,
      { status }: { status?: ReportStatus },
      context: GraphQLContext
    ) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw AppError.forbidden('Only administrators can access reports');
      }
      return ReportsService.listReports(status, context.user);
    },
  },

  Mutation: {
    createReport: async (
      _parent: unknown,
      { input }: { input: CreateReportInput },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to file a report');
      }
      return ReportsService.createReport(input, context.user);
    },

    resolveReport: async (
      _parent: unknown,
      { id, status, actionTaken }: { id: string; status: ReportStatus; actionTaken: string },
      context: GraphQLContext
    ) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw AppError.forbidden('Only administrators can resolve reports');
      }
      return ReportsService.resolveReport(id, status, actionTaken, context.user);
    },
  },
};
