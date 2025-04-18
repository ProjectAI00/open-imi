type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type Mutate<T> = Partial<T> | ((prev: T) => Partial<T>);

type Override<T, R> = Omit<T, keyof R> & R;

type ValueOf<T> = T[keyof T];
