import JSBI from 'jsbi';

interface bigIntOperations {
  // constructor
  num(from: number|string|boolean|object): JSBI;

  // converters
  toNum(n: JSBI): number;
  toBigInt(n: JSBI): JSBI;
  toString(n: JSBI, radix?: number): string;

  // arithmetic
  add(a: JSBI, b: JSBI): JSBI;
  sub(a: JSBI, b: JSBI): JSBI;
  mult(a: JSBI, b: JSBI): JSBI;
  div(a: JSBI, b: JSBI): JSBI;
  rem(a: JSBI, b: JSBI): JSBI;
  exp(a: JSBI, b: JSBI): JSBI;
  neg(n: JSBI): JSBI;

  // inc / dec
  inc(n: JSBI): JSBI;
  dec(n: JSBI): JSBI;

  // bit operators
  bitNeg(n: JSBI): JSBI;
  bitAnd(a: JSBI, b: JSBI): JSBI;
  bitOr(a: JSBI, b: JSBI): JSBI;
  bitXor(a: JSBI, b: JSBI): JSBI;
  shiftLeft(n: JSBI, bits: JSBI): JSBI;
  shiftRight(n: JSBI, bits: JSBI): JSBI;

  // comparison
  eq(a: JSBI, b: JSBI): boolean;
  lt(a: JSBI, b: JSBI): boolean;
  leq(a: JSBI, b: JSBI): boolean;
  gt(a: JSBI, b: JSBI): boolean;
  geq(a: JSBI, b: JSBI): boolean;
}

interface regIntOperations {
  // constructor
  num(number): number;

  // converters
  toNum(n: number): number;
  toBigInt(n: number): JSBI;
  toString(n: number, radix?: number): string;

  // arithmetic
  add(a: number, b: number): number;
  sub(a: number, b: number): number;
  mult(a: number, b: number): number;
  div(a: number, b: number): number;
  rem(a: number, b: number): number;
  exp(a: number, b: number): number;
  neg(n: number): number;

  // inc / dec
  inc(n: number): number;
  dec(n: number): number;

  // bit operators
  bitNeg(n: number): number;
  bitAnd(a: number, b: number): number;
  bitOr(a: number, b: number): number;
  bitXor(a: number, b: number): number;
  shiftLeft(n: number, bits: number): number;
  shiftRight(n: number, bits: number): number;

  // comparison
  eq(a: number, b: number): boolean;
  lt(a: number, b: number): boolean;
  leq(a: number, b: number): boolean;
  gt(a: number, b: number): boolean;
  geq(a: number, b: number): boolean;
}

export type numOperations = regIntOperations | bigIntOperations;

export declare function isBigInt(n: any) : boolean;

export default function polyBigInt(useBigInt?: boolean): numOperations;
