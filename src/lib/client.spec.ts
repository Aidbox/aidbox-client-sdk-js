import test from 'ava';

const fn = () => 'bar';

test('fn() returns foo', (t) => {
  t.is(fn(), 'foo');
});
