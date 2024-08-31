import { Inject } from "@nestjs/common";
import { getSqsQueueToken } from "./sqs.utils";

export const InjectSqsQueue = (queueAlias: string): ReturnType<typeof Inject> =>
  Inject(getSqsQueueToken(queueAlias));
