// services/pharmacyPortal/pharmacyPortalService.ts
//
// What a signed-in pharmacy does from its portal: its orders, its wallet, its riders and their
// deliveries. Every call goes out with the company headers (`x-company-domain`, the staff token)
// from `getHeaders`, which `useApi` does not own.
//
// Pure HTTP: no Pinia, no result.success checks. Responses keep the shape the server sends
// (`{ success, orders }`, `{ success, wallet, transactions }`, ...), so the row type is the caller's.

import type { ApiInstance } from '../types';

export type HeadersProvider = () => Record<string, string>;

export interface PortalOrdersResponse<T> { success?: boolean; message?: string; orders?: T[] | null }
export interface PortalOrderResponse<T, I> { success?: boolean; message?: string; order?: T | null; items?: I[] | null }
export interface PortalWalletResponse<W, T> { success?: boolean; message?: string; wallet?: W | null; transactions?: T[] | null }
export interface PortalRidersResponse<T> { success?: boolean; message?: string; riders?: T[] | null }
export interface PortalDeliveriesResponse<T> { success?: boolean; message?: string; deliveries?: T[] | null }
export interface PortalActionResponse { success?: boolean; message?: string }

export interface NewRider {
  name: string;
  phone: string;
  username: string;
  password: string;
  vehicle_type?: string;
  vehicle_registration?: string;
}

type Options = { method?: string; headers?: Record<string, string>; body?: string };

export const createPharmacyPortalService = (api: ApiInstance, getHeaders: HeadersProvider = () => ({})) => {
  const send = <R>(endpoint: string, options: Options = {}): Promise<R> =>
    (api.request as unknown as (e: string, o: Options) => Promise<R>)(endpoint, {
      ...options,
      headers: { ...getHeaders(), ...(options.headers ?? {}) },
    });

  const json = { 'Content-Type': 'application/json' };

  return {
    /** GET /api/pharmacy-portal/orders */
    listOrders<T = unknown>(): Promise<PortalOrdersResponse<T>> {
      return send('/api/pharmacy-portal/orders');
    },

    /** GET /api/pharmacy-portal/orders/:id */
    getOrder<T = unknown, I = unknown>(orderId: number | string): Promise<PortalOrderResponse<T, I>> {
      return send(`/api/pharmacy-portal/orders/${String(orderId)}`);
    },

    /** POST /api/pharmacy-portal/orders/:id/ready */
    markOrderReady(orderId: number | string): Promise<PortalActionResponse> {
      return send(`/api/pharmacy-portal/orders/${String(orderId)}/ready`, { method: 'POST' });
    },

    /** POST /api/pharmacy-portal/orders/:id/handover */
    handOverOrder(orderId: number | string, code: string): Promise<PortalActionResponse> {
      return send(`/api/pharmacy-portal/orders/${String(orderId)}/handover`, {
        method: 'POST',
        headers: json,
        body: JSON.stringify({ code }),
      });
    },

    /** GET /api/pharmacy-portal/wallet */
    getWallet<W = unknown, T = unknown>(): Promise<PortalWalletResponse<W, T>> {
      return send('/api/pharmacy-portal/wallet');
    },

    /** GET /api/pharmacy/deliveries/assigned */
    listAssignedDeliveries<T = unknown>(): Promise<PortalDeliveriesResponse<T>> {
      return send('/api/pharmacy/deliveries/assigned');
    },

    /** POST /api/pharmacy/deliveries/:id/:action, with a JSON body only when there is one. */
    deliveryAction(deliveryId: number | string, action: string, body: Record<string, unknown> = {}): Promise<PortalActionResponse> {
      const hasBody = Object.keys(body).length > 0;
      return send(`/api/pharmacy/deliveries/${String(deliveryId)}/${action}`, {
        method: 'POST',
        headers: hasBody ? json : {},
        ...(hasBody && { body: JSON.stringify(body) }),
      });
    },

    /** GET /api/pharmacy/riders */
    listRiders<T = unknown>(): Promise<PortalRidersResponse<T>> {
      return send('/api/pharmacy/riders');
    },

    /** POST /api/pharmacy/riders */
    addRider(rider: NewRider): Promise<PortalActionResponse> {
      return send('/api/pharmacy/riders', { method: 'POST', headers: json, body: JSON.stringify({ ...rider }) });
    },

    /** DELETE /api/pharmacy/riders/:id */
    deactivateRider(riderId: number | string): Promise<PortalActionResponse> {
      return send(`/api/pharmacy/riders/${String(riderId)}`, { method: 'DELETE', headers: json });
    },

    /** POST /api/pharmacy/riders/:id/reactivate */
    reactivateRider(riderId: number | string): Promise<PortalActionResponse> {
      return send(`/api/pharmacy/riders/${String(riderId)}/reactivate`, { method: 'POST', headers: json });
    },
  };
};

export type PharmacyPortalService = ReturnType<typeof createPharmacyPortalService>;
