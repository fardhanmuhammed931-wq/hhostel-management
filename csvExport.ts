/**
 * Convert array of objects to CSV formatted string
 */
export function jsonToCsv(data: Record<string, any>[], columns?: { key: string; label: string }[]): string {
  if (!data || data.length === 0) {
    if (columns && columns.length > 0) {
      return columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',') + '\r\n';
    }
    return '';
  }

  const cols = columns || Object.keys(data[0]).map(key => ({
    key,
    label: key.replace(/_/g, ' ').toUpperCase(),
  }));

  const headerRow = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

  const rows = data.map(row => {
    return cols
      .map(col => {
        let val = row[col.key];
        if (val === null || val === undefined) {
          val = '';
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }
        // Escape double quotes
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}
