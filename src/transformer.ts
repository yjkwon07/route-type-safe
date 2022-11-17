const stringTransformer = (value: string): string => {
  return value;
};

const numberTransformer = (value: string): number => {
  const result = Number(value);

  if (Number.isNaN(result)) {
    throw new Error(`Failed to convert ${value} to number`);
  }

  return result;
};

const booleanTransformer = (value: string): boolean => {
  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`Failed to convert ${value} to boolean`);
};

const dateTransformer = (value: string): Date => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Couldn't transform ${value} to date`);
  }

  return date;
};

const oneOfTransformer = <T extends (string | number | boolean)[]>(...values: T) => {
  return (value: string): T[number] => {
    for (const canonicalValue of values) {
      switch (typeof canonicalValue) {
        case 'string':
          if (stringTransformer(value) === canonicalValue) return canonicalValue;
          break;
        case 'number':
          if (numberTransformer(value) === canonicalValue) return canonicalValue;
          break;
        case 'boolean':
          if (booleanTransformer(value) === canonicalValue) return canonicalValue;
          break;
        default:
          break;
      }
    }

    throw new Error(`No matching value for ${value}`);
  };
};

const arrayOfTransformer = <T>(transformer: (value: string) => T) => {
  return (value: string[]): T[] => {
    // if come to one value is not array, didn't return array
    // absolutely return array if is not array one primary value (except array)
    return ([].concat(value as any) as string[]).map((item) => transformer(item));
  };
};

const transformer = {
  string: stringTransformer,
  number: numberTransformer,
  boolean: booleanTransformer,
  date: dateTransformer,
  oneOf: oneOfTransformer,
  arrayOf: arrayOfTransformer,
};

export default transformer;
