import Addr from './single';

class Prefix {
  constructor(ipPrefix, cidr) {
    if (cidr !== undefined) {
      this.ip = new Addr(ipPrefix);
      this.cidr = cidr;
    } else {
      // Parse as string
      const prefix = ipPrefix.split('/');
      this.ip = new Addr(prefix[0]);
      this.cidr = +prefix[1];
    }
  }

  isIPv4 = () => this.ip.isIPv4();

  toString = () => `${this.ip.toString()}/${this.cidr}`;

  countIps() {
    return Math.pow(2, (this.isIPv4() ? 32 : 128) - this.cidr);
  }

  // Returns object of first IP in the prefix
  firstIp = () => this.ip;

  // Returns object of last IP in the prefix
  lastIp = () => new Addr(this.ip.toNum() + this.countIps() - 1);

  toRange = () => new Range(this.firstIp(), this.lastIp());

  // Return a valid prefix by setting the correct start IP that fits this prefix length
  correctBitBoundary() {
    let bin = this.ip.toBin();
    const strSize = bin.length;

    bin = bin.slice(0, this.cidr);
    while (bin.length < strSize)
      bin += '0';

    return new Prefix(new Addr(parseInt(bin, 2)), this.cidr);
  }

  // Slice the prefix into an array of smaller prefixes of a specified CIDR size
  slice(cidr) {
    if (this.cidr >= cidr)
      return [this];

    const oneIP = new Addr(1);
    const slices = [];

    let runningIp = this.ip;

    for (let i = 0, len = Math.pow(2, cidr - this.cidr); i < len; i++) {
      const slice = new Prefix(runningIp, cidr);
      slices.push(slice);
      runningIp = runningIp.addIp(slice.lastIp().addIp(oneIP));
    }

    return slices;
  }
}

// ********************* //

class Range {
  constructor(firstIp, lastIp) {
    this.start = new Addr(firstIp);
    this.end = new Addr(lastIp);
  }

  isIPv4 = () => this.start.isIPv4();

  toString = () => `${this.start.toString()} - ${this.end.toString()}`;

  countIps = () => this.end.toNum() - this.start.toNum() + 1;

  // Returns first IP in the range
  firstIp = () => this.start;

  // Returns last IP in the range
  lastIp = () => this.end;

  cidrCount() {
    return (this.isIPv4() ? 32 : 128) - Math.log(this.countIps()) / Math.log(2);
  }

  toPrefixes() {
    const endIp = this.end;
    const topCidr = Math.ceil(this.cidrCount());

    const zeroIP = new Addr(0);
    const oneIP = new Addr(1);

    const prefixes = [];

    let sweepIp = this.start;

    while (sweepIp.compare2Ip(endIp) < 0) {
      let cidr = topCidr;
      let prefix = new Prefix(sweepIp, cidr);

      while (prefix.correctBitBoundary().firstIp().compare2Ip(sweepIp) !== 0 || prefix.lastIp().compare2Ip(endIp) > 0) {
        cidr++;
        prefix = new Prefix(sweepIp, cidr);
      }

      prefixes.push(prefix);
      sweepIp = prefix.lastIp().addIp(oneIP);

      if (sweepIp.compare2Ip(zeroIP) === 0) // Counter flipped back to start
        break;
    }

    return prefixes;
  }

  toEncompassingPrefix() {
    const startIp = this.start;
    const endIp = this.end;

    let cidr = Math.floor(this.cidrCount());
    let prefix = (new Prefix(startIp, cidr)).correctBitBoundary();

    while (prefix.lastIp().compare2Ip(endIp) < 0) {
      cidr--;
      prefix = (new Prefix(startIp, cidr)).correctBitBoundary();
    }

    return prefix;
  }

  // Returns the percentual value (0 to 1) of what is the relative position of ip within the specified range
  // Values of <0 or >1 are possible if IP is outside of the range
  // False indicates if the value should be calculated for right before the IP address(false) or right after(true)
  // Returns null if IP and range are not of the same family
  ipRelPosition(ip, after) {
    if (!after) after = false;

    if (ip.isIPv4() !== this.isIPv4())
      return null; // Different IP families

    const ipnum = ip.toNum();
    const first = this.start.toNum();
    const last = this.end.toNum();

    return percentVal(ipnum + (after ? 1 : 0), first, last);

    function percentVal(pos, start, end) {
      return (pos - start) / (end + 1 - start);
    }
  }

  // Returns the ip that is at the percentual position of the range
  ipAtPerc(perc) {
    return new Addr(numPercentValue(perc, this.start.toNum(), this.end.toNum() + 1));

    function numPercentValue(perc, start, end) {
      return start + Math.round((end - start) * (perc / 100));
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
      neighbors.up = new Prefix(this.firstIp(), upCidr).correctBitBoundary();
    }

    const sideCidr = Math.ceil(cidrSize);
    const oneIp = new Addr(1);
    if (!leftmost)
      neighbors.left = new Prefix(this.firstIp().subIp(oneIp), sideCidr).correctBitBoundary();
    if (!rightmost)
      neighbors.right = new Prefix(this.lastIp().addIp(oneIp), sideCidr).correctBitBoundary();

    if (!bottom) {
      const downCidr = Math.min((this.isIPv4() ? 32 : 128), Math.floor(cidrSize) + 1);

      neighbors.downleft = new Prefix(this.firstIp(), downCidr).correctBitBoundary();
      neighbors.downright = new Prefix(this.lastIp(), downCidr).correctBitBoundary();
    }

    return neighbors;
  }
}

export { Prefix, Range };
