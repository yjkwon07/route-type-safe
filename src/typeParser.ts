import { optionalTypeTransformer } from './helpers';
import transformer from './transformer';

const string = optionalTypeTransformer(transformer.string);
const number = optionalTypeTransformer(transformer.number);
const boolean = optionalTypeTransformer(transformer.boolean);
const date = optionalTypeTransformer(transformer.date);
const oneOf = <T extends (string | number | boolean)[]>(...values: T) =>
  optionalTypeTransformer(transformer.oneOf(...values));
const arrayOf = <T>(fTransformer: (value: string) => T) => optionalTypeTransformer(transformer.arrayOf(fTransformer));

const typeParser = {
  string,
  number,
  boolean,
  date,
  oneOf,
  arrayOf,
};

export default typeParser;
