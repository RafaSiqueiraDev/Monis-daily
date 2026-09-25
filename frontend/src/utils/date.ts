import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

export function formatMonthLabel(dateStr: string): string {
  return format(parseISO(dateStr), "MMMM 'de' yyyy", { locale: pt });
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "dd/MM/yyyy");
}