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
