import React, { useState } from 'react';
import { Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PintechLogo } from './PintechLogo';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < MIN_LENGTH) {
      setErrorMsg(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (!supabase) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { error: rpcError } = await supabase.rpc('password_changed');
      if (rpcError) throw rpcError;
      onDone();
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('different from the old')) {
        setErrorMsg('La nueva contraseña debe ser diferente a la anterior.');
      } else if (msg.includes('weak') || msg.includes('at least')) {
        setErrorMsg('La contraseña es muy débil. Use letras, números y al menos 8 caracteres.');
      } else {
        setErrorMsg('No se pudo guardar la contraseña. Intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#0a0a0a] rounded-[12px] border border-[#ebebeb] dark:border-[#262626] shadow-vercel-float p-8">
        <PintechLogo size="md" showSubtitle={false} />
        <h1 className="mt-6 text-xl font-semibold text-[#171717] dark:text-white">
          {isRecovery ? 'Crea una nueva contraseña' : 'Crea tu contraseña personal'}
        </h1>
        <p className="text-xs text-[#666666] dark:text-[#888888] mt-1.5 leading-relaxed">
          {isRecovery
            ? 'Escribe tu nueva contraseña para recuperar el acceso.'
            : 'Por seguridad, reemplaza la contraseña temporal que te entregaron. Solo tú la conocerás.'}
          {email && <span className="block mt-1 font-mono">{email}</span>}
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-[6px] bg-[#f7d4d6] dark:bg-[#330000] border border-[#ee0000]/30 text-[#c50000] dark:text-[#ff6666] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {[
            { label: 'Nueva contraseña', value: password, set: setPassword },
            { label: 'Repite la contraseña', value: confirm, set: setConfirm },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#666666] dark:text-[#888888] mb-1">
                {f.label}
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={MIN_LENGTH}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="form-input w-full text-sm pl-9 pr-3 h-10 rounded-[6px]"
                />
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full h-10 rounded-full text-sm font-medium flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Guardando...' : 'Guardar y continuar'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <button onClick={onSignOut} className="mt-4 w-full text-center text-[11px] text-[#888888] hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
