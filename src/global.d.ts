// https://stackoverflow.com/questions/56018167/typescript-does-not-copy-d-ts-files-to-build
// after tsc, d.ts file is not build

declare type SubPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
