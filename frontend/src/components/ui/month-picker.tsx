import { addMonths, subMonths, format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface MonthPickerProps {
  value: string; // "yyyy-MM-dd", sempre dia 1
  onChange: (value: string) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const currentDate = new Date(value);

  const goToPrevious = () => onChange(format(subMonths(currentDate, 1), "yyyy-MM-dd"));
  const goToNext = () => onChange(format(addMonths(currentDate, 1), "yyyy-MM-dd"));

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={goToPrevious}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="flex-1 whitespace-nowrap px-1 text-center text-sm font-medium capitalize text-slate-900">
        {format(currentDate, "MMMM yyyy", { locale: pt })}
      </span>
      <button
        type="button"
        onClick={goToNext}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}