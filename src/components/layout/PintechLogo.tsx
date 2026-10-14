import React from 'react';

interface PintechLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const PintechLogo: React.FC<PintechLogoProps> = ({
  size = 'md',
  showSubtitle = true,
}) => {
  const logoHeights = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12',
    lg: 'h-14 sm:h-16',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <img
        src="/pintech-logo.png"
        alt="Pintech"
        className={`${logoHeights[size]} w-auto object-contain shrink-0`}
      />
      {showSubtitle && (
        <span className="caption-mono text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-[4px] bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] border border-[#ebebeb] dark:border-[#262626]">
          Nómina & Extras
        </span>
      )}
    </div>
  );
};
