import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, X, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'manager' | 'accountant'>('manager');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isConfigured) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          setSuccessMsg('¡Cuenta creada! Te hemos enviado un enlace de confirmación a tu correo.');
        } else {
          setSuccessMsg('¡Registro exitoso! Iniciando sesión...');
          setTimeout(() => {
            onAuthSuccess?.();
            onClose();
          }, 1200);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSuccessMsg('¡Bienvenido! Sesión iniciada.');
        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111111] rounded-[12px] max-w-md w-full border border-[#ebebeb] dark:border-[#262626] shadow-vercel-modal overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#171717] text-white relative border-b border-[#262626]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-[6px] text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 caption-mono text-[10px] text-neutral-400 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Acceso Seguro
          </div>
          <h2 className="text-xl font-semibold tracking-display-sm">
            {isSignUp ? 'Crear Cuenta de Empresa' : 'Iniciar Sesión'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            {isSignUp
              ? 'Registra tu usuario para sincronizar en tiempo real con Supabase.'
              : 'Ingresa con tu correo corporativo para acceder a los registros.'}
          </p>
        </div>

        {/* Supabase Not Configured Warning */}
        {!isConfigured && (
          <div className="p-6 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 space-y-3">
            <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs font-sans">
                <p className="font-semibold">Supabase aún no está conectado</p>
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                  La app está funcionando en <strong>Modo Local</strong>. Para activar sincronización en la nube:
                </p>
                <ol className="list-decimal list-inside mt-2 space-y-1 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                  <li>Copia el archivo <code>supabase/schema.sql</code> en tu panel de Supabase.</li>
                  <li>Agrega <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> a tu <code>.env</code> o en Vercel.</li>
                </ol>
              </div>
            </div>
            <button
              onClick={onClose}
              className="button-primary w-full h-9 rounded-full text-xs font-medium"
            >
              Continuar en Modo Local
            </button>
          </div>
        )}

        {/* Form if Configured */}
        {isConfigured && (
          <form onSubmit={handleAuth} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-[8px] text-xs flex items-center gap-2 font-sans">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-[8px] text-xs flex items-center gap-2 font-sans">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {isSignUp && (
              <>
                <div>
                  <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Ing. Carlos Pérez"
                      className="form-input w-full pl-9 pr-3 h-9 rounded-[6px] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                    Rol en la Empresa
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="form-input w-full px-3 h-9 rounded-[6px] text-xs"
                  >
                    <option value="manager">Encargado de Operaciones / Planta</option>
                    <option value="accountant">Contador / Recursos Humanos</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="form-input w-full pl-9 pr-3 h-9 rounded-[6px] text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="caption-mono block text-neutral-600 dark:text-neutral-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input w-full pl-9 pr-3 h-9 rounded-[6px] text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button-primary w-full h-10 rounded-full text-xs font-medium flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Procesando...</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Crear Cuenta' : 'Ingresar'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-neutral-500 font-sans">
              {isSignUp ? (
                <span>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setErrorMsg(null);
                    }}
                    className="font-medium text-neutral-900 dark:text-white underline"
                  >
                    Inicia sesión aquí
                  </button>
                </span>
              ) : (
                <span>
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg(null);
                    }}
                    className="font-medium text-neutral-900 dark:text-white underline"
                  >
                    Regístrate gratis
                  </button>
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
