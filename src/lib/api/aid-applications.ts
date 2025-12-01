/**
 * Aid Applications API
 * Client-safe API for managing aid applications
 */

import { aidApplications } from './crud-factory';
import type {
  AidApplicationDocument,
  CreateDocumentData,
  QueryParams,
} from '@/types/database';

export const aidApplicationsApi = {
  getAidApplication: (id: string) => aidApplications.getById(id),
  updateStage: (id: string, stage: AidApplicationDocument['stage']) =>
    aidApplications.update(id, { stage }),
  getAidApplications: (params?: Record<string, unknown>) =>
    aidApplications.getAll(params as QueryParams),
  createAidApplication: (data: CreateDocumentData<AidApplicationDocument>) =>
    aidApplications.create(data),
};
