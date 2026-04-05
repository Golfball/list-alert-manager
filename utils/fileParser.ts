import { readAsStringAsync } from "expo-file-system";
import { read as xlsxRead, utils as xlsxUtils } from "@e965/xlsx";

function parseTxt(content: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      items.push(trimmed);
    }
  }
  return items;
}

function parseCsv(content: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  let isFirstRow = true;
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const firstCell = extractFirstCsvCell(trimmed);
    if (!firstCell) continue;
    if (isFirstRow) {
      isFirstRow = false;
      const lower = firstCell.toLowerCase();
      if (
        lower === "address" ||
        lower === "name" ||
        lower === "item" ||
        lower === "keyword" ||
        lower === "text" ||
        lower === "value"
      ) {
        continue;
      }
    }
    const key = firstCell.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      items.push(firstCell);
    }
  }
  return items;
}

function extractFirstCsvCell(line: string): string {
  if (line.startsWith('"') || line.startsWith("'")) {
    const quote = line[0];
    const end = line.indexOf(quote, 1);
    if (end !== -1) {
      return line.slice(1, end).trim();
    }
  }
  return line.split(",")[0].trim();
}

function parseXlsx(base64: string): string[] {
  const workbook = xlsxRead(base64, { type: "base64" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsxUtils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });

  const seen = new Set<string>();
  const items: string[] = [];
  let firstRow = true;
  for (const row of rows) {
    const cell = Array.isArray(row) ? String(row[0] ?? "").trim() : "";
    if (!cell) continue;
    if (firstRow) {
      firstRow = false;
      const lower = cell.toLowerCase();
      if (
        lower === "address" ||
        lower === "name" ||
        lower === "item" ||
        lower === "keyword" ||
        lower === "text" ||
        lower === "value"
      ) {
        continue;
      }
    }
    const key = cell.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      items.push(cell);
    }
  }
  return items;
}

function looksLikeCsvContent(content: string): boolean {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;
  const sample = lines.slice(0, Math.min(lines.length, 20));
  const withComma = sample.filter((l) => l.includes(",")).length;
  return withComma / sample.length >= 0.5;
}

export async function parseFile(
  uri: string,
  mimeType: string,
  name: string
): Promise<string[]> {
  const lowerName = name.toLowerCase();

  const isExcel =
    lowerName.endsWith(".xls") ||
    lowerName.endsWith(".xlsx") ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const isCsvByDeclaration =
    !isExcel &&
    (lowerName.endsWith(".csv") || mimeType === "text/csv");

  if (isExcel) {
    const base64 = await readAsStringAsync(uri, { encoding: "base64" as const });
    return parseXlsx(base64);
  }

  const content = await readAsStringAsync(uri, { encoding: "utf8" as const });

  const isCsv = isCsvByDeclaration || looksLikeCsvContent(content);

  if (isCsv) {
    return parseCsv(content);
  }

  return parseTxt(content);
}
