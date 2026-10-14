import React, { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PintechLogo } from '@/components/layout/PintechLogo';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onContinueOffline?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onContinueOffline }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      setSuccessMsg('Sesión iniciada con éxito.');
      setTimeout(() => {
        onLoginSuccess?.();
      }, 600);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Auth debug error:', err);
      }
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        setErrorMsg('Credenciales incorrectas o cuenta no autorizada. Verifica tu información.');
      } else if (msg.includes('email not confirmed')) {
        setErrorMsg('No fue posible iniciar sesión. Verifica tus credenciales o el estado de activación de tu cuenta.');
      } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
        setErrorMsg('Demasiados intentos. Por motivos de seguridad, espera unos minutos antes de intentar de nuevo.');
      } else {
        setErrorMsg('No fue posible iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between items-center p-4 relative overflow-hidden">
      {/* Vercel Multi-Stop Atmospheric Mesh Gradient (Hero Scale) */}
      <div className="absolute top-0 left-0 right-0 h-[460px] bg-vercel-mesh pointer-events-none opacity-80" />

      {/* Top Bar Logo */}
      <div className="w-full max-w-5xl pt-6 px-4 flex items-center justify-between relative z-10">
        <PintechLogo size="md" showSubtitle={false} />
        <span className="font-mono-tech text-[11px] text-muted-foreground tracking-tight uppercase">
          Portal de Nómina v2.0
        </span>
      </div>

      {/* Main Authentication Card (Vercel card-marketing-large) */}
      <div className="w-full max-w-[420px] bg-card rounded-xl border shadow-vercel-float p-8 sm:p-9 relative z-10 my-auto">
        {/* Eyebrow and Headline */}
        <div className="mb-6">
          <span className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
            Autenticación
          </span>
          <h1 className="text-2xl font-semibold tracking-[-0.96px] text-foreground leading-snug">
            Bienvenido de nuevo.
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Gestión de horas extras, turnos y exportación oficial para nómina.
          </p>
        </div>

        {/* Registro público deshabilitado: las cuentas las crea el administrador */}
        <p className="mb-5 pb-3 border-b text-[11px] text-muted-foreground">
          ¿No tienes cuenta? Solicítala al administrador del sistema.
        </p>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-md border border-success/30 bg-success/10 text-success text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Correo electrónico" htmlFor="login-email">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@empresa.co"
                className="h-10 pl-9"
              />
            </div>
          </Field>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Contraseña</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(
                    'Para restablecer tu contraseña comunícate con el administrador del sistema. Te dará una contraseña temporal y al entrar crearás una nueva.'
                  );
                }}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
            <PasswordInput
              id="login-password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
            />
          </div>

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
            {loading ? (
              'Conectando...'
            ) : (
              <>
                Iniciar sesión
                <ArrowRight />
              </>
            )}
          </Button>
        </form>

        {/* Demo Mode Fallback */}
        {onContinueOffline && (
          <div className="mt-6 pt-4 border-t text-center">
            <button
              type="button"
              onClick={onContinueOffline}
              className="text-[11px] font-mono-tech text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              [Continuar en modo demostración local]
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer (Vercel Style) */}
      <footer className="w-full max-w-5xl py-6 px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground font-mono-tech relative z-10 border-t">
        <span>© {new Date().getFullYear()} Pintech Colombia S.A.S.</span>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span>Jornada Máxima CST Art. 22</span>
          <span>•</span>
          <span>Nómina Segura</span>
        </div>
      </footer>
    </div>
  );
};
