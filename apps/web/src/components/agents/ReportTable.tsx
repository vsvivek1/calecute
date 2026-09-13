/**
 * Renders any report from its own column definitions.
 *
 * The API describes each report's columns, so there is one table component
 * rather than sixteen. A new report on the server appears here correctly with
 * no frontend change — and a renamed column cannot leave the UI showing a
 * stale header next to the right data.
 */

/**
 * Loose on purpose: the generated OpenAPI types mark these optional, and a
 * report is still renderable with a missing key as long as the header is there.
 * Normalising here beats filtering at every call site.
 */
export interface Column {
  key?: string;
  header?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

/** Columns whose values are numeric and should sit right-aligned. */
const NUMERIC = /(count|total|slots|agents|approved|pending|remaining|waitlist|inr|paise|days|customers|views|ward no)/i;

/**
 * Rows arrive keyed by column key — the API projects them through the same
 * accessors the CSV and PDF exports use — so this is a direct lookup.
 */
function cellFor(row: Row, column: Column): string {
  if (!column.key) return "—";
  const value = row[column.key];
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export function ReportTable({
  columns,
  rows,
  empty,
}: {
  columns: Column[];
  rows: Row[];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="chips-note" style={{ marginTop: "1.5rem" }}>{empty}
      </p>
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key ?? index}
                className={NUMERIC.test(column.header ?? "") ? "num" : undefined}
              >
                {column.header ?? ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column, columnIndex) => (
                <td
                  key={column.key ?? columnIndex}
                  className={NUMERIC.test(column.header ?? "") ? "num" : undefined}
                >
                  {cellFor(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
