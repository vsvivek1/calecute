/**
 * CSV export.
 *
 * UTF-8 with a BOM, because the people who open these files open them in Excel
 * on Windows, and without the BOM every Malayalam name renders as mojibake.
 */

export interface Column<Row> {
  key: string;
  header: string;
  value: (row: Row) => unknown;
}

function escape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  // Quote if the value contains a delimiter, quote, or newline. Also quote a
  // leading =, +, - or @ so a spreadsheet does not evaluate it as a formula.
  if (/^[=+\-@]/.test(text)) return `"'${text.replace(/"/g, '""')}"`;
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv<Row>(rows: Row[], columns: Column<Row>[]): string {
  const lines = [
    columns.map((column) => escape(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escape(column.value(row))).join(","),
    ),
  ];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function csvResponse(
  body: string,
  filename: string,
  headers: Record<string, string> = {},
): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
