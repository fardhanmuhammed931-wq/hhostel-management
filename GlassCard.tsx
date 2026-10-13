import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glow?: boolean;
  gradient?: 'blue' | 'purple' | 'cyan' | 'none';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  gradient = 'none',
  ...props
}) => {
  let gradientClass = '';
  if (gradient === 'blue') gradientClass = 'bg-gradient-to-br from-blue-900/20 to-slate-900/40';
  else if (gradient === 'purple') gradientClass = 'bg-gradient-to-br from-purple-900/20 to-slate-900/40';
  else if (gradient === 'cyan') gradientClass = 'bg-gradient-to-br from-cyan-900/20 to-slate-900/40';

  return (
    <div
      className={`
        relative rounded-2xl border border-white/10 dark:border-white/10
        bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl
        p-6 shadow-glass text-slate-100
        transition-all duration-300
        ${hoverEffect ? 'hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-glass-hover' : ''}
        ${glow ? 'shadow-glass-glow border-cyan-500/40' : ''}
        ${gradientClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
