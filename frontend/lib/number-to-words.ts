const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}

function threeDigits(n: number): string {
  if (n >= 100) {
    const rest = n % 100;
    return `${ONES[Math.floor(n / 100)]} Hundred${rest ? " " + twoDigits(rest) : ""}`;
  }
  return twoDigits(n);
}

/** Converts an integer (Indian numbering: crore/lakh/thousand) to words. */
function integerToWords(num: number): string {
  if (num === 0) return "Zero";
  let n = num;
  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  return parts.join(" ").trim();
}

/** e.g. 841.20 -> "Eight Hundred Forty One Rupees and Twenty Paise Only" */
export function amountInWords(amount: number): string {
  const safe = Math.max(0, amount || 0);
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);

  const rupeeWords = `${integerToWords(rupees)} Rupee${rupees === 1 ? "" : "s"}`;
  if (paise > 0) {
    return `${rupeeWords} and ${integerToWords(paise)} Paise Only`;
  }
  return `${rupeeWords} Only`;
}
