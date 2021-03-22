import test from 'ava';

const fn = () => 'baz';

test('fn() returns foo', (t) => {
  t.is(fn(), 'foo');
});
