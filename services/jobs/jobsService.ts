// services/jobs/jobsService.ts
//
// Jobs domain service. Factory takes `useApi()` and returns plain async
// verbs for job CRUD and seeker management.

import type { ApiInstance, ApiEnvelope, Job, JobSeeker } from '../types';

export interface JobListParams {
  status?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export const createJobsService = (api: ApiInstance) => ({
  list(params: JobListParams = {}): Promise<ApiEnvelope<Job[]>> {
    return api.get('/api/jobs', { params });
  },

  listCompanyJobs(params: JobListParams = {}): Promise<ApiEnvelope<Job[]>> {
    return api.get('/api/jobs/company/my-jobs', { params });
  },

  getById(jobId: number | string): Promise<ApiEnvelope<Job>> {
    return api.get(`/api/jobs/${jobId}`);
  },

  create(payload: Partial<Job> & Record<string, unknown>): Promise<ApiEnvelope<Job>> {
    return api.post('/api/jobs', payload);
  },

  update(jobId: number | string, payload: Partial<Job> & Record<string, unknown>): Promise<ApiEnvelope<Job>> {
    return api.put(`/api/jobs/${jobId}`, payload);
  },

  listSeekers(params: JobListParams = {}): Promise<ApiEnvelope<JobSeeker[]>> {
    return api.get('/api/jobs/seekers', { params });
  },

  getSeekerById(seekerId: number | string): Promise<ApiEnvelope<JobSeeker>> {
    return api.get(`/api/jobs/seekers/${seekerId}`);
  },

  createSeeker(payload: Partial<JobSeeker> & Record<string, unknown>): Promise<ApiEnvelope<JobSeeker>> {
    return api.post('/api/jobs/seekers', payload);
  },
});
