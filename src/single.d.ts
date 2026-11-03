export type polyNum = number | bigint;

declare class Addr {
  constructor(ip: Addr | number | bigint | string, isV4?: boolean);

  num: polyNum;
  isV4: boolean;

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
