import { describe, expect, it } from "vitest";
import {
  displayValue,
  escapeCsvCell,
  formatMoney,
  humanize,
} from "@shared/core/format";

describe("financial formatting", () => {
  it("groups decimal strings without converting them to floating point", () => {
    expect(formatMoney("9007199254740993.120000", "afn")).toBe(
      "9,007,199,254,740,993.12 AFN",
    );
    expect(formatMoney("-12", "USD")).toBe("-12.00 USD");
  });

  it("keeps shared labels and empty values readable", () => {
    expect(humanize("created_at")).toBe("Created At");
    expect(displayValue(undefined)).toBe("—");
  });

  it("neutralizes spreadsheet formulas in CSV exports", () => {
    expect(escapeCsvCell('=HYPERLINK("https://example.test")')).toBe(
      '"\'=HYPERLINK(""https://example.test"")"',
    );
  });
});
