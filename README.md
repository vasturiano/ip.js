IP.js
=====

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![Dependencies][dependencies-img]][dependencies-url]

A JS library for manipulating IP addresses, prefixes and ranges. Supports both IPv4 and IPv6. Uses [JSBI BigInt](https://github.com/GoogleChromeLabs/jsbi) to handle IPv6 operations, to retain numeric resolution beyond the [53-bit max safe integer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) in JavaScript.  

## Quick start

```
import { Addr, Prefix, Range } from 'ip.js';
```
or
```
const Ip = require('ip.js');
```
or even
```
<script src="//unpkg.com/ip.js"></script>
```

## Usage example

```
const myIp = new Ip.Addr('10.0.0.42');
myIp.version(); // 4
myIp.toNum(); // 167772160

const myPrefix = new Ip.Prefix('10.0.0.0/24');
myPrefix.countIps(); // 256
myPrefix.slice(26); // [10.0.0.0/26, 10.0.0.64/26, 10.0.0.128/26, 10.0.0.192/26]

const myV6Prefix = new Ip.Prefix('2002:DEAD::/48');
myV6Prefix.isIpV4(); // false
myV6Prefix.firstIp(); // 2002:dead::
myV6Prefix.lastIp(); // 2002:dead::ffff:ffff:ffff:ffff:ffff

const myRange = new Ip.Range('10.0.0.0', '10.0.0.42');
myRange.countIps(); // 43
myRange.toEncompassingPrefix(); // 10.0.0.0/26
myRange.toPrefixes(); // [10.0.0.0/27, 10.0.0.32/29, 10.0.0.40/31, 10.0.0.42/32]
```

## API reference

### Addr

Class to manipulate single IP addresses.

#### Instantiation

<b>new Addr</b>(<i>ip</i>, [<i>isV4</i>])

Creates a new object representing an IP address, based on the input `ip` argument. `ip` can be either a <i>string</i> (f.e. `10.0.0.0` or `2002:DEAD::`), a <i>number</i> (`167772160`), a [BigInt](https://github.com/GoogleChromeLabs/jsbi), or another instance of `Addr`.
The optional argument `isV4` defines the address family (<i>IPv4</i> (`true`) or <i>IPv6</i> (`false`)). If it is `undefined`, the address family is automatically derived from the input `ip` by either looking for specific family syntax in the <i>string</i>, or checking for numbers larger than 32 bit.

#### Methods

| Method | Arguments | Return Value | Description |
| --- | :--: | :--: | --- |
| **toString**() | - | *string* | Returns a string representation of the IP address. *IPv6* addresses are lowercase and compressed by removing empty octets. |
| **toNum**() | - | *number* or *BigInt* | Returns a numeric representation of the IP address. IPv4 addresses are represented as regular JS numbers, while IPv6 are represented as [BigInts](https://github.com/GoogleChromeLabs/jsbi). |
| **toBin**() | - | *string* | Returns a string with the binary representation of the IP (*IPv4*: 32 bits long, *IPv6*: 128 bits long). |
| **version**() | - | *number*: `4` or `6` | Get the IP address family. |
| **isIPv4**() | - | *boolean* | Whether the address family is *IPv4*. |
| **addIp**(*ip*) | ip: *Addr* | *Addr* | Given another IP address (*Addr* object), returns a new *Addr* object representing the numeric sum of the two IP addresses. If the two IPs are of different address families, this operation will fail due to the incompatibility between addresses. |
| **subIp**(*ip*) | ip: *Addr* | *Addr* | Given another IP address (*Addr* object), returns a new *Addr* object representing the numeric subtraction of the input IP from this one. Make sure the input IP is no higher then the existing one, which would lead to negative values. If the two IPs are of different address families, this operation will fail due to the incompatibility between addresses. |
| **compare2Ip**(*ip*) | ip: *Addr* | *number*: `-1`, `0` or `1` | Performs a numeric comparison with another IP address (*Addr* object), and returns `-1` if the current IP is lower than the input, `0` if they are equal and `1` if the current IP is higher than the input. If the two IPs are of different address families, this method returns `null`. |

### Prefix

Class to manipulate IP prefixes, with the format `<IP address>/<cidr>`.

#### Instantiation

<b>new Prefix</b>(<i>prefix</i>)

or

<b>new Prefix</b>(<i>ip</i>, <i>cidr</i>, [<i>isV4</i>])

Creates a new object representing an IP prefix, based on the input `prefix` or (`ip`, `cidr`) arguments.
`prefix` should be a *string* representation (f.e. `10.0.0.0/24` or `2002:DEAD::/48`). 
The class can also be instantiated by passing a pair of `ip`, `cidr` arguments. `ip` supports any format understood by the *Addr* class, and `cidr` should be a number (*IPv4*: `0`-`32`, *IPv6*: `0`-`128`).
The optional argument `isV4` defines the address family (<i>IPv4</i> (`true`) or <i>IPv6</i> (`false`)). If it is `undefined`, the address family is automatically derived from the input prefix.

#### Methods

| Method | Arguments | Return Value | Description |
| --- | :--: | :--: | --- |
| **toString**() | - | *string* | Returns a string representation of the IP prefix, following the `<ip>/<cidr>` syntax. Just as in the *Addr* class, *IPv6* prefix addresses are lowercase and compressed by removing empty octets. |
| **toRange**() | - | *Range* | Returns a *Range* object representing the address range covered by the prefix. |
| **isIPv4**() | - | *boolean* | Whether the prefix address family is *IPv4*. |
| **firstIp**() | - | *Addr* | Returns an *Addr* object representing the first IP address in the prefix. |
| **lastIp**() | - | *Addr* | Returns an *Addr* object representing the last IP address in the prefix. |
| **getCidr**() | - | *number* | Returns the CIDR size of the prefix. |
| **countIps**() | - | *number* (IPv4) or *BigInt* (IPv6) | The number of addresses in the prefix (represented as regular number if the prefix is *IPv4*, or a *BigInt* if it is *IPv6*). The result will always be a **power of 2** number, according to the prefix's CIDR size. |
| **correctBitBoundary**() | - | *Prefix* | Validates and returns a new *Prefix* object by setting the correct start IP address that falls on this prefix CIDR bit boundary. |
| **slice**(*cidr*) | cidr: *number* | *[]Prefix* | De-aggregates the prefix into an array of smaller prefixes of the specified CIDR size. Each smaller prefix is represented as a *Prefix* object. If the specified CIDR size is larger than the current one, no de-aggregation is performed. |

### Range

Class to manipulate IP ranges, with the format `<first IP> - <last IP>`.

#### Instantiation

<b>new Range</b>(<i>firstIp</i>, <i>lastIp</i>, [<i>isV4</i>])

Creates a new object representing an IP address range, based on the input `firstIp` and `lastIp` arguments. 
Both IPs are required and support any format understood by the *Addr* class.
The optional argument `isV4` defines the address family (<i>IPv4</i> (`true`) or <i>IPv6</i> (`false`)). If it is `undefined`, the address family is automatically derived from the input IP addresses. If the two IP addresses are of different address families an exception is thrown.

#### Methods

| Method | Arguments | Return Value | Description |
| --- | :--: | :--: | --- |
| **toString**() | - | *string* | Returns a string representation of the IP range, following the `<firstIp> - <lastIp>` syntax. Just as in the *Addr* class, *IPv6* prefix addresses are lowercase and compressed by removing empty octets. |
| **isIPv4**() | - | *boolean* | Whether the range address family is *IPv4*. |
| **firstIp**() | - | *Addr* | Returns an *Addr* object representing the first IP address in the range. |
| **lastIp**() | - | *Addr* | Returns an *Addr* object representing the last IP address in the range. |
| **countIps**() | - | *number* (IPv4) or *BigInt* (IPv6) | The number of addresses in the address range (represented as regular number if the range is *IPv4*, or a *BigInt* if it is *IPv6*). |
| **cidrCount**() | - | *number* | The calculated CIDR size based on the number of addresses in the address range. This number will be fracional if the address count doesn't fall on a *power of 2* bit boundary. |
| **toPrefixes**() | - | *[]Prefix* | Generates the array of adjacent prefixes that collectively represent this address range, without any gaps or overlaps. |
| **toEncompassingPrefix**() | - | *Prefix* | Returns the closest smallest valid prefix that fully encompasses this address range. |
| **ipRelPosition**(*ip*, [*after*]]) | ip: *Addr*, after: *boolean* | *number* | Returns the percentual value (`0` to `1`) of what is the relative position of the specified IP within this address range. Values `<0` or `>1` are possible if the IP is outside of the range. The second (optional) argument **after** (default to `false`) indicates if the value should be calculated for immediately before the IP address (`false`) or after (`true`). Returns `null` if the IP is not of the same address family as the range. |
| **ipAtPerc**(*perc*) | perc: *number* | *Addr* | Returns the IP address that is at the percentual position (`0`-`100`) within the range. |
| **overlapPerc**(*childRange*) | childRange: *Prefix* of *Range* | [*number*, *number*] | Returns the start and end percentage of overlap between this range and a child prefix/range. Values `<0` or `>100` are possible if the ranges only partially overlap or do not overlap at all. Percentages are relative to the current range. | 
| getNeighborPrefixes() | - | `{ up, left, right, downleft, downright }`*Prefix* | Returns the 5 CIDR neighbor prefixes: one CIDR *up*, two side siblings *left* and *right*, first and second half down (*downleft* and *downright*). |


[npm-img]: https://img.shields.io/npm/v/ip.js.svg
[npm-url]: https://npmjs.org/package/ip.js
[build-size-img]: https://img.shields.io/bundlephobia/minzip/ip.js.svg
[build-size-url]: https://bundlephobia.com/result?p=ip.js
[dependencies-img]: https://img.shields.io/david/vasturiano/ip.js.svg
[dependencies-url]: https://david-dm.org/vasturiano/ip.js
