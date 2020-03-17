import JSBI from 'jsbi';

import { numOperations } from './polyBigInt';
import Addr, { polyNum } from './single';

type inputIp = Addr | number | JSBI | string;

declare class Prefix {
  constructor(ip: inputIp, cidr: number, isV4?: boolean);
  constructor(prefix: string, cidr?: undefined, isV4?: boolean);

  ip: Addr;
  cidr: number;
  op: numOperations;

  isIPv4(): boolean;
  toString(): string;

  countIps(): polyNum;
  getCidr(): number;
  firstIp(): Addr;
  lastIp(): Addr;

  toRange(): Range;

  correctBitBoundary(): Prefix;
  slice(cidr: number): Prefix[];
}

declare class Range {
  constructor(firstIp: inputIp, lastIp: inputIp, isV4?: boolean);

  start: Addr;
  end: Addr;
  op: numOperations;

  isIPv4(): boolean;
  toString(): string;

  countIps(): polyNum;
  getCidr(): number;
  firstIp(): Addr;
  lastIp(): Addr;

  cidrCount(): number;
  toPrefixes(): Prefix[];
  toEncompassingPrefix(): Prefix;

  ipRelPosition(ip: Addr, after?: boolean): number;
  ipAtPerc(perc: number): Addr;
  overlapPerc(another: Range): number;

  getNeighborPrefixes(): { up: Prefix, left: Prefix, right: Prefix, downleft: Prefix, downright: Prefix };
}


export { Prefix, Range };
