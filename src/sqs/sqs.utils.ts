import { Inject, Optional, Type, mixin } from "@nestjs/common";
import { SqsConstant } from "./sqs.constant";
import { mergeTokens } from "../utils/token";

/**
 * Function to generate the queue token for the sqs queue module provider
 * @param queueAlias - The queue alias to use for the base name
 * @returns - The queue token
 */
function getSqsQueueToken(queueAlias: string) {
  return mergeTokens(SqsConstant.SQS_QUEUE_TOKEN_PREFIX, queueAlias);
}

function getSqsQueueOptionsToken(queueAlias: string) {
  return mergeTokens(SqsConstant.SQS_QUEUE_OPTIONS_TOKEN_PREFIX, queueAlias);
}

function getSqsRootOptionsToken() {
  return SqsConstant.SQS_ROOT_MODULE_OPTIONS;
}

export { getSqsQueueOptionsToken, getSqsQueueToken, getSqsRootOptionsToken };
