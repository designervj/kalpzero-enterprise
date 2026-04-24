import React from "react";

interface SectionCardProps {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ icon, title, children, className = "" }: SectionCardProps) {
  return (
    <div className={`bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40 relative overflow-hidden group ${className}`}>
      <div className="flex items-center gap-3 border-l-2 border-gold pl-4">
        {icon && <span className="text-gold">{icon}</span>}
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
