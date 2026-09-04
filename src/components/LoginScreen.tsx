import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [role] = useState<'manager' | 'accountant'>('manager');
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
        setSuccessMsg('Enlace de recuperación enviado. Revisa tu bandeja de entrada.');
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
              role: 'manager',
            },
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          setSuccessMsg('Cuenta creada con éxito. Si tienes activada la confirmación de email en Supabase, revisa tu bandeja de entrada o desactiva "Confirm email" en Supabase Auth.');
        } else {
          setSuccessMsg('Registro exitoso. Redirigiendo al panel...');
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

        setSuccessMsg('Sesión iniciada con éxito.');
        setTimeout(() => {
          onLoginSuccess();
        }, 600);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al conectar con Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] flex flex-col justify-between items-center p-4 relative overflow-hidden">
      {/* Vercel Multi-Stop Atmospheric Mesh Gradient (Hero Scale) */}
      <div className="absolute top-0 left-0 right-0 h-[460px] bg-vercel-mesh pointer-events-none opacity-80" />

      {/* Top Bar Logo */}
      <div className="w-full max-w-5xl pt-6 px-4 flex items-center justify-between relative z-10">
        <PintechLogo size="md" showSubtitle={false} />
        <span className="font-mono-tech text-[11px] text-[#888888] tracking-tight uppercase">
          Portal de Nómina v2.0
        </span>
      </div>

      {/* Main Authentication Card (Vercel card-marketing-large) */}
      <div className="w-full max-w-[420px] bg-white dark:bg-[#0a0a0a] rounded-[12px] border border-[#ebebeb] dark:border-[#262626] shadow-vercel-float p-8 sm:p-9 relative z-10 my-auto">
        {/* Eyebrow and Headline */}
        <div className="mb-6">
          <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[#666666] dark:text-[#888888] block mb-1">
            {isForgotPassword ? 'Seguridad' : isSignUp ? 'Registro Corporativo' : 'Autenticación'}
          </span>
          <h1 className="text-2xl font-semibold tracking-[-0.96px] text-[#171717] dark:text-white leading-snug">
            {isForgotPassword
              ? 'Restablece tu contraseña.'
              : isSignUp
              ? 'Crea tu cuenta en Pintech.'
              : 'Bienvenido de nuevo.'}
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-1.5 leading-relaxed">
            {isForgotPassword
              ? 'Ingresa tu correo para recibir un enlace de recuperación seguro.'
              : isSignUp
              ? 'Ingresa tus datos para registrar y auditar horas extras en planta.'
              : 'Gestión de horas extras, turnos y exportación oficial para nómina.'}
          </p>
        </div>

        {/* Tab switch (Login / SignUp) */}
        {!isForgotPassword && (
          <div className="flex border-b border-[#ebebeb] dark:border-[#262626] mb-5 font-mono-tech text-xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2.5 mr-5 transition-colors border-b-2 font-medium cursor-pointer ${
                !isSignUp
                  ? 'border-[#171717] dark:border-white text-[#171717] dark:text-white'
                  : 'border-transparent text-[#888888] hover:text-[#171717] dark:hover:text-white'
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
              className={`pb-2.5 transition-colors border-b-2 font-medium cursor-pointer ${
                isSignUp
                  ? 'border-[#171717] dark:border-white text-[#171717] dark:text-white'
                  : 'border-transparent text-[#888888] hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-[6px] bg-[#f7d4d6] dark:bg-[#330000] border border-[#ee0000]/30 text-[#c50000] dark:text-[#ff6666] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-[6px] bg-[#d3e5ff] dark:bg-[#002244] border border-[#0070f3]/30 text-[#0761d1] dark:text-[#66b3ff] text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        {/* Form Inputs (Vercel form-input style) */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && !isForgotPassword && (
            <>
              <div>
                <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#666666] dark:text-[#888888] mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Ing. Carlos Pérez"
                    className="w-full h-10 bg-white dark:bg-[#111111] border border-[#ebebeb] dark:border-[#262626] rounded-[6px] pl-9 pr-3 text-xs text-[#171717] dark:text-white placeholder-[#888888] focus:outline-none focus:border-[#171717] dark:focus:border-white transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#666666] dark:text-[#888888] mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@pintech.co"
                className="w-full h-10 bg-white dark:bg-[#111111] border border-[#ebebeb] dark:border-[#262626] rounded-[6px] pl-9 pr-3 text-xs text-[#171717] dark:text-white placeholder-[#888888] focus:outline-none focus:border-[#171717] dark:focus:border-white transition-colors"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[#666666] dark:text-[#888888]">
                  Contraseña
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMsg(null);
                    }}
                    className="text-[11px] text-[#0070f3] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 bg-white dark:bg-[#111111] border border-[#ebebeb] dark:border-[#262626] rounded-[6px] pl-9 pr-3 text-xs text-[#171717] dark:text-white placeholder-[#888888] focus:outline-none focus:border-[#171717] dark:focus:border-white transition-colors"
                />
              </div>
            </div>
          )}

          {/* Vercel button-primary: 100px pill shape, ~48px tall, #171717 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-4 rounded-full bg-[#171717] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#ededed] text-white dark:text-[#171717] text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-vercel-subtle cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="font-mono-tech text-xs">Conectando...</span>
            ) : (
              <>
                <span>
                  {isForgotPassword
                    ? 'Enviar Enlace de Restablecimiento'
                    : isSignUp
                    ? 'Crear Cuenta'
                    : 'Iniciar Sesión'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
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
                className="text-xs text-[#888888] hover:text-[#171717] dark:hover:text-white cursor-pointer"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          )}
        </form>

        {/* Demo Mode Fallback */}
        {onContinueOffline && (
          <div className="mt-6 pt-4 border-t border-[#ebebeb] dark:border-[#262626] text-center">
            <button
              type="button"
              onClick={onContinueOffline}
              className="text-[11px] font-mono-tech text-[#888888] hover:text-[#171717] dark:hover:text-white transition-colors cursor-pointer"
            >
              [Continuar en modo demostración local]
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer (Vercel Style) */}
      <footer className="w-full max-w-5xl py-6 px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#888888] font-mono-tech relative z-10 border-t border-[#ebebeb] dark:border-[#262626]">
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
