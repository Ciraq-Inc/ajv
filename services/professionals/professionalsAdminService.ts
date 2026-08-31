import type { ApiInstance, ApiEnvelope } from '../types';

export interface ProfessionalApplication {
  id: number;
  master_customer_id: number;
  fname: string;
  lname: string;
  phone: string;
  email: string | null;
  profession_type: string;
  license_number: string;
  license_body: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  verification_method: 'manual' | 'auto_sms';
  registry_match_name: string | null;
  registry_match_member_since: string | null;
}

export interface ReviewParams {
  id: number;
  action: 'approve' | 'reject';
  rejection_reason?: string | null;
}

export type Profession = 'doctor' | 'pharmacist' | 'nurse' | 'other';

export interface RegistryEntry {
  id: number;
  psgh_id: string;
  profession: Profession;
  uid: string | null;
  display_name: string;
  email: string | null;
  phone_e164: string | null;
  member_since: string | null;
  source_file: string | null;
  imported_at: string;
  created_at: string;
  updated_at: string;
}

export interface RegistryListParams {
  profession?: Profession;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface RegistryListResult extends ApiEnvelope<RegistryEntry[]> {
  count: number;
  total: number;
  counts: { profession: Profession; total: number }[];
}

export interface RegistryImportResult {
  seen: number;
  upserted: number;
  skippedNoId: number;
  skippedNoName: number;
}

export const createProfessionalsAdminService = (api: ApiInstance) => ({
  list(status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<ApiEnvelope<ProfessionalApplication[]>> {
    return api.get('/api/professionals/admin', { params: { status, limit: 200 } });
  },

  review({ id, action, rejection_reason }: ReviewParams): Promise<ApiEnvelope<null>> {
    return api.put(`/api/professionals/admin/${id}/review`, { action, rejection_reason: rejection_reason ?? null });
  },

  listRegistry(params: RegistryListParams = {}): Promise<RegistryListResult> {
    return api.get('/api/professionals/admin/registry', { params: { ...params, limit: params.limit ?? 50 } });
  },

  importRegistry(file: File, profession: Profession): Promise<ApiEnvelope<RegistryImportResult>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profession', profession);
    return api.request('/api/professionals/admin/registry/import', {
      method: 'POST',
      body: formData,
    });
  },

  deleteRegistryEntry(id: number): Promise<ApiEnvelope<null>> {
    return api.delete(`/api/professionals/admin/registry/${id}`);
  },
});
