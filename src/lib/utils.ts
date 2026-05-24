import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// pt-BR Formatters
// ============================================================

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

const monthNames: string[] = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const monthNamesShort: string[] = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function getMonthName(month: number): string {
  return monthNames[month - 1] || '';
}

export function getMonthNameShort(month: number): string {
  return monthNamesShort[month - 1] || '';
}

export function formatMonthYear(month: number, year: number): string {
  return `${getMonthName(month)} de ${year}`;
}

export function formatMonthYearShort(month: number, year: number): string {
  return `${getMonthNameShort(month)}/${year}`;
}

// ============================================================
// Date / Month Helpers
// ============================================================

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

export function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}

export function getPreviousYear(month: number, year: number): { month: number; year: number } {
  return { month, year: year - 1 };
}

export function getNextYear(month: number, year: number): { month: number; year: number } {
  return { month, year: year + 1 };
}

export function isSameMonth(
  m1: number, y1: number,
  m2: number, y2: number
): boolean {
  return m1 === m2 && y1 === y2;
}

export function isCurrentMonth(month: number, year: number): boolean {
  const now = getCurrentMonthYear();
  return isSameMonth(month, year, now.month, now.year);
}

export function isFutureMonth(month: number, year: number): boolean {
  const now = getCurrentMonthYear();
  return year > now.year || (year === now.year && month > now.month);
}

export function isPastMonth(month: number, year: number): boolean {
  const now = getCurrentMonthYear();
  return year < now.year || (year === now.year && month < now.month);
}

// ============================================================
// Installment Helpers
// ============================================================

export function formatInstallment(current: number, total: number): string {
  return `${current}/${total}`;
}

// ============================================================
// Date Formatting
// ============================================================

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
