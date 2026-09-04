import React from 'react';

interface PintechLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const PintechLogo: React.FC<PintechLogoProps> = ({
  size = 'md',
  showSubtitle = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Pintech Geometric Logo Mark */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 shadow-inner flex items-center justify-center relative overflow-hidden shrink-0`}
      >
        <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
          {/* P stem & loop */}
          <path
            d="M12 10H23C27.4183 10 31 13.5817 31 18C31 22.4183 27.4183 26 23 26H18V32H12V10Z"
            fill="url(#logo-grad)"
          />
          <path
            d="M18 15H22.5C24.433 15 26 16.567 26 18.5C26 20.433 24.433 22 22.5 22H18V15Z"
            fill="#0f172a"
          />
          {/* Tech Accent Dot */}
          <circle cx="28" cy="29" r="2.5" fill="#38bdf8" />
          <defs>
            <linearGradient id="logo-grad" x1="12" y1="10" x2="31" y2="32" gradientUnits="userSpaceOnUse">
              <stop stop-color="#38bdf8" />
              <stop offset="1" stop-color="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Typography */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`${textSizes[size]} font-extrabold tracking-tight text-white`}>
            PINTECH
          </span>
          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold border border-sky-500/30">
            NÓMINA
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">
            Pintech Colombia S.A.S.
          </p>
        )}
      </div>
    </div>
  );
};
