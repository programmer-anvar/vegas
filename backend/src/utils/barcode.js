import crypto from 'node:crypto';

export const ean13CheckDigit = (first12) => {
  const sum = [...first12].reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
};

export const generateBarcode = () => {
  const body = `20${String(crypto.randomInt(0, 10 ** 10)).padStart(10, '0')}`;
  return body + ean13CheckDigit(body);
};
