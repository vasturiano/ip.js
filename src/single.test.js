import Addr from './single';

test('construct from string', () => {
  expect(new Addr('10.0.0.1').toString()).toBe('10.0.0.1');
  expect(new Addr('10').toString()).toBe('10.0.0.0');
  expect(new Addr('10.0').toString()).toBe('10.0.0.0');
  expect(new Addr('10.0.0').toString()).toBe('10.0.0.0');

  expect(new Addr('2002:DEAD::4C').toString()).toBe('2002:dead::4c');
  expect(new Addr('2002:DEAD::4C:4').toString()).toBe('2002:dead::4c:4');
  expect(new Addr('2002:DEAD').toString()).toBe('2002:dead::');
});

test('construct from number', () => {
  expect(new Addr(256, true).toString()).toBe('0.0.1.0');
  expect(new Addr(256, false).toString()).toBe('::100');
});

test('construct from BigInt', () => {
  expect(new Addr(256n, true).toString()).toBe('0.0.1.0');
  expect(new Addr(256n, false).toString()).toBe('::100');
});

test('construct from BigInt derives address family at the 32-bit boundary', () => {
  expect(new Addr((1n << 32n) - 1n).toString()).toBe('255.255.255.255');

  const firstV6 = new Addr(1n << 32n);
  expect(firstV6.isIPv4()).toBe(false);
  expect(firstV6.toString()).toBe('::1:0:0');
  expect(firstV6.toNum()).toBe(1n << 32n);

  const maxV6 = new Addr((1n << 128n) - 1n);
  expect(maxV6.toString()).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
  expect(maxV6.toNum()).toBe((1n << 128n) - 1n);
});

test('construct from Addr', () => {
  expect(new Addr(new Addr('10.0.0.1')).toString()).toBe('10.0.0.1');
});

test('construct with set version', () => {
  expect(new Addr('0', true).toString()).toBe('0.0.0.0');
  expect(new Addr('0', false).toString()).toBe('::');
});

test('version', () => {
  expect(new Addr('10.0.0.1').version()).toBe(4);
  expect(new Addr('2002:DEAD::4C:4').version()).toBe(6);

  expect(new Addr('0', true).version()).toBe(4);
  expect(new Addr('0', false).version()).toBe(6);
});

test('isIPv4', () => {
  expect(new Addr('10.0.0.1').isIPv4()).toBe(true);
  expect(new Addr('2002:DEAD::4C:4').isIPv4()).toBe(false);

  expect(new Addr('0', true).isIPv4()).toBe(true);
  expect(new Addr('0', false).isIPv4()).toBe(false);
});

test('IPv6 string compression', () => {
  expect(new Addr('2002:DEAD:0:0:0:0::0:0:0:4C:4').toString()).toBe('2002:dead::4c:4');
});

test('toNum', () => {
  expect(new Addr('10.0.0.1').toNum()).toBe(167772161);
  expect(new Addr('2002:DEAD::1').toNum()).toBe(42550196860238503226743406894518370305n);
});

test('toBin', () => {
  expect(new Addr('10.0.0.1').toBin()).toBe('00001010000000000000000000000001');
  expect(new Addr('2002:DEAD::1').toBin()).toBe('00100000000000101101111010101101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001');
});

test('addIp', () => {
  expect(new Addr('10.0.0.0').addIp(new Addr('20.0.0.0')).toString()).toBe('30.0.0.0');
  expect(new Addr('255.255.255.255').addIp(new Addr('0.0.0.1')).toString()).toBe('::1:0:0');
  expect(() => new Addr('10.0.0.1').addIp(new Addr('::1'))).toThrow(TypeError);
  const oneV6 = new Addr('::').addIp(new Addr('::1'));
  expect(oneV6.isIPv4()).toBe(false);
  expect(oneV6.toNum()).toBe(1n);
  expect(new Addr('2002:DEAD::1').addIp(new Addr('1000::')).toString()).toBe('3002:dead::1');
});

test('subIp', () => {
  expect(new Addr('10.0.0.0').subIp(new Addr('5.0.0.0')).toString()).toBe('5.0.0.0');
  expect(new Addr('2002:DEAD::1').subIp(new Addr('1000::')).toString()).toBe('1002:dead::1');
  const zeroV6 = new Addr('::1').subIp(new Addr('::1'));
  expect(zeroV6.isIPv4()).toBe(false);
  expect(zeroV6.toNum()).toBe(0n);
});

test('compare2Ip', () => {
  expect(new Addr('10.0.0.0').compare2Ip(new Addr('10.0.0.0'))).toBe(0);
  expect(new Addr('10.0.0.0').compare2Ip(new Addr('9.255.255.255'))).toBe(1);
  expect(new Addr('10.0.0.0').compare2Ip(new Addr('9.0.0.0'))).toBe(1);
  expect(new Addr('10.0.0.0').compare2Ip(new Addr('0.0.0.0'))).toBe(1);
  expect(new Addr('10.0.0.0').compare2Ip(new Addr('10.0.0.1'))).toBe(-1);
  expect(new Addr('10.0.0.0').compare2Ip(new Addr('11.0.0.0'))).toBe(-1);
  expect(new Addr('10.0.0.0').compare2Ip(new Addr('255.255.255.255'))).toBe(-1);

  expect(new Addr('2002:DEAD::1').compare2Ip(new Addr('2002:DEAD::1'))).toBe(0);
  expect(new Addr('2002:DEAD::1').compare2Ip(new Addr('2002:DEAD::'))).toBe(1);
  expect(new Addr('2002:DEAD::1').compare2Ip(new Addr('2002::'))).toBe(1);
  expect(new Addr('2002:DEAD::1').compare2Ip(new Addr('::'))).toBe(1);
  expect(new Addr('2002:DEAD::1').compare2Ip(new Addr('2002:DEAD::2'))).toBe(-1);
  expect(new Addr('2002:DEAD::1').compare2Ip(new Addr('2002:DEAE::'))).toBe(-1);
  expect(new Addr('2002:DEAD::1').compare2Ip(new Addr('FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF'))).toBe(-1);
});
