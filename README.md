## route-type-safe

- 페이지 정보 관리
- 페이지 링크 이동시 타입에 대한 힌트를 얻을 수 있음
- param, query 추출 하여 타입 파싱

## 컨셉

- 컨셉은 [react-router-typesafe-routes](https://www.npmjs.com/package/react-router-typesafe-routes)에서 영감을 받았다.
  - url을 만들기 위해 build를 사용하고, 파싱을 위해 parse함수를 사용한다.
  - 해당 라이브러리의 아쉬운 점은 param의 타입 힌트가 없으며, 모든 값이 optional로 타입이 지정이 된다. 또한, 해당 라이브러리의 param, query, state 함수를 호출해야만 타입이 지정되는 불편함이 있었다.

## 기능

### build

- 해당 라이브러리에서 `typeParser`로 타입 (`string` | `number` | `boolean` | `date` | `array` | `oneOf`)을 선택한 뒤, `required` , `optional` 함수를 넘겨주면 route 함수에서 타입 지정 build 함수가 생성된다.
- 타입의 힌트를 얻을 수 있으며, 페이지 컴포넌트는 route에서 리턴된 변수(product)를 사용하면 나중에 path, param, query, hash, state 정보가 바뀌더라도, 컴파일 에러 나는 부분만 고치기만 하면 되기 때문에 에디터 찾는 방법보다 효율적이면서 안정성이 확보가 된다.

#### Example

```typescript
import { route,typeParser } from 'route-type-safe';

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
```

<img src="https://user-images.githubusercontent.com/31876632/150670973-f866aca2-25c7-4630-8574-d1e6c128fc76.gif" />

### parse

- 모든 string 값을 typeParser 함수로 인해, 원하는 타입으로 변환해주는 `parse`기능을 볼 수 있다.

- 타입 힌트
  - `param`: typeParser에서 리턴된 required, optional에 따라 타입 힌트를 받을 수 있다.
  - `query`: 외부에서 url 기입 시, required위반이 될 수 있으므로 query의 parse부분은 모두 undefined(optional)로 올 수 있게끔 타입을 설정해 주었다.
  - `hash`: route 함수에서 아무런 값을 주지 않았을 때, never의 타입 힌트를 받으면 리턴되는 값은 '' 빈 문자열이다.
  - `state`: param과 동일한 효과를 받는다.

#### Example

```typescript
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
```

<img src="https://user-images.githubusercontent.com/31876632/150672419-d5f72796-7d48-48de-aa29-d3245500e807.gif" />

#### Example (react-router-dom)

```typescript
import { useSearchParams, useLocation, useParams } from 'react-router-dom';

const [searchParams] = useSearchParams();

const {
    param,
    query,
    hash,
    state,
} = routes.PRODUCTID.parse(useParams(), useLocation());
const { id } = routes.PRODUCTID.parseParam(useParams());
const query = routes.PRODUCTID.parseQuery({
  id: searchParams.get('id') || '',
  page: searchParams.getAll('page') || '',
});
const psHash = routes.PRODUCTID.parseHash(useLocation());
const psState = routes.PRODUCTID.parseState(useLocation());
```

#### Example (nextjs)

```typescript
// ! parse 함수는 삼가 router.asPath에서 hash 값을 파싱하지 못 해 정확환 파싱이 어려움 https://github.com/vercel/next.js/issues/25202
// state not support https://github.com/vercel/next.js/discussions/23991
const router = useRouter();

const { id } = routes.PRODUCTID.parseParam(useParams() as Record<string, string | undefined>);
const { id } = routes.PRODUCTID.parseParam(router.query as Record<string, string | undefined>); // ! has search data(key: value) in query
const { page }  = routes.PRODUCTID.parseQuery(router.query); // ! has param data(key: value) in query
const data = routes.PRODUCTID.parseHash({ hash: useHash() || '' });
```

##### useHash

```typescript
// https://github.com/vercel/next.js/discussions/49465#discussioncomment-7968587

'use client';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

const getHash = () => (typeof window !== 'undefined' ? window.location.hash : undefined);

const useHash = () => {
  const [isClient, setIsClient] = useState(false);
  const [hash, setHash] = useState(getHash());
  const params = useParams();

  useEffect(() => {
    setIsClient(true);
    setHash(getHash());
  }, [params]);

  return isClient ? hash : null;
};

export default useHash;
```

#### encode, decode

- `encode`, `decode`
  - param과 query가 외부에서 URL로 접속 시 encode가 필요한 경우가 있다.
  - 그래서 항상 param과 query는 build시에는 encode를 한 상태로 리턴이 되고, parse시에는 decode로 값을 다시 재 설정한다.
- 만약 외부에서 URL로 접속 시 **route에서 설정한 type 키(typeParser) 값이 아니라면, 제외 대상이 된다.**

```typescript
export const encode = (v: string, isEncode = false) => {
  if (isEncode) {
    // '*' escape except that same to return URLSearchParams func.
    return encodeURIComponent(v).replace(/[!'()]/g, (x) => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);
  }
  return v;
};

export const decode = (v: string, isDecode = false) => {
  if (isDecode) {
    return decodeURIComponent(v);
  }
  return v;
};
```

```typescript
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
```

