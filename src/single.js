import PolyBigInt, { isBigInt } from './polyBigInt';

const numOp = PolyBigInt(false);
const bigintOp = PolyBigInt(true);

class Addr {
  constructor(ip, isV4) {
    const deriveFamily = isV4 === undefined;
    !deriveFamily && (this.isV4 = !!isV4);

    if (ip instanceof Addr) {
      deriveFamily && (this.isV4 = ip.isIPv4());
      this.num = ip.toNum();

    } else if (typeof ip === 'number') {
      deriveFamily && (this.isV4 = ip < Math.pow(2, 32));
      this.num = ip;

    } else if (isBigInt(ip)) {
      deriveFamily && (this.isV4 = bigintOp.lt(ip, Math.pow(2, 32)));
      this.num = ip;

    } else {
      // Parse as string
      const isV4 = ip.indexOf(':') === -1;

      const op = isV4 ? numOp : bigintOp;
      // use bigint to parse strings
      let num = op.num(0);
      let exp = isV4 ? 32 - 8 : 128 - 16;
      const numFinalSegments = isV4 ? 0 : (ip.split('::')[1] || '').split(':').length;
      ip.split(isV4 ? '.' : ':').forEach(seg => {
        if (!seg.length) {
          return exp = (numFinalSegments - 1) * (isV4 ? 4 : 16);
        }
        const segNum = parseInt(seg, isV4 ? 10 : 16);
        if (isNaN(segNum)) {
          throw new Error(`Unable to parse address portion "${seg}" from ${ip}`);
        }
        num = op.add(num, op.mult(op.num(segNum), op.num(Math.pow(2, exp))));
        exp -= isV4 ? 8 : 16;
      });

      deriveFamily && (this.isV4 = isV4);
      this.num = num;
    }

    this.op = this.isV4 ? numOp : bigintOp; // use big int operations for IPv6

    // ensure num is of same type as operations
    this.num = (isBigInt(this.num) ? bigintOp : numOp)[this.isV4 ? 'toNum' : 'toBigInt'](this.num);
  }

  version = () => this.isV4 ? 4 : 6;
  isIPv4 = () => this.isV4;

  toString() {
    const op = this.op;

    const segLen = op.num(Math.pow(2, this.isV4 ? 8 : 16));

    let num = this.num;
    // let str = (num%segLen).toString(this.isV4 ? 10 : 16);
    let str = op.toString(op.rem(num, segLen), this.isV4 ? 10 : 16);
    for (let i=1; i < (this.isV4 ? 4 : 8); i++) {
      num = op.div(num, segLen);
      str = `${op.toString(op.rem(num, segLen), this.isV4 ? 10 : 16)}${this.isV4 ? '.' : ':'}${str}`;
    }

    return this.isV4 ? str : compressV6(str);

    //

    function compressV6(addrStr) {
      const chunks = addrStr.split(/:/);

      let out = '';
      for (let i=0; i < chunks.length; i++) {
        let chunk = chunks[i].replace(/^0+/,'');
        if (!chunk) chunk = 0;
        out += `${chunk}:`;
      }

      out = out.replace(/(:0)+/,':');
      out = out.replace(/^0/,'');
      out = out.replace(/:0$/,':');
      out = out.substr(0, out.length-1);

      if (!out.match(/::/))
        if (out.match(/:$/))
          out += ':';

      return out;
    }
  }

  toNum = () => this.num;

  // Returns a string with the binary representation of the IP (v4: 32 bits long, v6: 128 bits long)
  toBin() {
    let bin = this.op.toString(this.num, 2);

    // Pad with 0s
    while (bin.length < (this.isV4 ? 32 : 128))
      bin = `0${bin}`;

    return bin;
  }

  addIp = another => new Addr(this.op.add(this.toNum(), another.toNum()));
  subIp = another => new Addr(this.op.sub(this.toNum(), another.toNum()));

  // Return value: -1: this<that, 0: this=that, 1: this>that, null: different families
  compare2ip(that) {
    const op = this.op;

    if (this.version() !== that.version())
      return null;

    return compareNums(this.toNum(), that.toNum());

    function compareNums(numa, numb) {
      return op.eq(numa, numb)
        ? 0
        : op.lt(numa, numb)
          ? -1
          : 1;
    }
  }

}

export default Addr;
