import * as React from "react";
import { cn } from "../../lib/utils";

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, onBlur, id, placeholder = "0,00", className }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // permite dígitos, UMA vírgula OU UM ponto, enquanto o utilizador escreve
      if (/^\d*[.,]?\d*$/.test(raw)) {
        onChange(raw);
      }
    };

    const handleBlur = () => {
      if (value.trim() !== "") {
        const normalized = value.replace(",", ".");
        const parsed = Number(normalized);
        if (!Number.isNaN(parsed)) {
          onChange(parsed.toFixed(2));
        }
      }
      onBlur?.();
    };

    return (
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          "appearance-none flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    );
  }
);
AmountInput.displayName = "AmountInput";