import React from 'react';

interface TrustBoxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'white';
  showText?: boolean;
}

export const TrustBoxLogo: React.FC<TrustBoxLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'light',
  showText = true,
}) => {

  const iconSizes = {
    sm: 26,
    md: 34,
    lg: 44,
    xl: 56,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const px = iconSizes[size];

  const isWhite = variant === 'white';
  const cloudStroke = isWhite ? '#FFFFFF' : '#1E293B';
  const boxSideColor = isWhite ? '#334155' : '#1E293B';
  const boxRightColor = isWhite ? '#475569' : '#334155';
  const boxTopColor = '#FF643D';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none font-sans ${className}`}>

      <svg
        width={px}
        height={(px * 38) / 48}
        viewBox="0 0 120 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >

        <path
          d="M32 75H24C13.5 75 5 66.5 5 56C5 46.2 12.4 38.1 22 37.1C23.2 21.8 36.1 10 52 10C65.3 10 76.8 18.3 80.8 30.2C82.8 29.5 85 29 87.2 29C99.2 29 109 38.8 109 50.8C109 51.9 108.9 53 108.7 54C112.5 56.4 115 60.5 115 65.2C115 72.3 109.3 78 102.2 78H88"
          stroke={cloudStroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g transform="translate(35, 38)">

          <polygon
            points="25,0 49,12 25,24 1,12"
            fill={boxTopColor}
          />

          <polygon
            points="1,12 25,24 25,48 1,36"
            fill={boxSideColor}
          />

          <polygon
            points="25,24 49,12 49,36 25,48"
            fill={boxRightColor}
          />
        </g>
      </svg>

      {showText && (
        <span className={`font-extrabold tracking-tight ${textSizes[size]} flex items-center`}>
          <span className={isWhite ? 'text-white' : 'text-black-900 dark:text-white'}>Trust</span>
          <span className="text-[#FF643D]">Box</span>
        </span>
      )}
    </div>
  );
};
