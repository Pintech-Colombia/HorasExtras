import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Sparkles, AlertCircle, CheckCircle2, Building2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PintechLogo } from './PintechLogo';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onContinueOffline?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onContinueOffline,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'supervisor' | 'manager' | 'accountant'>('supervisor');
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
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg('Te hemos enviado un correo con instrucciones para restablecer tu contraseña.');
        setLoading(false);
        return;
      }

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
          setSuccessMsg('¡Cuenta creada! Revisa tu correo electrónico para confirmar tu registro.');
        } else {
          setSuccessMsg('¡Registro completado! Ingresando al sistema...');
          setTimeout(() => {
            onLoginSuccess();
          }, 800);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSuccessMsg('¡Bienvenido! Sesión iniciada correctamente.');
        setTimeout(() => {
          onLoginSuccess();
        }, 600);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error al autenticar con Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-sky-500 selection:text-white relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Top Branding Section */}
        <div className="p-8 pb-6 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex justify-center mb-5">
            <PintechLogo size="lg" showSubtitle={false} />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isForgotPassword
                ? 'Recuperar Contraseña'
                : isSignUp
                ? 'Crear Cuenta Corporativa'
                : 'Control de Horas Extras'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isForgotPassword
                ? 'Ingresa tu correo para enviarte un enlace de recuperación'
                : isSignUp
                ? 'Regístrate para auditar y registrar horas extras en Pintech'
                : 'Acceso seguro para supervisores, encargados y contabilidad'}
            </p>
          </div>
        </div>

        {/* Tab Toggle (Ingresar / Registrarse) */}
        {!isForgotPassword && (
          <div className="flex border-b border-slate-800 text-xs font-semibold bg-slate-950/40">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-center transition border-b-2 ${
                !isSignUp
                  ? 'border-sky-400 text-white font-bold bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-center transition border-b-2 ${
                isSignUp
                  ? 'border-sky-400 text-white font-bold bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Registrar Usuario
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Ing. Carlos Pérez"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Rol en Pintech
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer"
                >
                  <option value="supervisor">👷 Supervisor de Planta / Turno (Registro)</option>
                  <option value="manager">👔 Encargado de Planta / Operaciones (Auditoría)</option>
                  <option value="accountant">📊 Contador / Recursos Humanos (Nómina)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@pintech.co"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Contraseña
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMsg(null);
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 transition"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold py-3 rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Conectando con Supabase...</span>
            ) : (
              <>
                <span>
                  {isForgotPassword
                    ? 'Enviar Enlace'
                    : isSignUp
                    ? 'Crear Cuenta Pintech'
                    : 'Ingresar al Sistema'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {isForgotPassword && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          )}
        </form>

        {/* Bottom Offline / Demo Escape Hatch */}
        {onContinueOffline && (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onContinueOffline}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              Continuar en modo demostración local
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Pintech Colombia S.A.S. • Gestión de Nómina y Turnos</p>
      </div>
    </div>
  );
};
