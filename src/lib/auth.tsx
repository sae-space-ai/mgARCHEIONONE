// ARCHEION ONE - Auth Context
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Organization, Membership, Session, Role } from './types';
import { store } from './store';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  membership: Membership | null;
  sessionToken: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (name: string) => Promise<Organization>;
  getRole: () => Role;
  organizations: Organization[];
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'archeion_session_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    organization: null,
    membership: null,
    sessionToken: null,
    loading: true,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const refreshOrganizations = useCallback(async () => {
    if (state.user) {
      const orgs = await store.getOrganizations(state.user.id);
      setOrganizations(orgs);
    }
  }, [state.user]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(SESSION_KEY);
      if (token) {
        const session = await store.getSession(token);
        if (session) {
          const user = await (await import('./store')).db.users.get(session.userId);
          if (user) {
            const org = await (await import('./store')).db.organizations.get(session.organizationId);
            const membership = await store.getMembership(user.id, session.organizationId);
            setState({ user, organization: org || null, membership: membership || null, sessionToken: token, loading: false });
            const orgs = await store.getOrganizations(user.id);
            setOrganizations(orgs);
            return;
          }
        }
        localStorage.removeItem(SESSION_KEY);
      }
      setState(s => ({ ...s, loading: false }));
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await store.authenticateUser(email, password);
    if (!user) return { success: false, error: 'Credenciales incorrectas' };

    const orgs = await store.getOrganizations(user.id);
    if (orgs.length === 0) {
      // Create default organization
      const org = await store.createOrganization('Mi Organización', user.id);
      await store.addMembership(user.id, org.id, 'admin');
      orgs.push(org);
    }

    const org = orgs[0];
    const session = await store.createSession(user.id, org.id);
    localStorage.setItem(SESSION_KEY, session.token);

    const membership = await store.getMembership(user.id, org.id);
    setState({ user, organization: org, membership: membership || null, sessionToken: session.token, loading: false });
    setOrganizations(orgs);

    await store.addAuditEvent({
      organizationId: org.id,
      userId: user.id,
      action: 'user.login',
      entityType: 'session',
      entityId: session.token,
      details: { email: user.email },
    });

    return { success: true };
  };

  const register = async (email: string, name: string, password: string) => {
    try {
      const user = await store.createUser(email, name, password);
      const org = await store.createOrganization('Mi Organización', user.id);
      await store.addMembership(user.id, org.id, 'admin');

      const session = await store.createSession(user.id, org.id);
      localStorage.setItem(SESSION_KEY, session.token);

      const membership = await store.getMembership(user.id, org.id);
      setState({ user, organization: org, membership: membership || null, sessionToken: session.token, loading: false });
      setOrganizations([org]);

      await store.addAuditEvent({
        organizationId: org.id,
        userId: user.id,
        action: 'user.register',
        entityType: 'user',
        entityId: user.id,
        details: { email, name },
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  const logout = async () => {
    if (state.sessionToken) {
      await store.deleteSession(state.sessionToken);
    }
    localStorage.removeItem(SESSION_KEY);
    setState({ user: null, organization: null, membership: null, sessionToken: null, loading: false });
    setOrganizations([]);
  };

  const switchOrganization = async (orgId: string) => {
    if (!state.user || !state.sessionToken) return;
    const org = await (await import('./store')).db.organizations.get(orgId);
    const membership = await store.getMembership(state.user.id, orgId);
    if (org && membership) {
      await store.deleteSession(state.sessionToken);
      const session = await store.createSession(state.user.id, orgId);
      localStorage.setItem(SESSION_KEY, session.token);
      setState({ ...state, organization: org, membership, sessionToken: session.token });
    }
  };

  const createOrganization = async (name: string) => {
    if (!state.user) throw new Error('No autenticado');
    const org = await store.createOrganization(name, state.user.id);
    await store.addMembership(state.user.id, org.id, 'admin');
    await refreshOrganizations();
    return org;
  };

  const getRole = (): Role => {
    return state.membership?.role || 'reader';
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      switchOrganization,
      createOrganization,
      getRole,
      organizations,
      refreshOrganizations,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
