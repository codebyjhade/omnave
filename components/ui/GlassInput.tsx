import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: React.ReactNode;
}

export function GlassInput({ label, suffix, ...props }: GlassInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-[2px] text-gray-500 pl-2">
        {label}
      </label>
      <div className="relative flex items-center w-full">
        <input 
          className="w-full bg-gray-50 border border-gray-200 focus:border-[#6949a8] focus:ring-1 focus:ring-[#6949a8]/50 transition-all duration-300 rounded-2xl px-4 py-3.5 pr-12 text-gray-900 placeholder:text-gray-400 outline-none shadow-sm"
          {...props}
        />
        {suffix && (
          <div className="absolute right-4 flex items-center justify-center z-10">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}
