import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-brand-silver/60 uppercase tracking-[0.18em] ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-brand-silver/25 outline-none transition-all',
          'focus:border-brand-cyan/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)]',
          error && 'border-red-500/50 focus:border-red-500/70',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-400 text-xs ml-1">{error}</p>}
    </div>
  )
)

Input.displayName = 'Input'
