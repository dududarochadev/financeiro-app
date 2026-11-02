// Builds the year-overview spreadsheet as an Excel-friendly CSV:
// ';' separator (pt-BR) and comma decimals, so Excel parses the cells as numbers.

export type GroupMonthMap = Map<string, Map<number, { pending: number; paid: number }>>;

export interface YearMonthSummary {
  income_total: number;
  pending_total: number;
  paid_total: number;
  expected_balance: number;
}

export interface YearCsvData {
  monthLabels: string[];
  incomeGroups: string[];
  incomeMonthMap: GroupMonthMap;
  expenseGroups: string[];
  expenseMonthMap: GroupMonthMap;
  monthlySummaries: YearMonthSummary[];
  yearTotal: { income: number; pending: number; paid: number };
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvNumber = (value: number) => value.toFixed(2).replace('.', ',');

// Blank cells for absent month values keep the sheet readable
const csvAmount = (value: number) => (value === 0 ? '' : csvNumber(value));

export function buildYearCsv({
  monthLabels,
  incomeGroups,
  incomeMonthMap,
  expenseGroups,
  expenseMonthMap,
  monthlySummaries,
  yearTotal,
}: YearCsvData) {
  const rows: (string | number)[][] = [['Tipo', 'Grupo', ...monthLabels, 'Total']];

  const addGroups = (groups: string[], map: GroupMonthMap, type: string) => {
    for (const group of groups) {
      const monthMap = map.get(group);
      let total = 0;
      const cells = MONTHS.map((m) => {
        const entry = monthMap?.get(m);
        const value = (entry?.pending ?? 0) + (entry?.paid ?? 0);
        total += value;
        return csvAmount(value);
      });
      rows.push([type, group, ...cells, csvAmount(total)]);
    }
  };

  addGroups(incomeGroups, incomeMonthMap, 'Receita');
  addGroups(expenseGroups, expenseMonthMap, 'Despesa');

  rows.push([
    '',
    'Total Receitas',
    ...MONTHS.map((m) => csvNumber(monthlySummaries[m - 1].income_total)),
    csvNumber(yearTotal.income),
  ]);
  rows.push([
    '',
    'Total despesas',
    ...MONTHS.map((m) => csvNumber(monthlySummaries[m - 1].pending_total + monthlySummaries[m - 1].paid_total)),
    csvNumber(yearTotal.pending + yearTotal.paid),
  ]);
  rows.push([
    '',
    'Saldo',
    ...MONTHS.map((m) => csvNumber(monthlySummaries[m - 1].expected_balance)),
    csvNumber(yearTotal.income - yearTotal.pending - yearTotal.paid),
  ]);

  return rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
}

/** Triggers a browser download of the CSV with a UTF-8 BOM so Excel shows accents. */
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
