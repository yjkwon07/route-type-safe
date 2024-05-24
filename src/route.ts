import { Location } from 'history';

import { SubPartial } from './global';
import { convertToString, convertToDecodeString, urlQueryReplace, urlParamReplace } from './helpers';

type UseType = string | number | boolean | Date;

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

export function build<Param = null, Query = null, Hash extends string | undefined = undefined, State = null>(
  path: string,
) {
  return ({ param, query, hash, state }: { param?: Param; query?: Query; hash?: Hash; state?: State }) => {
    return {
      pathname: param ? `${urlParamReplace(path, convertToString(param, { encode: true }))}` : path,
      search: query ? `?${urlQueryReplace(convertToString(query))}` : '',
      hash: hash || '',
      state: state || null,
    };
  };
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
    param: Record<string, string | undefined>,
  ): ParseParam extends null ? Record<string, never> : { [P in keyof ParseParam]: ParseParam[P] } {
    const decodeParam = convertToDecodeString(param, { decode: true });
    const keyList = (typeParam && Object.keys(typeParam)) || [];

    return keyList.reduce((acc, key) => {
      acc[key] = decodeParam[key] && typeParam && typeParam[key as keyof ParseParam]?.transformer(decodeParam[key]);
      return acc;
    }, {} as any);
  }

  function parseQuery(
    query: Record<string, string | string[] | undefined>,
  ): ParseQuery extends null ? Record<string, never> : { [P in keyof ParseQuery]: ParseQuery[P] | undefined } {
    const decodeQuery = convertToDecodeString(query, { decode: true });
    const keyList = (typeQuery && Object.keys(typeQuery)) || [];

    return keyList.reduce((acc, key) => {
      acc[key] = decodeQuery[key] && typeQuery && typeQuery[key as keyof ParseQuery]?.transformer(decodeQuery[key]);
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
        location.state && (location.state as Record<string, any>)[key] && typeState
          ? typeState[key as keyof ParseState]?.transformer((location.state as Record<string, any>)[key])
          : undefined;
      return acc;
    }, {} as any);
  }

  function parse(param: Record<string, string | undefined>): {
    param: ParseParam extends null ? Record<string, never> : { [P in keyof ParseParam]: ParseParam[P] };
  };
  function parse(
    param: Record<string, string | undefined>,
    location: Location,
  ): {
    param: ParseParam extends null ? Record<string, never> : { [P in keyof ParseParam]: ParseParam[P] };
    query: ParseQuery extends null ? Record<string, never> : { [P in keyof ParseQuery]: ParseQuery[P] | undefined };
    hash: [...Hash][number];
    state: ParseState extends null ? Record<string, never> : { [P in keyof ParseState]: ParseState[P] };
  };
  function parse(
    param: Record<string, string | undefined>,
    location?: Location,
  ): {
    param: ParseParam extends null ? Record<string, never> : { [P in keyof ParseParam]: ParseParam[P] };
    query?: ParseQuery extends null ? Record<string, never> : { [P in keyof ParseQuery]: ParseQuery[P] | undefined };
    hash?: [...Hash][number];
    state?: ParseState extends null ? Record<string, never> : { [P in keyof ParseState]: ParseState[P] };
  };
  function parse(
    param: Record<string, string | undefined>,
    location?: Location,
  ): {
    param: ParseParam extends null ? Record<string, never> : { [P in keyof ParseParam]: ParseParam[P] };
    query?: ParseQuery extends null ? Record<string, never> : { [P in keyof ParseQuery]: ParseQuery[P] | undefined };
    hash?: [...Hash][number];
    state?: ParseState extends null ? Record<string, never> : { [P in keyof ParseState]: ParseState[P] };
  } {
    const searchParams = urlQueryReplace(location?.search);
    const query = Object.fromEntries([...searchParams]);

    return {
      param: parseParam(param),
      query: location && parseQuery(query),
      hash: location && parseHash(location),
      state: location && parseState(location),
    };
  }

  return {
    path,
    build: build<
      NotNullReturn<ParseParam, TypeParserReturn<TypeParser<ParseParam>>>,
      NotNullReturn<ParseQuery, TypeParserReturn<TypeParser<ParseQuery>>>,
      `#${[...Hash][number]}`,
      NotNullReturn<ParseState, TypeParserReturn<TypeParser<ParseState>>>
    >(path),
    parse,
    parseParam,
    parseQuery,
    parseHash,
    parseState,
  };
}
