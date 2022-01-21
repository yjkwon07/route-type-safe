import { convertToString } from '../src/helpers';
import { route } from '../src/route';
import transformer from '../src/transformer';
import typeParser from '../src/typeParser';

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
    search: '',
    hash: '',
    state: null,
  });
  expect(product.build({ param: { id: 1 }, query: { page: 1, sort: 'L' } })).toEqual({
    pathname: '/id/1',
    search: '?page=1&sort=L',
    hash: '',
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
    hash: '',
    state: null,
  });
});

it('[parse func.] oneOf is orderable, 1, "1"(string) => url("1") => 1(number)', () => {
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
    hash: '',
    state: null,
  });
  expect(product.build({ query: { number: [1, 2] } })).toEqual({
    pathname: '/id',
    search: '?number=1&number=2',
    hash: '',
    state: null,
  });
  expect(product.build({ query: { boolean: [true, false] } })).toEqual({
    pathname: '/id',
    search: '?boolean=true&boolean=false',
    hash: '',
    state: null,
  });
  expect(product.build({ query: { date: [new Date('2022-01-13'), new Date('2022-03-13')] } })).toEqual({
    pathname: '/id',
    search: '?date=2022-01-13T00%3A00%3A00.000Z&date=2022-03-13T00%3A00%3A00.000Z',
    hash: '',
    state: null,
  });
});

it('[build func.] encode(param, query) no encode state (only object value)', () => {
  const product = route({
    path: '/id/:id',
    typeParam: {
      id: typeParser.string.required,
    },
    typeQuery: {
      sort: typeParser.oneOf("가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\", 'L').optional,
    },
    typeHash: ['#ss'],
    typeState: {
      a: typeParser.arrayOf(transformer.string).required,
    },
  });

  expect(
    product.build({
      param: { id: "가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\" },
      query: { sort: "가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\" },
      hash: '#ss',
      state: { a: ["가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\"] },
    }),
  ).toEqual({
    pathname:
      '/id/%EA%B0%80%EB%82%98%EB%8B%A4%EB%9D%BC%EB%A7%88%EB%B0%94%EC%82%AC%21%40%23%24%25%5E%26*%28%29_%2B%5B%5D%3B%27%2C.%2F%60%3D%3F%3C%3E%3A%7B%7D%7C%5C',
    search:
      '?sort=%EA%B0%80%EB%82%98%EB%8B%A4%EB%9D%BC%EB%A7%88%EB%B0%94%EC%82%AC%21%40%23%24%25%5E%26*%28%29_%2B%5B%5D%3B%27%2C.%2F%60%3D%3F%3C%3E%3A%7B%7D%7C%5C',
    hash: '#ss',
    state: { a: ["가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\"] },
  });
});

it('[parse func.] decode(param, query) no decode state (only object value)', () => {
  const product = route({
    path: '/id/:id',
    typeParam: {
      id: typeParser.string.required,
    },
    typeQuery: {
      sort: typeParser.oneOf("가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\", 'L').optional,
    },
    typeHash: ['#ss'],
    typeState: {
      a: typeParser.arrayOf(transformer.string).required,
    },
  });

  expect(
    product.parseParam({
      id: '%EA%B0%80%EB%82%98%EB%8B%A4%EB%9D%BC%EB%A7%88%EB%B0%94%EC%82%AC%21%40%23%24%25%5E%26*%28%29_%2B%5B%5D%3B%27%2C.%2F%60%3D%3F%3C%3E%3A%7B%7D%7C%5C',
    }),
  ).toEqual({
    id: "가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\",
  });
  expect(
    product.parseQuery({
      sort: '%EA%B0%80%EB%82%98%EB%8B%A4%EB%9D%BC%EB%A7%88%EB%B0%94%EC%82%AC%21%40%23%24%25%5E%26*%28%29_%2B%5B%5D%3B%27%2C.%2F%60%3D%3F%3C%3E%3A%7B%7D%7C%5C',
    }),
  ).toEqual({
    sort: "가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\",
  });
  expect(
    product.parseState({
      state: { a: ["가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\"] },
    }),
  ).toEqual({
    a: ["가나다라마바사!@#$%^&*()_+[];',./`=?<>:{}|\\"],
  });
  expect(
    product.parseState({
      state: {
        a: [
          '%EA%B0%80%EB%82%98%EB%8B%A4%EB%9D%BC%EB%A7%88%EB%B0%94%EC%82%AC%21%40%23%24%25%5E%26*%28%29_%2B%5B%5D%3B%27%2C.%2F%60%3D%3F%3C%3E%3A%7B%7D%7C%5C',
        ],
      },
    }),
  ).toEqual({
    a: [
      '%EA%B0%80%EB%82%98%EB%8B%A4%EB%9D%BC%EB%A7%88%EB%B0%94%EC%82%AC%21%40%23%24%25%5E%26*%28%29_%2B%5B%5D%3B%27%2C.%2F%60%3D%3F%3C%3E%3A%7B%7D%7C%5C',
    ],
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

it('[parse func.] using parse func.', () => {
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
      c: typeParser.boolean.required,
      d: typeParser.date.required,
      e: typeParser.oneOf('id', 'sort').required,
      f: typeParser.arrayOf(transformer.number).required,
    },
  });
  const date = new Date('2022/01/13');

  expect(
    product.parse(
      { id: '2' },
      {
        pathname: '/id/2',
        search: '?sort=L&page=3',
        hash: '#ss',
        state: { a: '1', b: '2', c: 'true', d: date, e: 'id', f: ['1', '23'] },
      },
    ),
  ).toEqual({
    param: {
      id: 2,
    },
    query: {
      page: 3,
      sort: 'L',
    },
    hash: '#ss',
    state: { a: 1, b: '2', c: true, d: date, e: 'id', f: [1, 23] },
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

it('[parse func] query what required value in build func. can return undefined in case using url website', () => {
  const product = route({
    path: '/id/:id',
    typeParam: {
      id: typeParser.number.required,
    },
    typeQuery: {
      page: typeParser.number.required,
    },
  });

  expect(
    product.parse(
      { id: '2' },
      {
        pathname: '/id/2',
        search: '',
        hash: '',
        state: null,
      },
    ),
  ).toEqual({
    param: {
      id: 2,
    },
    query: {
      page: undefined,
    },
    hash: '',
    state: {},
  });
});
