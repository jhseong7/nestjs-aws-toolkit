import {
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
  SQSClient,
  SQSClientConfig,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
  SendMessageBatchResult,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { Logger, OnApplicationShutdown } from "@nestjs/common";
import {
  AwsSqsModuleOptions,
  AwsSqsReceiveMessageResponse,
  IAwsSqsModuleOptions,
} from "./sqs.type";

const MAX_BATCH_SIZE = 10;

/**
 * The actual queue class to interact with the AWS SQS
 * If the same queue name is provided, the same queue instance will be returned to the requested module
 */
class AwsSqsQueue implements OnApplicationShutdown {
  private readonly logger = new Logger(AwsSqsQueue.name);

  private readonly client: SQSClient;

  // Default queue url and message group id
  private readonly defaultQueueUrl: string | undefined;
  private readonly defaultMessageGroupId: string | undefined;

  constructor(options: IAwsSqsModuleOptions) {
    // Check if the required options are provided
    if (!AwsSqsModuleOptions.validate(options)) {
      this.logger.error("Invalid options provided");
      throw new Error("Invalid options provided");
    }

    const {
      region,
      accessKeyId,
      secretAccessKey,
      apiVersion,
      sqsQueueUrl,
      messageGroupId,
    } = options;

    const sqsConfig: SQSClientConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      apiVersion,
    };

    this.client = new SQSClient(sqsConfig);

    this.defaultQueueUrl = sqsQueueUrl;
    this.defaultMessageGroupId = messageGroupId;
  }

  /**
   * Get the default queue url. This method will throw if the default queue url is not provided through the constructor
   */
  private _getDefaultQueueUrl() {
    if (!this.defaultQueueUrl) {
      throw new Error(
        "Default queue url is not provided. You must provide at least one queue url"
      );
    }

    return this.defaultQueueUrl;
  }

  /**
   * Get the SQS client instance for direct access
   * @returns The SQS client instance
   */
  public getClient(): SQSClient {
    return this.client;
  }

  /**
   * Destroy the client on shutdown
   * @returns
   */
  public onApplicationShutdown(signal?: string) {
    this.logger.log(`Shutting down SQS client due to ${signal}`);
    this.client.destroy();
  }

  /**
   * Send message to the queue
   * @param param - The parameter
   * @returns - The promise
   */
  public async sendMessage<T>(param: {
    body: T;
    messageGroupId?: string;
    queueUrl?: string;
  }) {
    const {
      body,
      messageGroupId,
      queueUrl = this._getDefaultQueueUrl(),
    } = param;

    // Prepare the body
    const messageBody = typeof body === "string" ? body : JSON.stringify(body);

    const command = new SendMessageCommand({
      MessageBody: messageBody,
      QueueUrl: queueUrl,
      MessageDeduplicationId: Date.now().toString(),
      MessageGroupId: messageGroupId ?? this.defaultMessageGroupId,
    });

    try {
      return this.client.send(command);
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  /**
   * Send messages to the queue in batch
   * @param param - The parameter
   * @returns - The promise result
   */
  public async sendMessageBatch<T>(param: {
    bodyList: T[];
    messageGroupId?: string;
    queueUrl?: string;
  }) {
    const {
      bodyList,
      messageGroupId,
      queueUrl = this._getDefaultQueueUrl(),
    } = param;

    const dateNow = Date.now().toString();

    // The batch only supports 10 entries. If there are more than 10 entries, split them into multiple batches
    const batchRequestEntryList: SendMessageBatchRequestEntry[][] = [];
    for (let i = 0; i < bodyList.length; i += MAX_BATCH_SIZE) {
      batchRequestEntryList.push(
        bodyList.slice(i, i + MAX_BATCH_SIZE).map((body) => ({
          Id: "id_" + dateNow,
          MessageBody: typeof body === "string" ? body : JSON.stringify(body),
          MessageDeduplicationId: "deduplication_id_" + dateNow,
          MessageGroupId: messageGroupId ?? this.defaultMessageGroupId,
        }))
      );
    }

    const commandBatch = batchRequestEntryList.map(
      (requestEntryList) =>
        new SendMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: requestEntryList,
        })
    );

    try {
      // Send the batch and collect the result
      // NOTE: This might be throttle so sequential send is used instead of concurrent send using Promise.all
      const result: SendMessageBatchResult[] = [];
      for (const command of commandBatch) {
        result.push(await this.client.send(command));
      }

      // Reduce the result to a single result
      return result.reduce(
        (acc, curr) => {
          acc.Failed!.push(...(curr.Failed ?? []));
          acc.Successful!.push(...(curr.Successful ?? []));
          return acc;
        },
        {
          Failed: [],
          Successful: [],
        }
      );
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  /**
   * Poll and receive message from the queue. This will return the message body and a handler to acknowledge the message has been processed
   * @param options - The options
   * @returns - The promise
   */
  public async receiveMessage<T>(options?: {
    maxNumberOfMessages?: number;
    visibilityTimeout?: number;
    waitTimeSeconds?: number;
    queueUrl?: string;
  }): Promise<AwsSqsReceiveMessageResponse<T> | null> {
    const {
      maxNumberOfMessages = 1,
      visibilityTimeout = 5,
      waitTimeSeconds = 5,
      queueUrl = this._getDefaultQueueUrl(),
    } = options ?? {};

    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxNumberOfMessages,
      MessageAttributeNames: ["All"],
      VisibilityTimeout: visibilityTimeout,
      WaitTimeSeconds: waitTimeSeconds,
    });

    const response = await this.client.send(command);

    if (!response.Messages) return null;

    const messages = response.Messages.flatMap((message) => {
      let body: T;
      try {
        if (!message.Body) throw new Error("Message body is invalid");

        body = JSON.parse(message.Body) as T;
      } catch (e) {
        body = message.Body as unknown as T;
      }

      if (!message.ReceiptHandle) {
        // If the receipt handle is not provided, skip
        return [];
      }

      return [
        {
          body,
          receiptHandle: message.ReceiptHandle,
          onMessageComplete: async () =>
            this.deleteMessages(
              message.ReceiptHandle ? [message.ReceiptHandle] : [],
              queueUrl
            ),
        },
      ];
    });

    return {
      messages,
      onProcessComplete: async (receiptHandles) =>
        this.deleteMessages(receiptHandles, queueUrl),
    };
  }

  /**
   * Remove the message from the queue of the given receipt handle
   * @param receiptHandle - The receipt handle
   * @returns - The promise
   */
  public async deleteMessages(receiptHandleList: string[], queueUrl?: string) {
    const command = new DeleteMessageBatchCommand({
      QueueUrl: queueUrl ?? this._getDefaultQueueUrl(),
      Entries: receiptHandleList.map((handle, index) => ({
        // only leave alphanumeric characters in handle and shrink to 60 characters
        Id: `delete_${index}_${handle
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 60)}`,
        ReceiptHandle: handle,
      })),
    });

    try {
      return this.client.send(command);
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }
}

export { AwsSqsQueue };
