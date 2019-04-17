import JSBI from 'jsbi';

const isBigInt = num => num instanceof JSBI;

function polyBigInt(useBigInt = false) {
  return useBigInt
    ? { // BigInt numbers

      // constructor
      num: JSBI.BigInt,

      // converters
      toNum: JSBI.toNumber,
      toBigInt: bi => bi,
      toString: (num, radix) => num.toString(radix),

      // arithmetic
      add: JSBI.add,
      sub: JSBI.subtract,
      mult: JSBI.multiply,
      div: JSBI.divide,
      rem: JSBI.remainder,
      exp: JSBI.exponentiate,
      neg: JSBI.unaryMinus,

      // inc / dec
      inc: num => JSBI.add(num, JSBI.BigInt(1)),
      dec: num => JSBI.subtract(num, JSBI.BigInt(1)),

      // bit operators
      bitNeg: JSBI.bitwiseNot,
      bitAnd: JSBI.bitwiseAnd,
      bitOr: JSBI.bitwiseOr,
      bitXor: JSBI.bitwiseXor,
      shiftLeft: JSBI.leftShift,
      shiftRight: JSBI.signedRightShift,

      // comparison
      eq: JSBI.equal,
      lt: JSBI.lessThan,
      leq: JSBI.lessThanOrEqual,
      gt: JSBI.greaterThan,
      geq: JSBI.greaterThanOrEqual

    } : { // regular numbers

      // constructor
      num: num => num,

      // converters
      toNum: Number,
      toBigInt: JSBI.BigInt,
      toString: (num, radix) => num.toString(radix),

      // arithmetic
      add: (a, b) => a + b,
      sub: (a, b) => a - b,
      mult: (a, b) => a * b,
      div: (a, b) => Math.floor(a / b),
      rem: (a, b) => a % b,
      exp: (a, b) => a ** b,
      neg: num => -num,

      // inc / dec
      inc: num => num + 1,
      dec: num => num - 1,

      // bit operators
      bitNeg: num => ~num,
      bitAnd: (a, b) => a & b,
      bitOr: (a, b) => a | b,
      bitXor: (a, b) => a ^ b,
      shiftLeft: (num, bits) => num << bits,
      shiftRight: (num, bits) => num >> bits,

      // comparison
      eq: (a, b) => a === b,
      lt: (a, b) => a < b,
      leq: (a, b) => a <= b,
      gt: (a, b) => a > b,
      geq: (a, b) => a >= b
    };
}

export default polyBigInt;
export { isBigInt };
