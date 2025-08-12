export const cents = (amount: number) => Math.round(amount * 100);
export const dollars = (centsVal: number) => Number((centsVal / 100).toFixed(2));

