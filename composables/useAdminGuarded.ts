// composables/useAdminGuarded.ts
//
// Session handling for the admin screens that talk to the API through a domain
// service. Wrapping a service with `useAdminGuarded` makes each of its calls:
//   - refuse to run with no admin signed in,
//   - sign the admin out when the server answers 401,
//   - log any other failure and rethrow it unchanged.
// This is what `adminStore.makeAuthRequest` did for every call, kept in one
// place so the services themselves stay free of session concerns.

import { useAdminStore } from '~/stores/admin';

interface AdminSession {
  token: string | null;
  logout: () => void;
}

type AsyncCalls = Record<string, (...args: never[]) => Promise<unknown>>;

export const guardAdminCalls = <S extends AsyncCalls>(service: S, session: AdminSession): S => {
  const guarded: Record<string, unknown> = {};
  for (const [name, call] of Object.entries(service)) {
    guarded[name] = async (...args: unknown[]) => {
      if (!session.token) throw new Error('No authentication token available');
      try {
        return await (call as (...a: unknown[]) => Promise<unknown>)(...args);
      } catch (error: unknown) {
        if ((error as { status?: number } | null)?.status === 401) {
          session.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Auth request error:', error);
        throw error;
      }
    };
  }
  return guarded as S;
};

export const useAdminGuarded = <S extends AsyncCalls>(service: S): S => {
  const adminStore = useAdminStore();
  // Read the store on every call: the token changes as the admin signs in and out.
  const session: AdminSession = {
    get token() { return adminStore.token as string | null; },
    logout: () => adminStore.logout(),
  };
  return guardAdminCalls(service, session);
};
