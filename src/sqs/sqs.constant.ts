const SqsConstant = {
  // Token for root options provider
  SQS_ROOT_MODULE_OPTIONS: "SqsRootModuleOptions",

  // Prefixes for queue options provider
  SQS_QUEUE_TOKEN_PREFIX: "SqsQueueToken_",
  SQS_QUEUE_OPTIONS_TOKEN_PREFIX: "SqsQueueOptionsToken_",
} as const;

export { SqsConstant };
