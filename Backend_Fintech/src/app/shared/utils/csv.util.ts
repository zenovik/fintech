function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(headers: string[], rows: Array<Record<string, string | number | null | undefined>>): string {
  const lines = [headers.map(escapeCsvValue).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(String(row[header] ?? ''))).join(','));
  }
  return `${lines.join('\n')}\n`;
}
