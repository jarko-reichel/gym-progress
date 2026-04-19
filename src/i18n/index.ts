import { sk } from './sk';

type Dict = typeof sk;
type Path<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? Path<T[K], `${P}${K}.`>
    : `${P}${K}`;
}[keyof T & string];

export type TKey = Path<Dict>;

const dictionary: Dict = sk;

export function t(key: TKey): string {
  const parts = key.split('.');
  let cur: unknown = dictionary;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  return typeof cur === 'string' ? cur : key;
}
