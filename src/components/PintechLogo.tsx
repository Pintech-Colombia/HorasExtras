import React from 'react';

interface PintechLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const PintechLogo: React.FC<PintechLogoProps> = ({
  size = 'md',
  showSubtitle = true,
}) => {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textStyles = {
    sm: 'text-sm tracking-[-0.6px]',
    md: 'text-base tracking-[-0.96px]',
    lg: 'text-xl tracking-[-1.28px]',
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Vercel-style stark geometric mark */}
      <div
        className={`${iconDimensions[size]} rounded-[6px] bg-[#171717] dark:bg-white text-white dark:text-[#171717] flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm`}
      >
        <svg viewBox="0 0 32 32" fill="none" className="w-4 h-4">
          {/* Stark Geometric P Form */}
          <path
            d="M8 6H19C23.4183 6 27 9.58172 27 14C27 18.4183 23.4183 22 19 22H14V26H8V6Z"
            fill="currentColor"
          />
          <path
            d="M14 11H18.5C20.1569 11 21.5 12.3431 21.5 14C21.5 15.6569 20.1569 17 18.5 17H14V11Z"
            fill="var(--canvas, #ffffff)"
            className="dark:fill-[#171717]"
          />
        </svg>
      </div>

      {/* Brand Typography in Geist */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`${textStyles[size]} font-semibold text-[#171717] dark:text-white leading-tight`}>
            PINTECH
          </span>
          <span className="font-mono-tech text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-[4px] bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#666666] dark:text-[#888888] border border-[#ebebeb] dark:border-[#262626]">
            Nómina
          </span>
        </div>
        {showSubtitle && (
          <span className="font-mono-tech text-[11px] text-[#888888] dark:text-[#666666] leading-none mt-0.5">
            Pintech Colombia S.A.S.
          </span>
        )}
      </div>
    </div>
  );
};
