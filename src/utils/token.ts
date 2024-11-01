/**
 * Util function to get the tokens for the nestjs providers
 */

import { Inject, mixin, Optional, Type } from '@nestjs/common';

// Pattern ref from: https://github.com/nestjs/bull/blob/master/packages/bull-shared/lib/helpers/create-conditional-dep-holder.helper.ts#L8
// This function acts as a factory to create a common options holder
export interface ICommonOptionsHolder<T> {
  get(): T;
}

/**
 * a nestjs provider to provide the option values of the given token
 * @param optionsToken
 * @returns
 */
export function createOptionsProvider<T = unknown>(
  optionsToken: string
): Type<ICommonOptionsHolder<T>> {
  // Create an anonymous class to hold the options
  class CommonOptionsHolder {
    // Optional as the forRoot might not exist
    constructor(@Optional() @Inject(optionsToken) public options: T) {}

    public get(): T {
      return this.options;
    }
  }

  // Mixin is simillar to Injectable, but does it dynamically
  return mixin(CommonOptionsHolder);
}

export function mergeTokens(...tokens: string[]) {
  if (tokens.length === 0) {
    throw new Error('At least one token is required to merge');
  }

  return tokens.join('_');
}

export function getModuleTokenFunctions(rootToken: string) {
  return {
    getRootToken: () => rootToken,
    getFeatureToken: (...featureToken: string[]) =>
      mergeTokens(rootToken, 'Feature', ...featureToken),
    getFeatureOptionsToken: (...featureToken: string[]) =>
      mergeTokens(rootToken, 'Feature', 'Options', ...featureToken),
  };
}
