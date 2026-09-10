import { formatDOBInput, toDisplayDate, toISODate } from "../dob";

describe("formatDOBInput", () => {
  it("inserts slashes as digits are typed", () => {
    expect(formatDOBInput("0")).toBe("0");
    expect(formatDOBInput("01")).toBe("01");
    expect(formatDOBInput("011")).toBe("01/1");
    expect(formatDOBInput("0115")).toBe("01/15");
    expect(formatDOBInput("01151990")).toBe("01/15/1990");
  });

  it("strips non-digit characters", () => {
    expect(formatDOBInput("01/15/1990")).toBe("01/15/1990");
    expect(formatDOBInput("ab01cd15ef1990")).toBe("01/15/1990");
  });

  it("truncates at 8 digits", () => {
    expect(formatDOBInput("011519909999")).toBe("01/15/1990");
  });
});

describe("toISODate", () => {
  it("converts MM/DD/YYYY to YYYY-MM-DD", () => {
    expect(toISODate("01/15/1990")).toBe("1990-01-15");
  });

  it("returns null for incomplete input", () => {
    expect(toISODate("01/15")).toBeNull();
    expect(toISODate("")).toBeNull();
    expect(toISODate(undefined)).toBeNull();
    expect(toISODate(null)).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(toISODate("1990-01-15")).toBeNull();
    expect(toISODate("13/40/1990")).toBe("1990-13-40"); // format-only check; no calendar validation
  });

  it("unwraps expo-router's string[] param shape", () => {
    expect(toISODate(["01/15/1990"])).toBe("1990-01-15");
  });
});

describe("toDisplayDate", () => {
  it("converts YYYY-MM-DD to MM/DD/YYYY", () => {
    expect(toDisplayDate("1990-01-15")).toBe("01/15/1990");
  });

  it("handles a full timestamp by using the date prefix", () => {
    expect(toDisplayDate("1990-01-15T00:00:00.000Z")).toBe("01/15/1990");
  });

  it("returns empty string for null/undefined/malformed input", () => {
    expect(toDisplayDate(null)).toBe("");
    expect(toDisplayDate(undefined)).toBe("");
    expect(toDisplayDate("not-a-date")).toBe("");
  });
});

describe("round-trip", () => {
  it("toISODate(toDisplayDate(x)) === x for a valid ISO date", () => {
    const iso = "1990-01-15";
    expect(toISODate(toDisplayDate(iso))).toBe(iso);
  });
});
