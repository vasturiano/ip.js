import JSBI from 'jsbi';
import { numOperations } from './polyBigInt';

export type polyNum = number | JSBI;

declare class Addr {
  constructor(ip: Addr | number | JSBI | string, isV4?: boolean);

  num: polyNum;
  isV4: boolean;
  op: numOperations;

  version(): 4 | 6;
  isIPv4(): boolean;

  toString(): string;
  toNum(): polyNum;
  toBin(): string;

  addIp(another: Addr): Addr;
  subIp(another: Addr): Addr;

  compare2Ip(another: Addr): -1 | 0 | 1 | null;
}

export default Addr;
