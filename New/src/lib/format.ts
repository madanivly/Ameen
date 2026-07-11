export const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

export const fmtMonthKey = (monthKeyStr: string) => {
  // Convert YYYY-MM to "Month Year" format
  if (!monthKeyStr || monthKeyStr === 'N/A') return 'N/A';
  const [year, month] = monthKeyStr.split('-');
  if (!year || !month) return monthKeyStr;
  
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};
