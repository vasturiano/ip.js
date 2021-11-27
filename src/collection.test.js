import Addr from './single';
import { Prefix, Range } from './collection';

describe('Prefix', () => {
  test('construct from string', () => {
    expect(new Prefix('10.0.0.0/24').toString()).toBe('10.0.0.0/24');
    expect(new Prefix('10.0.0.0').toString()).toBe('10.0.0.0/32');
    expect(new Prefix('10/8').toString()).toBe('10.0.0.0/8');

    expect(new Prefix('2002:DEAD::/48').toString()).toBe('2002:dead::/48');
    expect(new Prefix('2002:DEAD::').toString()).toBe('2002:dead::/128');
    expect(new Prefix('2002:/16').toString()).toBe('2002::/16');
  });

  test('construct from ip,cidr', () => {
    expect(new Prefix('10', 24).toString()).toBe('10.0.0.0/24');
    expect(new Prefix('2002:DEAD::', 48).toString()).toBe('2002:dead::/48');
  });

  test('construct with set version', () => {
    expect(new Prefix('0', 0, true).toString()).toBe('0.0.0.0/0');
    expect(new Prefix('0', 0, false).toString()).toBe('::/0');
  });

  test('isIPv4', () => {
    expect(new Prefix('10.0.0.0/24').isIPv4()).toBe(true);
    expect(new Prefix('2002:DEAD::/48').isIPv4()).toBe(false);
  });

  test('firstIp', () => {
    expect(new Prefix('10.0.0.0/24').firstIp().toString()).toBe('10.0.0.0');
    expect(new Prefix('2002:DEAD::/48').firstIp().toString()).toBe('2002:dead::');
  });

  test('lastIp', () => {
    expect(new Prefix('10.0.0.0/24').lastIp().toString()).toBe('10.0.0.255');
    expect(new Prefix('2002:DEAD::/48').lastIp().toString()).toBe('2002:dead::ffff:ffff:ffff:ffff:ffff');
  });

  test('getCidr', () => {
    expect(new Prefix('10.0.0.0/24').getCidr()).toBe(24);
    expect(new Prefix('2002:DEAD::/48').getCidr()).toBe(48);
  });

  test('toRange', () => {
    expect(new Prefix('10.0.0.0/24').toRange().toString()).toBe('10.0.0.0 - 10.0.0.255');
    expect(new Prefix('2002:DEAD::/48').toRange().toString()).toBe('2002:dead:: - 2002:dead::ffff:ffff:ffff:ffff:ffff');
  });

  test('countIps', () => {
    expect(new Prefix('10.0.0.0/24').countIps()).toBe(256);
    expect(new Prefix('2002:DEAD::/48').countIps().toString()).toBe('1208925819614629174706176');
  });

  test('correctBitBoundary', () => {
    expect(new Prefix('10.0.0.42/24').correctBitBoundary().toString()).toBe('10.0.0.0/24');
    expect(new Prefix('2002:DEAD::12:A/126').correctBitBoundary().toString()).toBe('2002:dead::12:8/126');
  });

  test('slice', () => {
    expect(new Prefix('10.0.0.0/24').slice(26).map(p => p.toString())).toEqual(["10.0.0.0/26", "10.0.0.64/26", "10.0.0.128/26", "10.0.0.192/26"]);
    expect(new Prefix('2002:DEAD::/48').slice(50).map(p => p.toString())).toEqual(["2002:dead::/50", "2002:dead::4000:0:0:0:0/50", "2002:dead::8000:0:0:0:0/50", "2002:dead::c000:0:0:0:0/50"]);

  });
});

