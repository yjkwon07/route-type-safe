import { urlQueryReplace, urlParamReplace } from './helpers';

type UseType = string | number | boolean | Date;

type BuildParam<ParseParam> = ParseParam extends null ? null : Record<keyof ParseParam, string>;

type BuildQuery<ParseQuery> = {
  [P in keyof ParseQuery]: ParseQuery[P] extends UseType[] ? string[] : string;
};

type TypeTransformerParser<T> = {
  [P in keyof T]: {
    type: (value?: unknown) => T[P];
    transformer: (value: any) => T[P];
  };
};

type UseTypeOfUndefinedKey<T> = {
  [K in keyof T]: T[K] extends UseType ? never : T[K] extends UseType[] ? never : K;
}[keyof T];

type TypeParserReturn<T extends { [K in keyof T]: (args: any) => unknown }> = SubPartial<
  { [K in keyof T]: ReturnType<T[K]> },
  UseTypeOfUndefinedKey<{ [K in keyof T]: ReturnType<T[K]> }>
>;

type NotNullReturn<T, F> = T extends null ? null : F;

type TypeParser<Parser> = { [P in keyof Parser]: (value: unknown) => Parser[P] };

export function build<
  Param extends Record<string, string> | null = null,
  Query extends Record<string, string | string[]> | null = null,
  Hash extends string | undefined = undefined,
  State extends Record<string, any> | null = null,
>(path: string) {
  return ({ param, query, hash, state }: { param?: BuildParam<Param>; query?: Query; hash?: Hash; state?: State }) => ({
    pathname: param ? `${urlParamReplace(path, param as any)}` : path,
    search: query ? `?${urlQueryReplace(query as any)}` : undefined,
    hash: hash || undefined,
    state: state || null,
  });
}

export function route<ParseParam = null, ParseQuery = null, Hash extends string[] = [], ParseState = null>({
  path,
  typeParam,
  typeQuery,
  typeHash,
  typeState,
}: {
  path: string;
  typeParam?: TypeTransformerParser<ParseParam>;
  typeQuery?: TypeTransformerParser<ParseQuery>;
  typeHash?: [...Hash];
  typeState?: TypeTransformerParser<ParseState>;
}) {
  function parseParam(
    param: Record<string, string>,
  ): ParseParam extends null ? Record<string, never> : { [P in keyof ParseParam]: ParseParam[P] } {
    const keyList = (typeParam && Object.keys(typeParam)) || [];

    return keyList.reduce((acc, key) => {
      acc[key] = param[key] && typeParam && typeParam[key as keyof ParseParam]?.transformer(param[key]);
      return acc;
    }, {} as any);
  }

  function parseQuery(
    query: Record<string, string | string[] | undefined>,
  ): ParseQuery extends null ? Record<string, never> : { [P in keyof ParseQuery]: ParseQuery[P] } {
    const keyList = (typeQuery && Object.keys(typeQuery)) || [];

    return keyList.reduce((acc, key) => {
      acc[key] = query[key] && typeQuery && typeQuery[key as keyof ParseQuery]?.transformer(query[key]);
      return acc;
    }, {} as any);
  }

  function parseHash(location: { hash: string }): [...Hash][number] {
    return typeHash ? (typeHash.find((hash) => hash === location.hash) as [...Hash][number]) : '';
  }

  function parseState(location: {
    state: unknown;
  }): ParseState extends null ? Record<string, never> : { [P in keyof ParseState]: ParseState[P] } {
    const keyList = typeState ? Object.keys(typeState) : [];

    return keyList.reduce((acc, key) => {
      acc[key] =
        (location.state as Record<string, any>)[key] &&
        typeState &&
        typeState[key as keyof ParseState]?.transformer((location.state as Record<string, any>)[key]);
      return acc;
    }, {} as any);
  }

  return {
    path,
    build: build<
      NotNullReturn<ParseParam, BuildParam<TypeParserReturn<TypeParser<ParseParam>>>>,
      NotNullReturn<ParseQuery, BuildQuery<TypeParserReturn<TypeParser<ParseQuery>>>>,
      [...Hash][number],
      NotNullReturn<ParseState, TypeParserReturn<TypeParser<ParseState>>>
    >(path),
    parseParam,
    parseQuery,
    parseHash,
    parseState,
  };
}
