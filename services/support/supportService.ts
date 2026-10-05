// services/support/supportService.ts
//
// Support-ticket intake from the pharmacy staff portal. Public (no auth) —
// the backend only accepts the ticket if the phone matches an active staff
// record at the named pharmacy, so it works for staff whose online access
// isn't enabled and who therefore can't sign in.

import type { ApiInstance, ApiEnvelope } from '../types';

export type TicketCategory =
  'order' | 'payment' | 'delivery' | 'account' | 'technical' | 'billing' | 'other';

export interface StaffTicketParams {
  companyDomain: string;
  phone: string;
  requesterName: string;
  subject: string;
  description: string;
  category?: TicketCategory;
}

export interface StaffTicketResult {
  id: number;
  subject: string;
  status: string;
}

export const createSupportService = (api: ApiInstance) => ({
  /**
   * Submit a support ticket as a pharmacy staff member.
   * POST /api/staff-tickets
   */
  submitStaffTicket({ companyDomain, phone, requesterName, subject, description, category }: StaffTicketParams): Promise<ApiEnvelope<StaffTicketResult>> {
    return api.post('/api/staff-tickets', {
      company_domain: companyDomain,
      phone,
      requester_name: requesterName,
      subject,
      description,
      category,
    });
  },
});
