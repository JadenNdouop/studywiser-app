import { formatPhoneInput } from "../phone";

describe("formatPhoneInput", () => {
  it("builds up the mask as digits are typed", () => {
    expect(formatPhoneInput("5")).toBe("(5");
    expect(formatPhoneInput("555")).toBe("(555");
    expect(formatPhoneInput("5551")).toBe("(555) 1");
    expect(formatPhoneInput("555123")).toBe("(555) 123");
    expect(formatPhoneInput("5551234")).toBe("(555) 123-4");
    expect(formatPhoneInput("5551234567")).toBe("(555) 123-4567");
  });

  it("strips non-digit characters before formatting", () => {
    expect(formatPhoneInput("(555) 123-4567")).toBe("(555) 123-4567");
    expect(formatPhoneInput("555.123.4567")).toBe("(555) 123-4567");
  });

  it("truncates at 10 digits", () => {
    expect(formatPhoneInput("55512345679999")).toBe("(555) 123-4567");
  });

  it("returns an empty string for no digits", () => {
    expect(formatPhoneInput("")).toBe("");
    expect(formatPhoneInput("abc")).toBe("");
  });
});
