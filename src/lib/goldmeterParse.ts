import * as cheerio from "cheerio";

export const GOLDMETER_AHMEDABAD_URL =
  "https://goldmeter.in/gold-rate/ahmedabad";

export type GoldmeterTableRow = {
  metal: string;
  purity: string;
  perGram: number;
  per8g: number;
  per10g: number;
};

/** Only the Ahmedabad rates table + 1 kg silver (for reference compare). */
export type GoldmeterReference = {
  table: GoldmeterTableRow[];
  silver1kg: number;
};

function parseRupee(text: string): number {
  const n = Number(text.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Parse only the main rates table from goldmeter.in HTML. */
export function parseGoldmeterHtml(rawHtml: string): GoldmeterReference {
  const html = rawHtml.replace(/<!--\s*-->/g, "");
  const $ = cheerio.load(html);
  const table: GoldmeterTableRow[] = [];

  $("table tbody tr").each((_, row) => {
    if (table.length >= 4) return;

    const cells = $(row)
      .find("td")
      .map((__, cell) => $(cell).text().trim())
      .get();

    if (cells.length < 5) return;

    const perGram = parseRupee(cells[2]);
    if (!perGram) return;

    const metal = cells[0];
    if (!/gold|silver/i.test(metal)) return;

    table.push({
      metal,
      purity: cells[1],
      perGram,
      per8g: parseRupee(cells[3]),
      per10g: parseRupee(cells[4]),
    });
  });

  if (table.length < 4) {
    throw new Error("Could not find rate table on GoldMeter page");
  }

  const silverRow = table.find((r) => r.metal.toLowerCase().includes("silver"));
  const silver1kg =
    silverRow && silverRow.perGram > 0
      ? Math.round(silverRow.perGram * 1000)
      : silverRow && silverRow.per10g > 0
        ? Math.round(silverRow.per10g * 100)
        : 0;

  if (!silver1kg) {
    throw new Error("Could not read silver rate from GoldMeter table");
  }

  return { table, silver1kg };
}
