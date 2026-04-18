import { encryptSnapshot, decryptSnapshot, isEncrypted } from "./encrypt";

const PASSPHRASE = "supersecret";
const SAMPLE = JSON.stringify({ NODE_ENV: "production", API_KEY: "abc123" });

describe("encryptSnapshot", () => {
  it("returns a base64 string different from input", () => {
    const enc = encryptSnapshot(SAMPLE, PASSPHRASE);
    expect(enc).not.toBe(SAMPLE);
    expect(() => Buffer.from(enc, "base64")).not.toThrow();
  });

  it("produces different ciphertext each call (random IV)", () => {
    const a = encryptSnapshot(SAMPLE, PASSPHRASE);
    const b = encryptSnapshot(SAMPLE, PASSPHRASE);
    expect(a).not.toBe(b);
  });
});

describe("decryptSnapshot", () => {
  it("round-trips correctly", () => {
    const enc = encryptSnapshot(SAMPLE, PASSPHRASE);
    const dec = decryptSnapshot(enc, PASSPHRASE);
    expect(dec).toBe(SAMPLE);
  });

  it("throws on wrong passphrase", () => {
    const enc = encryptSnapshot(SAMPLE, PASSPHRASE);
    expect(() => decryptSnapshot(enc, "wrongpass")).toThrow();
  });
});

describe("isEncrypted", () => {
  it("returns true for encrypted payload", () => {
    const enc = encryptSnapshot(SAMPLE, PASSPHRASE);
    expect(isEncrypted(enc)).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(isEncrypted("NODE_ENV=production")).toBe(false);
  });
});
