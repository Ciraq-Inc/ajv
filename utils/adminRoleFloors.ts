// Lowest admin role that may open each admin page, matching the floors the backend enforces
// (rigel-medsgh tests/integration/adminRoleMatrix.test.js). A page also declares its own floor
// in definePageMeta so the route guard can read it; a test keeps the two in step.
// null = every admin who can reach the portal (the page's own calls are checked by the backend).
export type AdminPageFloor = string | null

export const ADMIN_PAGE_FLOORS: Record<string, AdminPageFloor> = {
  '/admin/access': 'order_processor',
  '/admin/clearance-sale': null,
  '/admin/customers': 'order_processor',
  '/admin/data': null,
  '/admin/developers': 'auditor',
  '/admin/discounts': 'auditor',
  '/admin/fee-schedules': 'super_admin',
  '/admin/fix-sales-items': 'auditor',
  '/admin/fulfillment': 'order_processor',
  '/admin/fulfillment/deliveries': 'order_processor',
  '/admin/fulfillment/dispatch-companies': 'order_processor',
  '/admin/fulfillment/order-requests': 'order_processor',
  '/admin/fulfillment/pharmacy-ledger': 'order_processor',
  '/admin/fulfillment/requests': 'order_processor',
  '/admin/fulfillment/riders': 'order_processor',
  '/admin/fulfillment/screen': 'order_processor',
  '/admin/masterlist': null,
  '/admin/orders-new': 'order_processor',
  '/admin/platform-settings': 'super_admin',
  '/admin/professionals': 'admin',
  '/admin/security': null,
  '/admin/signups': 'manager',
  '/admin/sms-billing': 'super_admin',
  '/admin/sms-campaigns': 'super_admin',
  '/admin/sms-settings': 'super_admin',
  '/admin/sms-usage': 'super_admin',
  '/admin/store-settings': 'admin',
  '/admin/useraccess': 'auditor',
}

export const canAccessAdminPage = (hasRole: (role: string) => boolean, path: string): boolean => {
  if (!(path in ADMIN_PAGE_FLOORS)) return false
  const floor = ADMIN_PAGE_FLOORS[path]
  return floor === null || hasRole(floor)
}
