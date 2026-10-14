import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Check, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PintechLogo } from '@/components/layout/PintechLogo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { cn } from '@/lib/utils';

interface SetPasswordScreenProps {
  email?: string;
  isRecovery: boolean; // true = viene del correo "Olvidé mi contraseña"
  onDone: () => void;
  onSignOut: () => void;
}

const MIN_LENGTH = 8;

// Pantalla obligatoria para crear una contraseña propia (primer ingreso o recuperación)
export const SetPasswordScreen: React.FC<SetPasswordScreenProps> = ({ email, isRecovery, onDone, onSignOut }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Requisitos visibles mientras se escribe
  const requirements = [
    { label: `Al menos ${MIN_LENGTH} caracteres`, ok: password.length >= MIN_LENGTH },
    { label: 'Al menos un número', ok: /\d/.test(password) },
    { label: 'Las dos contraseñas coinciden', ok: password.length > 0 && password === confirm },
  ];
  const allOk = requirements.every((r) => r.ok);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!allOk || !supabase) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { error: rpcError } = await supabase.rpc('password_changed');
      if (rpcError) throw rpcError;
      onDone();
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message || '').toLowerCase();
      if (msg.includes('different from the old')) {
        setErrorMsg('La nueva contraseña debe ser diferente a la anterior.');
      } else if (msg.includes('weak') || msg.includes('at least')) {
        setErrorMsg('La contraseña es muy débil. Usa letras, números y al menos 8 caracteres.');
      } else {
        setErrorMsg('No se pudo guardar la contraseña. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-[420px] p-7 sm:p-8">
        <PintechLogo size="md" showSubtitle={false} />
        <h1 className="mt-6 text-xl font-semibold">
          {isRecovery ? 'Crea una nueva contraseña' : 'Crea tu contraseña personal'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isRecovery
            ? 'Escribe tu nueva contraseña para recuperar el acceso.'
            : 'Por seguridad, reemplaza la contraseña temporal que te entregaron. Solo tú la conocerás.'}
        </p>
        {email && <p className="mt-1 font-mono text-xs text-muted-foreground">{email}</p>}

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Nueva contraseña" htmlFor="new-password">
            <PasswordInput
              id="new-password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
            />
          </Field>

          <Field label="Repite la contraseña" htmlFor="confirm-password">
            <PasswordInput
              id="confirm-password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-10"
            />
          </Field>

          <ul className="space-y-1.5 text-xs">
            {requirements.map((r) => (
              <li key={r.label} className={cn('flex items-center gap-2', r.ok ? 'text-success' : 'text-muted-foreground')}>
                {r.ok ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
                {r.label}
              </li>
            ))}
          </ul>

          <Button type="submit" size="lg" className="w-full" disabled={loading || !allOk}>
            {loading ? 'Guardando...' : 'Guardar y continuar'}
            {!loading && <ArrowRight />}
          </Button>
        </form>

        <Button variant="link" size="sm" onClick={onSignOut} className="mt-3 w-full text-muted-foreground">
          Cerrar sesión
        </Button>
      </Card>
    </div>
  );
};
