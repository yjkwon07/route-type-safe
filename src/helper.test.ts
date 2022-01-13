import { convertToString } from './helpers';

it('[convertToString func.] All value convert to string type', () => {
  const useType = {
    a: 1,
    b: true,
    c: [1, 2],
    d: ['1', '2'],
    e: [true, false],
    f: [true, '2'],
    g: new Date('2020-03-02'),
    h: [new Date('2020-03-02')],
  };

  expect(convertToString(useType)).toEqual({
    a: '1',
    b: 'true',
    c: ['1', '2'],
    d: ['1', '2'],
    e: ['true', 'false'],
    f: ['true', '2'],
    g: '1583107200000',
    h: ['1583107200000'],
  });
});

it('[convertToString func.] Date NaN => Invalid Date', () => {
  const useType = {
    a: new Date('NaN2020-03-02'),
  };
  const dateParse = new Date(convertToString(useType).a);

  expect(convertToString(useType)).toEqual({
    a: 'NaN',
  });
  expect(dateParse.getTime()).toEqual(NaN);
  expect(dateParse.toString()).toEqual('Invalid Date');
});