describe('Range', () => {
  test('construct from ips', () => {
    expect(new Range('10.0.0.0', '10.0.255.255').toString()).toBe('10.0.0.0 - 10.0.255.255');
    expect(new Range('2002:DEAD::', '2002:DEAD::ffff:ffff:ffff:ffff:ffff').toString()).toBe('2002:dead:: - 2002:dead::ffff:ffff:ffff:ffff:ffff');
  });

  test('construct with set version', () => {
    expect(new Range(0, 1, true).toString()).toBe('0.0.0.0 - 0.0.0.1');
    expect(new Range(0, 1, false).toString()).toBe(':: - ::1');
  });

  test('isIPv4', () => {
    expect(new Range('10.0.0.0', '10.5.255.255').isIPv4()).toBe(true);
    expect(new Range('2002:DEAD::', '2002:DEAD::E').isIPv4()).toBe(false);
  });

  test('firstIp', () => {
    expect(new Range('10.0.0.0', '10.5.255.255').firstIp().toString()).toBe('10.0.0.0');
    expect(new Range('2002:DEAD::', '2002:DEAD::E').firstIp().toString()).toBe('2002:dead::');
  });

  test('lastIp', () => {
    expect(new Range('10.0.0.0', '10.5.255.255').lastIp().toString()).toBe('10.5.255.255');
    expect(new Range('2002:DEAD::', '2002:DEAD::E').lastIp().toString()).toBe('2002:dead::e');
  });

  test('countIps', () => {
    expect(new Range('10.0.0.0', '10.5.255.255').countIps()).toBe(393216);
    expect(new Range('2002:DEAD::', '2002:DEAD::E').countIps().toString()).toBe('15');
  });

  test('cidrCount', () => {
    expect(new Range('10.0.0.0', '10.7.255.255').cidrCount()).toBe(13);
    expect(new Range('2002:DEAD::', '2002:DEAD::7').cidrCount()).toBe(125);
  });

  test('toPrefixes', () => {
    expect(new Range('10.0.0.0', '10.5.255.255').toPrefixes().map(p => p.toString())).toEqual(["10.0.0.0/14", "10.4.0.0/15"]);
    expect(new Range('2002:DEAD::', '2002:DEAD::E').toPrefixes().map(p => p.toString())).toEqual(["2002:dead::/125", "2002:dead::8/126", "2002:dead::c/127", "2002:dead::e/128"]);

    expect(new Prefix('0/0').toRange().toPrefixes().map(p => p.toString())).toEqual(['0.0.0.0/0']);
  });

  test('toEncompassingPrefix', () => {
    expect(new Range('10.0.0.0', '10.5.255.255').toEncompassingPrefix().toString()).toBe('10.0.0.0/13');
    expect(new Range('2002:DEAD::', '2002:DEAD::E').toEncompassingPrefix().toString()).toBe('2002:dead::/124');
  });

  test('ipRelPosition', () => {
    const rangeV4 = new Range('10.0.0.0', '10.5.255.255');
    expect(rangeV4.ipRelPosition(new Addr('10.2.0.0'))).toBe(1/3);
    expect(rangeV4.ipRelPosition(new Addr('10.2.0.0'), true)).toBeGreaterThan(1/3);

    const rangeV6 = new Range('2002:DEAD::', '2002:DEAD::E');
    expect(rangeV6.ipRelPosition(new Addr('2002:DEAD::8'))).toBeLessThan(0.6);
    expect(rangeV6.ipRelPosition(new Addr('2002:DEAD::8'), true)).toBe(0.6);
  });

  test('ipAtPerc', () => {
    expect(new Range('10.0.0.0', '10.5.255.255').ipAtPerc(100 / 3).toString()).toBe('10.2.0.0');
    expect(new Range('2002:DEAD::', '2002:DEAD::E').ipAtPerc(100 / 3).toString()).toBe('2002:dead::5');
  });

  test('overlapPerc', () => {
    const rangeV4 = new Range('10.0.0.0', '10.0.0.255');
    expect(rangeV4.overlapPerc(new Range('10.0.0.128', '10.0.0.191'))).toEqual([100/2, 300/4]);
    expect(rangeV4.overlapPerc(new Prefix('10.0.0.64/28'))).toEqual([100/4, 500/16]);

    const rangeV6 = new Range('2002::', '2002::F');
    expect(rangeV6.overlapPerc(new Range('2002::E', '2002::F'))).toEqual([1400/16, 100]);
    expect(rangeV6.overlapPerc(new Prefix('2002::8/126'))).toEqual([100/2, 300/4]);
  });

  test('getNeighborPrefixes', () => {
    const v4Neighbors = new Range('10.0.0.0', '10.0.255.255').getNeighborPrefixes();
    expect(Object.entries(v4Neighbors).map(([type,p]) => `${type}: ${p.toString()}`)).toEqual(["up: 10.0.0.0/15", "left: 9.255.0.0/16", "right: 10.1.0.0/16", "downleft: 10.0.0.0/17", "downright: 10.0.128.0/17"]);

    const v6Neighbors = new Range('2002:DEAD::', '2002:DEAD::F').getNeighborPrefixes();
    expect(Object.entries(v6Neighbors).map(([type,p]) => `${type}: ${p.toString()}`)).toEqual(["up: 2002:dead::/123", "left: 2002:deac:ffff:ffff:ffff:ffff:ffff:fff0/124", "right: 2002:dead::10/124", "downleft: 2002:dead::/125", "downright: 2002:dead::8/125"]);
  });
});