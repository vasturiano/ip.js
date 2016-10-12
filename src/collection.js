var Addr = require('./single');

// *******************//

var Prefix = function(ipPrefix, cidr) {
    if (cidr !== undefined) {
        this.ip = new Addr(ipPrefix);
        this.cidr = cidr;
    } else {
        // Parse as string
        var prefix = ipPrefix.split('/');
        this.ip = new Addr(prefix[0]);
        this.cidr = +prefix[1];
    }
};

Prefix.prototype.isIPv4 = function() {
    return this.ip.isIPv4();
};

Prefix.prototype.toString = function() {
    return this.ip.toString() + '/' + this.cidr;
};

Prefix.prototype.countIps = function() {
    return Math.pow(2, (this.isIPv4()?32:128)-this.cidr);
};

// Returns object of first IP in the prefix
Prefix.prototype.firstIp = function() {
    return this.ip;
};

// Returns object of last IP in the prefix
Prefix.prototype.lastIp = function() {
    return new Addr(this.ip.toNum() + this.countIps() - 1);
};

Prefix.prototype.toRange = function() {
    return new Range(this.firstIp(), this.lastIp());
};

// Return a valid prefix by setting the correct start IP that fits this prefix length
Prefix.prototype.correctBitBoundary = function() {
    var bin = this.ip.toBin(),
        strSize = bin.length;

    bin = bin.slice(0, this.cidr);
    while (bin.length < strSize)
        bin += '0';

    return new Prefix(new Addr(parseInt(bin, 2)), this.cidr);
};

// Slice the prefix into an array of smaller prefixes of a specified CIDR size
Prefix.prototype.slice = function(cidr) {
    if (this.cidr >= cidr)
        return [this];

    var oneIP = new Addr(1);
    var slices = [];
    var runningIp = this.ip;

    for (var i = 0, len = Math.pow(2, cidr - this.cidr); i < len; i++) {
        var slice = new Prefix(runningIp, cidr);
        slices.push(slice);
        runningIp = runningIp.addIp(slice.lastIp().addIp(oneIP));
    }

    return slices;
};

// ********************* //

var Range = function(firstIp, lastIp) {
    this.start = new Addr(firstIp);
    this.end = new Addr(lastIp);
};

Range.prototype.isIPv4 = function() {
    return this.start.isIPv4();
};

Range.prototype.toString = function() {
    return this.start.toString() + ' - ' + this.end.toString();
};

Range.prototype.countIps = function() {
    return this.end.toNum() - this.start.toNum() + 1;
};

// Returns first IP in the range
Range.prototype.firstIp = function() {
    return this.start;
};

// Returns last IP in the range
Range.prototype.lastIp = function() {
    return this.end;
};

Range.prototype.cidrCount = function() {
    return (this.isIPv4()?32:128)-(Math.log(this.countIps())/Math.log(2));
};

Range.prototype.toPrefixes = function() {

    var sweepIp = this.start,
        endIp = this.end,
        topCidr = Math.ceil(this.cidrCount());

    var zeroIP = new Addr(0);
    var oneIP = new Addr(1);

    var prefixes = [];

    while (sweepIp.compare2Ip(endIp) < 0) {
        var cidr = topCidr,
            prefix = new Prefix(sweepIp, cidr);

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
};

Range.prototype.toEncompassingPrefix = function() {
    var startIp = this.start,
        endIp = this.end,
        cidr = Math.floor(this.cidrCount()),
        prefix = (new Prefix(startIp, cidr)).correctBitBoundary();

    while (prefix.lastIp().compare2Ip(endIp) < 0) {
        cidr--;
        prefix = (new Prefix(startIp, cidr)).correctBitBoundary();
    }

    return prefix;
};

// Returns the percentual value (0 to 1) of what is the relative position of ip within the specified range
// Values of <0 or >1 are possible if IP is outside of the range
// False indicates if the value should be calculated for right before the IP address(false) or right after(true)
// Returns null if IP and range are not of the same family
Range.prototype.ipRelPosition = function(ip, after) {

    if (!after)
        after = false;

    if (ip.isIPv4() !== this.isIPv4())
        return null; // Different IP families

    var ipnum = ip.toNum(),
        first = this.start.toNum(),
        last = this.end.toNum();

    return percentVal(ipnum + (after ? 1 : 0), first, last);

    function percentVal(pos, start, end) {
        return (pos - start) / (end + 1 - start);
    }
};

// Returns the ip that is at the percentual position of the range
Range.prototype.ipAtPerc = function(perc) {
    return new Addr(numPercentValue(perc, this.start.toNum(), this.end.toNum() + 1));

    function numPercentValue(perc, start, end) {
        return start + Math.round((end - start) * (perc / 100));
    }
};

// Returns the start and end percentage of overlap between this range and a child range
// Values <0 or >100 are possible if the ranges only partially overlap or not overlap at all
// Percentages are relative to the this range
Range.prototype.overlapPerc = function(childRange) {
    return [
        this.ipRelPosition(childRange.firstIp()) * 100,
        this.ipRelPosition(childRange.lastIp(), true) * 100
    ];
};

// Returns the 5 CIDR neighbor prefixes: one CIDR up, two side siblings left and right, first and second half down
Range.prototype.getNeighborPrefixes = function() {
    var cidrSize = this.cidrCount();

    // Spot the boundaries
    var top = (Math.ceil(cidrSize) === 0);
    var bottom = (Math.floor(cidrSize) == (this.isIPv4() ? 32 : 128));
    var leftmost = this.firstIp().toBin().indexOf('1') === -1;
    var rightmost = this.lastIp().toBin().indexOf('0') === -1;

    var neighbors = {
        up: null,
        left: null,
        right: null,
        downleft: null,
        downright: null
    };

    if (!top) {
        var upCidr = Math.ceil(cidrSize) - 1;
        neighbors.up = new Prefix(this.firstIp(), upCidr).correctBitBoundary();
    }

    var sideCidr = Math.ceil(cidrSize);
    var oneIp = new Addr(1);
    if (!leftmost)
        neighbors.left = new Prefix(this.firstIp().subIp(oneIp), sideCidr).correctBitBoundary();
    if (!rightmost)
        neighbors.right = new Prefix(this.lastIp().addIp(oneIp), sideCidr).correctBitBoundary();

    if (!bottom) {
        var downCidr = Math.min((this.isIPv4() ? 32 : 128),
            Math.floor(cidrSize) + 1);
        neighbors.downleft = new Prefix(this.firstIp(), downCidr).correctBitBoundary();
        neighbors.downright = new Prefix(this.lastIp(), downCidr).correctBitBoundary();
    }

    return neighbors;
};

// ************* //

module.exports.Prefix = Prefix;
module.exports.Range = Range;
