var Addr = require('./Addr');
var Range = require('./Range');

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

module.exports = Prefix;