export const optionalTypeTransformer = <T, S>(transformer: (value: S) => T) => {
  return {
    optional: {
      type: (value?: unknown) => value as T | undefined,
      transformer,
    },
    required: {
      type: (value?: unknown) => value as T,
      transformer,
    },
  };
};

export const urlParamReplace = (url: string, param: Record<string, string>) => {
  let replaceUrl = url;
  Object.entries(param).forEach(([key, value]) => {
    const targetReplace = `:${key}`;
    replaceUrl = replaceUrl.replaceAll(targetReplace, value);
  });
  return replaceUrl;
};

export type ParamKeyValuePair = [string, string];
export type URLSearchParamsInit = string | ParamKeyValuePair[] | Record<string, string | string[]> | URLSearchParams;

/**
 * https://github.com/remix-run/react-router/blob/abbea846b8cccc30b62aa7da9d13f3fabff6f980/packages/react-router-dom/index.tsx?_pjax=%23js-repo-pjax-container%2C%20div%5Bitemtype%3D%22http%3A%2F%2Fschema.org%2FSoftwareSourceCode%22%5D%20main%2C%20%5Bdata-pjax-container%5D#L491
 * Creates a URLSearchParams object using the given initializer.
 *
 * This is identical to `new URLSearchParams(init)` except it also
 * supports arrays as values in the object form of the initializer
 * instead of just strings. This is convenient when you need multiple
 * values for a given key, but don't want to use an array initializer.
 *
 * For example, instead of:
 *
 *   let searchParams = new URLSearchParams([
 *     ['sort', 'name'],
 *     ['sort', 'price']
 *   ]);
 *
 * you can do:
 *
 *   let searchParams = urlQueryReplace({
 *     sort: ['name', 'price']
 *   });
 */
export function urlQueryReplace(init: URLSearchParamsInit = ''): URLSearchParams {
  return new URLSearchParams(
    typeof init === 'string' || Array.isArray(init) || init instanceof URLSearchParams
      ? init
      : Object.keys(init).reduce((memo, key) => {
          const value = init[key];
          return memo.concat(Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]);
        }, [] as ParamKeyValuePair[]),
  );
}