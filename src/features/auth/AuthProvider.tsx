import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, UserRole } from '@/types';

type AuthStatus = 'loading' | 'signedOut' | 'mustSetPassword' | 'ready';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  isDemo: boolean;
  isRecovery: boolean;
  /** Solo en desarrollo sin Supabase: entra al modo demostración con datos ficticios */
  enterDemo?: () => void;
  /** Solo en modo demostración: cambiar de rol para probar las vistas */
  setDemoRole?: (role: UserRole) => void;
  signOut: () => Promise<void>;
  /** Vuelve a leer el perfil (p. ej. después de crear la contraseña) */
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

async function fetchProfile(user: User): Promise<UserProfile> {
  const { data } = await supabase!.from('profiles').select('*').eq('id', user.id).maybeSingle();
  // El rol SOLO se toma de la base de datos; sin perfil se trata como supervisor (mínimo privilegio)
  return {
    id: user.id,
    email: data?.email || user.email || '',
    fullName: data?.full_name || user.email?.split('@')[0] || 'Usuario',
    role: (data?.role as UserRole) || 'supervisor',
    companyId: data?.company_id,
    mustChangePassword: Boolean(data?.must_change_password),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [isRecovery, setIsRecovery] = React.useState(false);
  const [isDemo, setIsDemo] = React.useState(false);
  const [demoRole, setDemoRole] = React.useState<UserRole>('admin');

  // Solo se aplica la lectura de perfil más reciente (evita que una respuesta vieja pise a una nueva)
  const requestId = React.useRef(0);
  const loadProfile = React.useCallback(async (user: User | undefined) => {
    const id = ++requestId.current;
    if (!user) {
      setProfile(null);
      return;
    }
    let next: UserProfile;
    try {
      next = await fetchProfile(user);
    } catch {
      next = { id: user.id, email: user.email || '', fullName: user.email || 'Usuario', role: 'supervisor' };
    }
    if (id === requestId.current) setProfile(next);
  }, []);

  React.useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      if (event === 'SIGNED_OUT') queryClient.clear();
      // Solo se recarga el perfil cuando cambia el usuario (no en cada renovación de token)
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        // Diferido: Supabase recomienda no llamar a la API dentro del callback
        setTimeout(() => loadProfile(newSession?.user), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [loadProfile, queryClient]);

  const signOut = React.useCallback(async () => {
    if (isDemo) {
      setIsDemo(false);
      return;
    }
    await supabase?.auth.signOut();
    setSession(null);
    setProfile(null);
    queryClient.clear();
  }, [isDemo, queryClient]);

  const refreshProfile = React.useCallback(async () => {
    setIsRecovery(false);
    await loadProfile(session?.user);
  }, [loadProfile, session]);

  let status: AuthStatus;
  if (checking) status = 'loading';
  else if (isDemo) status = 'ready';
  else if (!session) status = 'signedOut';
  else if (!profile) status = 'loading';
  else if (isRecovery || profile.mustChangePassword) status = 'mustSetPassword';
  else status = 'ready';

  const value: AuthContextValue = {
    status,
    session,
    profile,
    role: isDemo ? demoRole : profile?.role || 'supervisor',
    isDemo,
    isRecovery,
    enterDemo: import.meta.env.DEV && !isSupabaseConfigured() ? () => setIsDemo(true) : undefined,
    setDemoRole: isDemo ? setDemoRole : undefined,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
