import { Inject, Optional, Type, mixin } from "@nestjs/common";
import { SqsConstant } from "./sqs.constant";

/**
 * Function to generate the queue token for the sqs queue module provider
 * @param queueAlias - The queue alias to use for the base name
 * @returns - The queue token
 */
function getSqsQueueToken(queueAlias: string) {
  return `${SqsConstant.SQS_QUEUE_TOKEN_PREFIX}${queueAlias}`;
}

function getSqsQueueOptionsToken(queueAlias: string) {
  return `${SqsConstant.SQS_QUEUE_OPTIONS_TOKEN_PREFIX}${queueAlias}`;
}

function getSqsRootOptionsToken() {
  return SqsConstant.SQS_ROOT_MODULE_OPTIONS;
}

// Pattern ref from: https://github.com/nestjs/bull/blob/master/packages/bull-shared/lib/helpers/create-conditional-dep-holder.helper.ts#L8
// This function acts as a factory to create a common options holder
interface ICommonOptionsHolder<T> {
  get(): T;
}

function createCommonOptionsHolder<T = unknown>(
  optionsToken: string
): Type<ICommonOptionsHolder<T>> {
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

export type { ICommonOptionsHolder };

export {
  createCommonOptionsHolder,
  getSqsQueueOptionsToken,
  getSqsQueueToken,
  getSqsRootOptionsToken,
};
