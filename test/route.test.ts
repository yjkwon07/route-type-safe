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
    typeHash: ['ss'],
    typeState: {
      a: typeParser.number.required,
      b: typeParser.string.required,
      c: typeParser.string.required,
    },
  });

  expect(product.build()).toEqual({
    pathname: '/id/:id',
    search: '',
    hash: '',
    state: null,
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

it('[parse func.] If value is not array type in arrayOf parse, return new array', () => {
  const product = route({
    path: '/id',
    typeQuery: {
      string: typeParser.arrayOf(transformer.string).optional,
      number: typeParser.arrayOf(transformer.number).optional,
      boolean: typeParser.arrayOf(transformer.boolean).optional,
      date: typeParser.arrayOf(transformer.date).optional,
    },
  });

  expect(product.parseQuery({ string: ['22', '33'] })).toEqual({ string: ['22', '33'] });
  expect(product.parseQuery({ string: '22' })).toEqual({ string: ['22'] });
  expect(product.parseQuery({ number: ['22', '33'] })).toEqual({ number: [22, 33] });
  expect(product.parseQuery({ number: '22' })).toEqual({ number: [22] });
  expect(product.parseQuery({ boolean: ['true', 'false'] })).toEqual({ boolean: [true, false] });
  expect(product.parseQuery({ boolean: 'true' })).toEqual({ boolean: [true] });
  expect(product.parseQuery({ date: '2022-01-13T00%3A00%3A00.000Z' })).toEqual({ date: [new Date('2022-01-13')] });
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

  expect(product.build({ query: { string: ['1'] } })).toEqual({
    pathname: '/id',
    search: '?string=1',
    hash: '',
    state: null,
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
    typeHash: ['ss'],
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
      e: typeParser.oneOf('id', 1, 'sort').required,
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

  expect(product.parseState({ state: { a: 1, b: '2', c: 'true', d: date, e: 'id', f: [1, 23] } })).toEqual({
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
    typeHash: ['ss'],
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

it('[parse func.] parse() — URLSearchParams 가 이미 decode 한 값은 skipDecode 로 double-decode 회피 (raw `%` 포함 JSON 안전)', () => {
  const product = route({
    path: '/id/:id',
    typeParam: {
      id: typeParser.string.required,
    },
    typeQuery: {
      data: typeParser.string.optional,
    },
  });

  // search 의 data 값: encodeURIComponent('[{"x":"4%"}]') 결과.
  // URLSearchParams 가 한 번 decode → '[{"x":"4%"}]'. 여기서 또 decodeURIComponent 하면 `%"` invalid escape → URIError.
  // skipDecode 로 한 번만 decode 되어 정상 통과해야 함.
  expect(
    product.parse(
      { id: '5%2B100' }, // React Router 가 이미 decode 했다고 가정 → '5%+100' 가 입력으로 들어오는 시나리오는 다음 케이스
      {
        pathname: '/id/abc',
        search: '?data=%5B%7B%22x%22%3A%224%25%22%7D%5D',
        hash: '',
        state: null,
      },
    ),
  ).toEqual({
    param: { id: '5%2B100' },
    query: { data: '[{"x":"4%"}]' },
    hash: '',
    state: {},
  });
});

it('[parse func.] parseParam(param, { skipDecode: true }) — 이미 decode 된 값 그대로 transform (React Router useParams 시나리오)', () => {
  const product = route({
    path: '/id/:id',
    typeParam: {
      id: typeParser.string.required,
    },
  });

  // 입력: 이미 decode 된 raw 값 (`%` 포함). skipDecode 가 없으면 decodeURIComponent('5%+100') → `%+` invalid → URIError.
  expect(product.parseParam({ id: '5%+100' }, { skipDecode: true })).toEqual({ id: '5%+100' });

  // skipDecode 기본 (false) 일 때는 decode 시도 → 에러.
  expect(() => product.parseParam({ id: '5%+100' })).toThrow(URIError);
});

it('[parse func.] parseQuery(query, { skipDecode: true }) — 이미 decode 된 값 그대로 transform (URLSearchParams 시나리오)', () => {
  const product = route({
    path: '/id',
    typeQuery: {
      data: typeParser.string.optional,
      tags: typeParser.arrayOf(transformer.string).optional,
    },
  });

  // 단일 + 배열 모두 skipDecode 동작 검증.
  expect(product.parseQuery({ data: '[{"x":"4%"}]', tags: ['a%b', 'c%d'] }, { skipDecode: true })).toEqual({
    data: '[{"x":"4%"}]',
    tags: ['a%b', 'c%d'],
  });

  // skipDecode 기본 (false) 일 때는 decode 시도 → 에러.
  expect(() => product.parseQuery({ data: '[{"x":"4%"}]' })).toThrow(URIError);
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

describe('buildPath', () => {
  const routes = {
    USER: route({
      path: '/id',
      typeQuery: {
        startDate: typeParser.date.required,
      },
    }),
    MY_POST: route({
      path: '/feed/my/:active',
      typeParam: {
        active: typeParser.oneOf('myPost', 'userPost').required,
      },
      typeQuery: { id: typeParser.number.required, matchedId: typeParser.number.required },
      typeHash: ['section'],
    }),
  };

  it('should return the correct path with no parameter', () => {
    const result = routes.USER.buildPath();
    expect(result).toBe('/id');
  });

  it('should return the correct path with param and query', () => {
    const result = routes.MY_POST.buildPath({ param: { active: 'myPost' }, query: { id: 1, matchedId: 2 } });
    expect(result).toBe('/feed/my/myPost?id=1&matchedId=2');
  });

  it('should return the correct path with param, query, and hash', () => {
    const result = routes.MY_POST.buildPath({
      param: { active: 'myPost' },
      query: { id: 1, matchedId: 2 },
      hash: '#section',
    });
    expect(result).toBe('/feed/my/myPost?id=1&matchedId=2#section');
  });

  it('should return the correct path with param and hash', () => {
    const result = routes.MY_POST.buildPath({
      param: { active: 'myPost' },
      hash: '#section',
    });
    expect(result).toBe('/feed/my/myPost#section');
  });

  it('should handle empty param, query, and hash', () => {
    const result = routes.MY_POST.buildPath();
    expect(result).toBe('/feed/my/:active');
  });
});
