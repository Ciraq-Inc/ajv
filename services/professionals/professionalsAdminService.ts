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
}

export interface ReviewParams {
  id: number;
  action: 'approve' | 'reject';
  rejection_reason?: string | null;
}

export const createProfessionalsAdminService = (api: ApiInstance) => ({
  list(status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<ApiEnvelope<ProfessionalApplication[]>> {
    return api.get('/api/professionals/admin', { params: { status, limit: 200 } });
  },

  review({ id, action, rejection_reason }: ReviewParams): Promise<ApiEnvelope<null>> {
    return api.put(`/api/professionals/admin/${id}/review`, { action, rejection_reason: rejection_reason ?? null });
  },
});
