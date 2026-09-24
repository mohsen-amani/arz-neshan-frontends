export function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime()))
      return new Intl.DateTimeFormat("en-AF", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
  }
  return text;
}

export function formatMoney(value: unknown, currency?: unknown): string {
  const raw = String(value ?? "").trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match) return displayValue(value);
  const [, sign, integer, fraction = ""] = match;
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const normalizedFraction = fraction.replace(/0+$/, "");
  const decimals = normalizedFraction
    ? `.${normalizedFraction.padEnd(2, "0")}`
    : ".00";
  const code = String(currency ?? "")
    .trim()
    .toUpperCase();
  return `${sign}${grouped}${decimals}${code ? ` ${code}` : ""}`;
}

export function escapeCsvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
