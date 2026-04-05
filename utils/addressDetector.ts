const STREET_SUFFIXES = [
  "st", "ave", "blvd", "dr", "rd", "ln", "way", "ct", "pl", "cir",
  "hwy", "pkwy", "terr", "ter", "trl", "trail", "loop", "pass", "pike",
  "fwy", "expy", "alley", "aly",
];

const SUFFIX_PATTERN = new RegExp(
  `\\b(${STREET_SUFFIXES.join("|")})\\.?\\b`,
  "i"
);

const LEADING_NUMBER = /^\d+\s+\w/;

const ZIP_CODE = /\b\d{5}(-\d{4})?\b/;

const CITY_STATE = /\b[A-Za-z\s]+,\s*[A-Za-z]{2}\b/;

export function looksLikeAddress(text: string): boolean {
  const t = text.trim();
  if (LEADING_NUMBER.test(t)) return true;
  if (SUFFIX_PATTERN.test(t)) return true;
  if (ZIP_CODE.test(t)) return true;
  if (CITY_STATE.test(t)) return true;
  return false;
}
