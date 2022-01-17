import { convertToString } from '../src/helpers';

it('[convertToString func.] All value convert to string type', () => {
  const useType = {
    a: 1,
    b: true,
    c: [1, 2],
    d: ['1', '2'],
    e: [true, false],
    f: [true, '2'],
    g: new Date('2022-03-01'),
    h: [new Date('2022-03-01')],
  };

  expect(convertToString(useType)).toEqual({
    a: '1',
    b: 'true',
    c: ['1', '2'],
    d: ['1', '2'],
    e: ['true', 'false'],
    f: ['true', '2'],
    g: '2022-03-01T00:00:00.000Z',
    h: ['2022-03-01T00:00:00.000Z'],
  });
});

it('[convertToString func.] Date NaN => Invalid Date', () => {
  const useType = {
    a: new Date('NaN2020aaa-03-02'),
  };
  const dateParse = new Date(convertToString(useType).a);

  expect(convertToString(useType)).toEqual({
    a: 'Invalid Date',
  });
  expect(dateParse.getTime()).toEqual(NaN);
  expect(dateParse.toString()).toEqual('Invalid Date');
});
