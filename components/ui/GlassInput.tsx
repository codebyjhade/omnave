import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function GlassInput({ label, ...props }: GlassInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-[2px] text-white/50 pl-2">
        {label}
      </label>
      <input 
        className="w-full bg-white/[0.03] border border-white/10 focus:border-omnave-primary focus:ring-1 focus:ring-omnave-primary/50 transition-all duration-300 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/20 outline-none shadow-premium-inner"
        {...props}
      />
    </div>
  );
}
