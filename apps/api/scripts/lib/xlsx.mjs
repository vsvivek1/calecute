/**
 * A minimal .xlsx reader.
 *
 * The LGD portal exports Excel, not CSV, so the geography loader has to read
 * xlsx. An .xlsx file is a ZIP of XML, and Node has `zlib` but no ZIP reader —
 * so this parses the ZIP container itself. About sixty lines, versus adding a
 * spreadsheet library to a project that reads two files, once, at seed time.
 *
 * Deliberately narrow: it reads cell values as strings from the first
 * worksheet and resolves the shared-string table. No formulas, no styles, no
 * dates, no streaming. If a future export needs more than that, use a library
 * rather than growing this.
 */
import { inflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";

/** Read the ZIP central directory and return { name -> Buffer }. */
function unzip(buffer) {
  // End of central directory record: signature 0x06054b50, scanned backwards
  // because it is followed by a variable-length comment.
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0 && i > buffer.length - 65558; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a ZIP file (no end-of-central-directory)");

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const files = new Map();

  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);

    // The local header repeats the name and extra fields, with its own lengths.
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);

    files.set(name, method === 0 ? raw : inflateRawSync(raw));
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return files;
}

/** Text content of an XML element, tags stripped, entities resolved. */
function textOf(xml) {
  return xml
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&");
}

/**
 * Read the first worksheet as an array of string arrays.
 *
 * Blank cells are preserved as empty strings at their column position — the
 * LGD exports have gaps, and collapsing them would silently shift columns.
 */
export function readSheet(path) {
  const files = unzip(readFileSync(path));

  const sharedXml = files.get("xl/sharedStrings.xml");
  const shared = [];
  if (sharedXml) {
    const text = sharedXml.toString("utf8");
    for (const match of text.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      shared.push(textOf(match[1]));
    }
  }

  const sheetName = [...files.keys()]
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort()[0];
  if (!sheetName) throw new Error(`No worksheet found in ${path}`);

  const sheet = files.get(sheetName).toString("utf8");
  const rows = [];

  for (const rowMatch of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(
      /<c\s([^>]*?)\/>|<c\s([^>]*?)>([\s\S]*?)<\/c>/g,
    )) {
      const attributes = cellMatch[1] ?? cellMatch[2] ?? "";
      const inner = cellMatch[3] ?? "";

      // The r attribute carries the cell reference (e.g. "C7"); use its column
      // so a run of empty cells does not shift everything left.
      const reference = /r="([A-Z]+)\d+"/.exec(attributes)?.[1];
      if (reference) {
        let column = 0;
        for (const char of reference) {
          column = column * 26 + (char.charCodeAt(0) - 64);
        }
        while (cells.length < column - 1) cells.push("");
      }

      const type = /t="([^"]+)"/.exec(attributes)?.[1];
      const value = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];

      if (type === "s" && value !== undefined) {
        cells.push(shared[Number(value)] ?? "");
      } else if (type === "inlineStr") {
        cells.push(textOf(inner));
      } else if (value !== undefined) {
        cells.push(textOf(value));
      } else {
        cells.push("");
      }
    }
    rows.push(cells);
  }

  return rows;
}

/** LGD writes integer codes as floats ("509.0"). Normalise to an integer. */
export function asCode(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}
