import React from 'react';

interface BadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const norm = status.toLowerCase();

  // Status mapping
  let bg = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  let dotColor = 'bg-slate-400';

  if (['active', 'available', 'paid', 'resolved', 'closed', 'present'].includes(norm)) {
    bg = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (['partially_occupied', 'partially_paid', 'in_progress', 'medium', 'warden', 'on_leave'].includes(norm)) {
    bg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else if (['full', 'overdue', 'high', 'emergency', 'absent', 'suspended'].includes(norm)) {
    bg = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    dotColor = 'bg-rose-400';
  } else if (['under_maintenance', 'pending', 'submitted', 'low', 'inactive', 'not_marked'].includes(norm)) {
    bg = 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    dotColor = 'bg-sky-400';
  } else if (['admin'].includes(norm)) {
    bg = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    dotColor = 'bg-purple-400';
  } else if (['student'].includes(norm)) {
    bg = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    dotColor = 'bg-cyan-400';
  }

  const displayText = label || norm.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border backdrop-blur-md uppercase tracking-wider ${sizeClass} ${bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{displayText}</span>
    </span>
  );
};
