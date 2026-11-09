export type Money = { amount: string; currencyCode: string };

/** "$38" for whole amounts, "$38.50" otherwise. */
export function formatPrice({ amount, currencyCode }: Money): string {
  const value = Number(amount);
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
