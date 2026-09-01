const PK_FORMATTER = new Intl.NumberFormat('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPKR(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Rs.0.00';
  }
  return `Rs.${PK_FORMATTER.format(Number(value))}`;
}


