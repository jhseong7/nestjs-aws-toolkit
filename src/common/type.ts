/**
 * Type for the async option provider
 */
export type IModuleAsyncOptionBase<T = any> = {
  useFactory: (...args: any[]) => Promise<T> | T;
  inject?: any[];
};

/**
 * Type for the non-async option provider
 */
export type IModuleOptionBase<T> = {
  useValue: T;
};
