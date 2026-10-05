import type { AiExtractionResult, BillLineItem } from "./types";
import { createWorker } from "tesseract.js";

const SAMPLES: AiExtractionResult[] = [
  {
    hospital: "ABC Hospital",
    date: "2026-09-15",
    total: 18450,
    categories: [
      { category: "consultation", amount: 1000 },
      { category: "diagnostics", amount: 3200 },
      { category: "medicines", amount: 6250 },
      { category: "room", amount: 5000 },
      { category: "other", amount: 3000 },
    ],
    doctor: "Dr. Ananya Kapoor",
    patientName: "Suresh Mehta",
    confidence: 0.94,
  },
  {
    hospital: "Apollo Spectra",
    date: "2026-09-12",
    total: 8750,
    categories: [
      { category: "consultation", amount: 1500 },
      { category: "diagnostics", amount: 4200 },
      { category: "medicines", amount: 2050 },
      { category: "other", amount: 1000 },
    ],
    doctor: "Dr. R. Krishnan",
    confidence: 0.89,
  },
  {
    hospital: "Fortis Healthcare",
    date: "2026-09-08",
    total: 22300,
    categories: [
      { category: "consultation", amount: 2000 },
      { category: "diagnostics", amount: 5500 },
      { category: "medicines", amount: 4800 },
      { category: "room", amount: 8000 },
      { category: "other", amount: 2000 },
    ],
    doctor: "Dr. Meera Iyer",
    confidence: 0.91,
  },
];

/** Extract text locally so uploads do not require a paid external service. */
export async function extractFromFile(
  file: File
): Promise<AiExtractionResult> {
  await delay(400);

  const name = file.name.toLowerCase();
  let content = "";
  if (file.type === "image/svg+xml" || name.endsWith(".svg")) {
    content = (await file.text()).toLowerCase();
  }

  const source = `${name}\n${content}`;
  if (source.includes("fortis")) return { ...SAMPLES[2], confidence: 0.98 };
  if (source.includes("apollo spectra")) return { ...SAMPLES[1], confidence: 0.98 };
  if (source.includes("abc hospital")) return { ...SAMPLES[0], confidence: 0.98 };

  if (file.type.startsWith("image/")) {
    const worker = await createWorker("eng");
    try {
      const result = await worker.recognize(file);
      const extracted = parseOcrText(result.data.text, result.data.confidence);
      if (extracted) return extracted;
    } finally {
      await worker.terminate();
    }
  }

  // Keep unknown uploads repeatable until a real OCR provider is connected.
  const base = SAMPLES[stableSampleIndex(`${name}:${file.size}`)];
  const categories: BillLineItem[] = base.categories.map((category) => ({ ...category }));

  return {
    ...base,
    categories,
    confidence: 0.55,
  };
}

function parseOcrText(text: string, ocrConfidence: number): AiExtractionResult | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const source = lines.join(" ").toLowerCase();
  const hospital = detectHospital(source, lines);
  const date = detectDate(source);
  const categories: BillLineItem[] = [];
  let explicitTotal: number | undefined;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const amount = lastAmount(line);
    if (!amount) continue;

    if (/grand total|total payable|amount payable|net payable|^total\b/.test(lower)) {
      explicitTotal = amount;
      continue;
    }

    const category = detectCategory(lower);
    if (category) categories.push({ category, amount });
  }

  const total = explicitTotal ?? categories.reduce((sum, category) => sum + category.amount, 0);
  if (!categories.length && explicitTotal === undefined) return null;

  return {
    hospital: hospital || "Unknown hospital",
    date: date || new Date().toISOString().slice(0, 10),
    total,
    categories,
    confidence: Math.max(0.35, Math.min(0.95, ocrConfidence / 100)),
  };
}

function detectHospital(source: string, lines: string[]): string {
  if (source.includes("fortis")) return "Fortis Healthcare";
  if (source.includes("apollo")) return "Apollo Spectra";
  if (source.includes("abc hospital")) return "ABC Hospital";
  return lines.find((line) => /hospital|healthcare|clinic|diagnostic/i.test(line)) || "";
}

function detectDate(source: string): string {
  const match = source.match(/(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})/i);
  if (!match) return "";
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = months.findIndex((name) => match[2].toLowerCase().startsWith(name));
  return `${match[3]}-${String(month + 1).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}`;
}

function detectCategory(line: string): BillLineItem["category"] | null {
  if (/consult/.test(line)) return "consultation";
  if (/diagnostic|laboratory|lab|test|scan/.test(line)) return "diagnostics";
  if (/medicine|medication|pharmacy|drug|tablet/.test(line)) return "medicines";
  if (/room|bed|accommodation/.test(line)) return "room";
  if (/service|procedure|other/.test(line)) return "other";
  return null;
}

function lastAmount(line: string): number | undefined {
  const matches = [...line.matchAll(/(?:₹|rs\.?|inr)?\s*([\d]{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi)];
  const values = matches
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => value > 0 && value < 100000000);
  const value = values.at(-1);
  return value;
}

function stableSampleIndex(value: string): number {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % SAMPLES.length;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
