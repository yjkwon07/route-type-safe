import { convertToString } from './helpers';
import { route } from './route';
import transformer from './transformer';
import typeParser from './typeParser';

it('[build func.] If typeParam is not equal ":{w+}" (like ":param") pattern with path, return pathname to path', () => {
  const wrongProductId = route({
    path: '/id/:id',
    typeParam: {
      productId: typeParser.number.required,
    },
  });

  const rightProductId = route({
    path: '/id/:id',
    typeParam: {
      id: typeParser.number.required,
    },
  });

  expect(wrongProductId.build({ param: { productId: 1 } }).pathname).toBe('/id/:id');
  expect(rightProductId.build({ param: { id: 1 } }).pathname).toBe('/id/1');
});

it('[build func.] typeParser optional, required type check', () => {
  const product = route({
    path: '/id/:id',
    typeParam: {
      id: typeParser.number.required,
    },
    typeQuery: {
      sort: typeParser.oneOf('L', 'R').optional,
      page: typeParser.number.required,
    },
    typeHash: ['#ss'],
    typeState: {
      a: typeParser.number.required,
      b: typeParser.string.required,
      c: typeParser.string.required,
    },
  });

  expect(product.build({ param: { id: 1 } })).toEqual({
    pathname: '/id/1',
    search: undefined,
    hash: undefined,
    state: null,
  });
  expect(product.build({ param: { id: 1 }, query: { page: 1, sort: 'L' } })).toEqual({
    pathname: '/id/1',
    search: '?page=1&sort=L',
    hash: undefined,
    state: null,
  });
  expect(product.build({ param: { id: 1 }, query: { page: 1 }, hash: '#ss' })).toEqual({
    pathname: '/id/1',
    search: '?page=1',
    hash: '#ss',
    state: null,
  });
  expect(
    product.build({
      param: { id: 1 },
      query: { page: 1, sort: 'L' },
      hash: '#ss',
      state: { a: 1, b: '2', c: '3' },
    }),
  ).toEqual({
    pathname: '/id/1',
    search: '?page=1&sort=L',
    hash: '#ss',
    state: { a: 1, b: '2', c: '3' },
  });
});

it('[build func.] oneOf union type check', () => {
  const product = route({
    path: '/id',
    typeQuery: {
      sort: typeParser.oneOf('L', 'R').required,
    },
  });

  expect(product.build({ query: { sort: 'L' } })).toEqual({
    pathname: '/id',
    search: '?sort=L',
    hash: undefined,
    state: null,
  });
});

it('[build func.] arrayOf return build value check, that using urlQueryReplace func.', () => {
  const product = route({
    path: '/id',
    typeQuery: {
      string: typeParser.arrayOf(transformer.string).optional,
      number: typeParser.arrayOf(transformer.number).optional,
      boolean: typeParser.arrayOf(transformer.boolean).optional,
      date: typeParser.arrayOf(transformer.date).optional,
    },
  });

  expect(product.build({ query: { string: ['1', '2'] } })).toEqual({
    pathname: '/id',
    search: '?string=1&string=2',
    hash: undefined,
    state: null,
  });
  expect(product.build({ query: { number: [1, 2] } })).toEqual({
    pathname: '/id',
    search: '?number=1&number=2',
    hash: undefined,
    state: null,
  });
  expect(product.build({ query: { boolean: [true, false] } })).toEqual({
    pathname: '/id',
    search: '?boolean=true&boolean=false',
    hash: undefined,
    state: null,
  });
  expect(product.build({ query: { date: [new Date('2022-01-13'), new Date('2022-03-13')] } })).toEqual({
    pathname: '/id',
    search: '?date=2022-01-13T00%3A00%3A00.000Z&date=2022-03-13T00%3A00%3A00.000Z',
    hash: undefined,
    state: null,
  });
});

it('[parse func.] oneOf is orderable, 1, "1"(string) => url("1") => 1(number) ', () => {
  const product = route({
    path: '/id',
    typeQuery: {
      stringAndNumber: typeParser.oneOf('1', 1).optional,
      numberAndString: typeParser.oneOf(1, '1').optional,
    },
  });

  expect(product.parseQuery({ stringAndNumber: '1' })).toEqual({
    stringAndNumber: '1',
  });
  expect(product.parseQuery({ numberAndString: '1' })).toEqual({
    numberAndString: 1,
  });
});

it('[parse func.] string type convert to transformer(func.) return type', () => {
  const product = route({
    path: '/id/:id',
    typeParam: {
      id: typeParser.number.required,
    },
    typeQuery: {
      sort: typeParser.oneOf('L', 'R').optional,
      page: typeParser.number.required,
    },
    typeState: {
      a: typeParser.number.required,
      b: typeParser.string.required,
      c: typeParser.boolean.required,
      d: typeParser.date.required,
      e: typeParser.oneOf('id', 'sort').required,
      f: typeParser.arrayOf(transformer.number).required,
    },
  });
  const date = new Date('2022/01/13');

  expect(product.parseParam({ id: '2' })).toEqual({ id: 2 });
  expect(() => product.parseParam({ id: 'apple' })).toThrow();
  expect(product.parseParam({ productId: '2' })).toEqual({});

  expect(product.parseQuery({ page: '3' })).toEqual({ page: 3 });
  expect(product.parseQuery({ sort: 'L', page: '3' })).toEqual({ sort: 'L', page: 3 });
  expect(product.parseQuery({ isSort: 'true', isPage: 'false' })).toEqual({});
  expect(() => product.parseQuery({ sort: '2', page: '3' })).toThrow();

  expect(product.parseState({ state: { a: '1', b: '2', c: 'true', d: date, e: 'id', f: ['1', '23'] } })).toEqual({
    a: 1,
    b: '2',
    c: true,
    d: date,
    e: 'id',
    f: [1, 23],
  });
});

it('[parse func.] string type convert to Date type', () => {
  const product = route({
    path: '/id',
    typeQuery: {
      startDate: typeParser.date.required,
    },
  });

  expect(product.parseQuery(convertToString({ startDate: new Date('2022-03-01') }))).toEqual({
    startDate: new Date('2022-03-01'),
  });
  expect(product.parseQuery({ startDate: '2022-03-01' })).not.toEqual({ startDate: '2022-03-01' });
  expect(product.parseQuery({ startDate: '2022-03-01' })).toEqual({ startDate: new Date('2022-03-01') });
});
