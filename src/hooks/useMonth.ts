'use client';

import { useState, useCallback } from 'react';
import {
  getCurrentMonthYear,
  getPreviousMonth,
  getNextMonth,
  getPreviousYear,
  getNextYear,
} from '@/lib/utils';
import type { MonthYear } from '@/lib/types';

export function useMonth(initial?: MonthYear) {
  const [current, setCurrent] = useState<MonthYear>(
    initial ?? getCurrentMonthYear()
  );

  const goToPreviousMonth = useCallback(() => {
    setCurrent((prev) => getPreviousMonth(prev.month, prev.year));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrent((prev) => getNextMonth(prev.month, prev.year));
  }, []);

  const goToPreviousYear = useCallback(() => {
    setCurrent((prev) => getPreviousYear(prev.month, prev.year));
  }, []);

  const goToNextYear = useCallback(() => {
    setCurrent((prev) => getNextYear(prev.month, prev.year));
  }, []);

  const goToMonth = useCallback((month: number, year: number) => {
    setCurrent({ month, year });
  }, []);

  const goToToday = useCallback(() => {
    setCurrent(getCurrentMonthYear());
  }, []);

  return {
    month: current.month,
    year: current.year,
    current,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousYear,
    goToNextYear,
    goToMonth,
    goToToday,
  };
}
