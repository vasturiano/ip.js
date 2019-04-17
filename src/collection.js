import Addr from './single';

class Prefix {
  constructor(ipPrefix, cidr, isV4) {
    if (cidr !== undefined) {
      this.ip = new Addr(ipPrefix, isV4);
      this.cidr = cidr;
    } else {
      // Parse as string
      const prefix = ipPrefix.split('/');
      this.ip = new Addr(prefix[0], isV4);
      this.cidr = +prefix[1];
    }
    this.op = this.ip.op;
  }

  isIPv4 = () => this.ip.isIPv4();

  toString = () => `${this.ip.toString()}/${this.cidr}`;

  countIps() {
    const op = this.op;
    return op.exp(op.num(2), op.num((this.isIPv4() ? 32 : 128) - this.cidr));
  }

  // Returns object of first IP in the prefix
  firstIp = () => this.ip;

  // Returns object of last IP in the prefix
  lastIp = () => new Addr(this.op.sub(this.op.add(this.ip.toNum(), this.countIps()), this.op.num(1)), this.isIPv4());

  toRange = () => new Range(this.firstIp(), this.lastIp(), this.isIPv4());

  // Return a valid prefix by setting the correct start IP that fits this prefix length
  correctBitBoundary() {
    const op = this.op;

    const mask = op.sub(op.exp(op.num(2), op.num((this.isIPv4() ? 32 : 128) - this.cidr)), op.num(1));
    const correctedNum = op.bitAnd(this.ip.toNum(), op.bitNeg(mask));

    return new Prefix(new Addr(correctedNum), this.cidr, this.isIPv4());
  }

  // Slice the prefix into an array of smaller prefixes of a specified CIDR size
  slice(cidr) {
    if (this.cidr >= cidr)
      return [this];

    const oneIP = new Addr(1, this.isIPv4());
    const slices = [];

    let runningIp = this.ip;

    for (let i = 0, len = Math.pow(2, cidr - this.cidr); i < len; i++) {
      const slice = new Prefix(runningIp, cidr, this.isIPv4());
      slices.push(slice);
      runningIp = slice.lastIp().addIp(oneIP);
    }

    return slices;
  }
}

// ********************* //

class Range {
  constructor(firstIp, lastIp, isV4) {
    this.start = new Addr(firstIp, isV4);
    this.end = new Addr(lastIp, isV4);

    if (this.start.version() !== this.end.version()) throw new Error(`Range addresses have different families: ${this.start.toString()} - ${this.end.toString()}`);

    this.op = this.start.op;
  }

  isIPv4 = () => this.start.isIPv4();

  toString = () => `${this.start.toString()} - ${this.end.toString()}`;

  countIps = () => this.op.add(this.op.sub(this.end.toNum(), this.start.toNum()), this.op.num(1));

  // Returns first IP in the range
  firstIp = () => this.start;

  // Returns last IP in the range
  lastIp = () => this.end;

  cidrCount() {
    return (this.isIPv4() ? 32 : 128) - Math.log(this.op.toNum(this.countIps())) / Math.log(2);
  }

  toPrefixes() {
    const endIp = this.end;
    const topCidr = Math.ceil(this.cidrCount());

    const zeroIP = new Addr(0, this.isIPv4());
    const oneIP = new Addr(1, this.isIPv4());

    const prefixes = [];

    let sweepIp = this.start;

    while (sweepIp.compare2ip(endIp) <= 0) {
      let cidr = topCidr;
      let prefix = new Prefix(sweepIp, cidr, this.isIPv4());

      while (prefix.correctBitBoundary().firstIp().compare2ip(sweepIp) !== 0 || prefix.lastIp().compare2ip(endIp) > 0) {
        cidr++;
        prefix = new Prefix(sweepIp, cidr, this.isIPv4());
      }

      prefixes.push(prefix);
      sweepIp = prefix.lastIp().addIp(oneIP);

      if (sweepIp.compare2ip(zeroIP) === 0) // Counter flipped back to start
        break;
    }

    return prefixes;
  }

