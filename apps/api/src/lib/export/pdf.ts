/**
 * PDF export.
 *
 * A KNOWN LIMITATION, stated here rather than discovered later:
 *
 * pdf-lib embeds fonts but does not do complex text shaping. Malayalam needs
 * reordering and ligature substitution, so Malayalam text cannot be rendered
 * correctly by this path. Rather than emit broken glyphs, PDF exports carry the
 * English name column only, and every PDF says so in its footer. The CSV export
 * carries both scripts and is the correct export for anything Malayalam.
 *
 * If Malayalam PDFs become a requirement, the honest fix is server-side
 * rendering through a shaping engine (HarfBuzz, or headless Chromium), which
 * is a heavier dependency than this programme currently justifies.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Column } from "./csv";

const PAGE_WIDTH = 842; // A4 landscape
const PAGE_HEIGHT = 595;
const MARGIN = 36;

/** Strips anything outside Latin-1, which is all StandardFonts can encode. */
function latin(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  const stripped = text.replace(/[^\x20-\x7E -ÿ]/g, "");
  return stripped.trim() === "" && text.trim() !== "" ? "(non-Latin — see CSV)" : stripped;
}

export async function toPdf<Row>(params: {
  title: string;
  subtitle?: string;
  rows: Row[];
  columns: Column<Row>[];
  generatedFor: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const columnWidth =
    (PAGE_WIDTH - MARGIN * 2) / Math.max(params.columns.length, 1);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const header = () => {
    page.drawText(latin(params.title), {
      x: MARGIN,
      y: y - 14,
      size: 14,
      font: bold,
    });
    y -= 24;
    if (params.subtitle) {
      page.drawText(latin(params.subtitle), {
        x: MARGIN,
        y: y - 10,
        size: 9,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
      y -= 18;
    }
    y -= 6;
    params.columns.forEach((column, index) => {
      page.drawText(latin(column.header).slice(0, 28), {
        x: MARGIN + index * columnWidth,
        y,
        size: 8,
        font: bold,
      });
    });
    y -= 4;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 12;
  };

  header();

  for (const row of params.rows) {
    if (y < MARGIN + 40) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      header();
    }
    params.columns.forEach((column, index) => {
      page.drawText(latin(column.value(row)).slice(0, 32), {
        x: MARGIN + index * columnWidth,
        y,
        size: 8,
        font,
      });
    });
    y -= 12;
  }

  // The disclosure that keeps this export honest.
  for (const p of pdf.getPages()) {
    p.drawText(
      `Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC for ${latin(params.generatedFor)} · Malayalam names omitted — use the CSV export`,
      { x: MARGIN, y: 18, size: 7, font, color: rgb(0.45, 0.45, 0.45) },
    );
  }

  return pdf.save();
}

export function pdfResponse(
  bytes: Uint8Array,
  filename: string,
  headers: Record<string, string> = {},
): Response {
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
