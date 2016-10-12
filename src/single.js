var Addr = function(ip) {
    if (ip instanceof Addr) {
        this.num = ip.toNum();
        this.isV4 = ip.isIPv4();
    } else if (typeof ip === 'number') {
        this.num = ip;
        this.isV4 = this.num < Math.pow(2, 32);
    } else {
        // Parse as string
        var num = 0,
            isV4 = ip.indexOf(':') === -1;

        var exp = isV4 ? 32-8 : 128-16;
        ip.split(isV4 ? '.' : ':').forEach(function (seg) {
            if (!seg.length) { return exp = 0; }
            num += parseInt(seg, isV4?10:16) * Math.pow(2, exp);
            exp -= isV4 ? 8 : 16;
        });

        this.num = num;
        this.isV4 = isV4;
    }
};

Addr.prototype.version = function() {
    return this.isV4 ? 4 : 6;
};

Addr.prototype.isIPv4 = function() {
    return this.isV4;
};

Addr.prototype.toString = function() {
    var segLen = Math.pow(2, this.isV4?8:16),
        num = this.num,
        str = (num%segLen).toString(this.isV4?10:16);

    for (var i=1;i<(this.isV4?4:8);i++) {
        num=Math.floor(num/segLen);
        str = (num%segLen).toString(this.isV4?10:16) + (this.isV4?'.':':') + str;
    }

    return this.isV4 ? str : compressV6(str);

    //

    function compressV6(addrStr) {
        var out    = '';
        var chunks = addrStr.split(/:/);
        for (var i=0; i < chunks.length; i++) {
            var chunk = chunks[i].replace(/^0+/,'');
            if (!chunk) chunk = 0;
            out += chunk + ':';
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
};

Addr.prototype.toNum = function() {
    return this.num;
};

// Returns a string with the binary representation of the IP (v4: 32 bits long, v6: 128 bits long)
Addr.prototype.toBin = function() {
    var bin = this.num.toString(2);

    // Pad with 0s
    while (bin.length < (this.isV4 ? 8 : 16))
        bin = "0" + bin;

    return bin;
};

Addr.prototype.addIp = function(another) {
    return new Addr(this.toNum() + another.toNum());
};

Addr.prototype.subIp = function(another) {
    return new Addr(this.toNum() - another.toNum());
};

// Return value: -1: this<that, 0: this=that, 1: this>that, null: different families
Addr.prototype.compare2Ip = function(that) {
    if (this.version() != that.version())
        return null;

    return compareNums(this.toNum(), that.toNum());

    function compareNums(numa, numb) {
        if (numa == numb)
            return 0;
        if (numa < numb)
            return -1;
        return 1;
    }
};

module.exports = Addr;