  toEncompassingPrefix() {
    const startIp = this.start;
    const endIp = this.end;

    let cidr = Math.floor(this.cidrCount());
    let prefix = (new Prefix(startIp, cidr, this.isIPv4())).correctBitBoundary();

    while (prefix.lastIp().compare2ip(endIp) < 0) {
      cidr--;
      prefix = (new Prefix(startIp, cidr, this.isIPv4())).correctBitBoundary();
    }

    return prefix;
  }

  // Returns the percentual value (0 to 1) of what is the relative position of ip within the specified range
  // Values of <0 or >1 are possible if IP is outside of the range
  // False indicates if the value should be calculated for right before the IP address(false) or right after(true)
  // Returns null if IP and range are not of the same family
  ipRelPosition(ip, after) {
    const op = this.op;

    if (!after) after = false;

    if (ip.isIPv4() !== this.isIPv4())
      return null; // Different IP families

    const ipnum = ip.toNum();
    const first = this.start.toNum();
    const last = this.end.toNum();

    return percentVal(op.add(ipnum, op.num((after ? 1 : 0))), first, last);

    function percentVal(pos, start, end) {
      return op.toNum(op.sub(pos, start)) / (op.toNum(op.sub(end, start)) + 1);
    }
  }

  // Returns the ip that is at the percentual position of the range
  ipAtPerc(perc) {
    const op = this.op;
    return new Addr(numPercentValue(perc, this.start.toNum(), op.add(this.end.toNum(), op.num(1))), this.isIPv4());

    function numPercentValue(perc, start, end) {
      return op.add(start, op.num(Math.round(op.toNum(op.sub(end, start)) * (perc / 100))));
    }
  }

  // Returns the start and end percentage of overlap between this range and a child range
  // Values <0 or >100 are possible if the ranges only partially overlap or not overlap at all
  // Percentages are relative to the this range
  overlapPerc(childRange) {
    return [
      this.ipRelPosition(childRange.firstIp()) * 100,
      this.ipRelPosition(childRange.lastIp(), true) * 100
    ];
  }

  // Returns the 5 CIDR neighbor prefixes: one CIDR up, two side siblings left and right, first and second half down
  getNeighborPrefixes() {
    const cidrSize = this.cidrCount();

    // Spot the boundaries
    const top = Math.ceil(cidrSize) === 0;
    const bottom = Math.floor(cidrSize) === (this.isIPv4() ? 32 : 128);
    const leftmost = this.firstIp().toBin().indexOf('1') === -1;
    const rightmost = this.lastIp().toBin().indexOf('0') === -1;

    const neighbors = {
      up: null,
      left: null,
      right: null,
      downleft: null,
      downright: null
    };

    if (!top) {
      const upCidr = Math.ceil(cidrSize) - 1;
      neighbors.up = new Prefix(this.firstIp(), upCidr, this.isIPv4()).correctBitBoundary();
    }

    const sideCidr = Math.ceil(cidrSize);
    const oneIp = new Addr(1, this.isIPv4());
    if (!leftmost)
      neighbors.left = new Prefix(this.firstIp().subIp(oneIp), sideCidr, this.isIPv4()).correctBitBoundary();
    if (!rightmost)
      neighbors.right = new Prefix(this.lastIp().addIp(oneIp), sideCidr, this.isIPv4()).correctBitBoundary();

    if (!bottom) {
      const downCidr = Math.min((this.isIPv4() ? 32 : 128), Math.floor(cidrSize) + 1);

      neighbors.downleft = new Prefix(this.firstIp(), downCidr, this.isIPv4()).correctBitBoundary();
      neighbors.downright = new Prefix(this.lastIp(), downCidr, this.isIPv4()).correctBitBoundary();
    }

    return neighbors;
  }
}

export { Prefix, Range };
