import React from 'react';

export function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let bg = 'bg-[#1C221E] text-text-muted border-border';

  if (s === 'operational' || s === 'completed' || s === 'healthy') {
    bg = 'bg-[#43D17D]/10 text-[#43D17D] border-[#43D17D]/25';
  } else if (s === 'warning' || s === 'degraded' || s === 'in progress' || s === 'approved') {
    bg = 'bg-[#F5B942]/10 text-[#F5B942] border-[#F5B942]/25';
  } else if (s === 'critical' || s === 'urgent' || s === 'under maintenance' || s === 'offline') {
    bg = 'bg-[#FF5B64]/10 text-[#FF5B64] border-[#FF5B64]/25';
  } else if (s === 'draft') {
    bg = 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/25';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider border font-medium ${bg}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80"></span>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = (priority || '').toLowerCase();
  let bg = 'bg-border/30 text-text-muted border-border';

  if (p === 'low') {
    bg = 'bg-[#43D17D]/10 text-[#43D17D] border-[#43D17D]/25';
  } else if (p === 'medium') {
    bg = 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/25';
  } else if (p === 'high') {
    bg = 'bg-[#F5B942]/10 text-[#F5B942] border-[#F5B942]/25';
  } else if (p === 'urgent' || p === 'critical') {
    bg = 'bg-[#FF5B64]/15 text-[#FF5B64] border-[#FF5B64]/35 font-semibold';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider border ${bg}`}>
      {priority}
    </span>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, badge, color = 'accent' }) {
  const colorMap = {
    accent: 'text-accent border-accent/20 bg-accent/5',
    healthy: 'text-[#43D17D] border-[#43D17D]/20 bg-[#43D17D]/5',
    warning: 'text-[#F5B942] border-[#F5B942]/20 bg-[#F5B942]/5',
    critical: 'text-[#FF5B64] border-[#FF5B64]/20 bg-[#FF5B64]/5',
    blue: 'text-[#38BDF8] border-[#38BDF8]/20 bg-[#38BDF8]/5',
  };

  return (
    <div className="bg-[#111512] border border-[#252B27] rounded-md p-4 transition-all hover:border-[#3A443E]">
      <div className="flex items-center justify-between text-text-muted mb-2">
        <span className="text-xs font-mono uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-1.5 rounded border ${colorMap[color] || colorMap.accent}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold font-mono tracking-tight text-text-main">{value}</span>
        {badge && <span className="text-[11px] font-mono text-text-muted">{badge}</span>}
      </div>
      {subtitle && <p className="text-[12px] text-text-muted mt-1 truncate">{subtitle}</p>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#252B27] gap-3">
      <div>
        <h1 className="text-lg font-mono font-bold tracking-tight text-text-main flex items-center gap-2">
          <span className="text-accent">//</span> {title}
        </h1>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
