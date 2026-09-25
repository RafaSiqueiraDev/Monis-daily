import * as React from "react";
import { Input } from "./input";

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value?: number | string;
  onChange?: (value: number | undefined) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onBlur, ...props }, ref) => {
    // Mantém o estado textual para permitir digitação livre (vírgulas, pontos)
    const [displayValue, setDisplayValue] = React.useState<string>(
      value !== undefined && value !== null && value !== "" ? String(value) : ""
    );

    // Sincroniza se o valor externo mudar (ex: reset do formulário)
    React.useEffect(() => {
      if (value === undefined || value === null || value === "") {
        setDisplayValue("");
      } else {
        const num = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
        if (!isNaN(num)) {
          setDisplayValue(num.toFixed(2));
        }
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Permite apenas dígitos, uma vírgula ou um ponto
      if (/^[0-9]*[.,]?[0-9]*$/.test(raw)) {
        setDisplayValue(raw);
        const normalized = raw.replace(",", ".");
        const parsed = parseFloat(normalized);
        onChange?.(isNaN(parsed) ? undefined : parsed);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue.trim() !== "") {
        const normalized = displayValue.replace(",", ".");
        const parsed = parseFloat(normalized);
        if (!isNaN(parsed)) {
          // Formata com 2 casas decimais ao sair do campo (ex: 5 -> 5.00, 0.5 -> 0.50)
          const formatted = parsed.toFixed(2);
          setDisplayValue(formatted);
          onChange?.(parsed);
        }
      }
      onBlur?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";