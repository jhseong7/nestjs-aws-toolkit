# AWS SQS Module for NestJS

## Description

This is a module and service providers to use AWS SQS in NestJS.

## Usage

Import the module in your module. First register the root module to share any common configs and then declare individual queues to use in your service.
This is simillar to the `@nestjs/bull`'s pattern so that is a good place for referencing

First register the common config infos in the root `AppModule`

Case 1: Sync init

```ts
import { Module } from '@nestjs/common';
import { AwsSqsModule } from '@pala-libs/aws';

@Module({
  imports: [
      AwsSqsModule.forRoot({
        region: process.env.AWS_SQS_REGION,
        accessKeyId: process.env.AWS_SQS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SQS_SECRET_ACCESS_KEY,
        apiVersion: process.env.AWS_SQS_API_VERSION,
        messageGroupId: process.env.AWS_SQS_MESSAGE_DEFAULT_GROUP_ID
        sqsQueueUrl: process.env.AWS_SQS_DEFAULT_QUEUE_URL,
    }),
  ]
})
export class AppModule {}
```

Case 2: Async Init

```ts
import { Module } from "@nestjs/common";
import { AwsSqsModule } from "@pala-libs/aws";

@Module({
  imports: [
    AwsSqsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        region: configService.getOrThrow<string>("AWS_SQS_REGION"),
        accessKeyId: configService.getOrThrow<string>("AWS_SQS_ACCESS_KEY_ID"),
        secretAccessKey: configService.getOrThrow<string>(
          "AWS_SQS_SECRET_ACCESS_KEY"
        ),
        apiVersion: configService.getOrThrow<string>(
          "AWS_SQS_API_VERSION",
          "2012-11-05"
        ),
        messageGroupId: configService.get<string>(
          "AWS_SQS_MESSAGE_DEFAULT_GROUP_ID"
        ),
        sqsQueueUrl: configService.get<string>("AWS_SQS_DEFAULT_QUEUE_URL"),
      }),
    }),
  ],
})
export class AppModule {}
```

Then for any new queue to use in your service should be declared in you module like below. Declare any config values you want to override from the root module

case 1: sync init

```ts
import { Module } from "@nestjs/common";
import { AwsSqsModule } from "@pala-libs/aws";

@Module({
  imports: [
    AwsSqsModule.registerQueue({
      queueName: "sample-queue",
      sqsQueueUrl: process.env.SAMPLE_SQS_QUEUE_URL_FOR_FEATURE,
    }),
  ],
})
export class SomeModule {}
```

case 2: async init

Getting configs from injected params are also possible

```ts
import { Module } from "@nestjs/common";
import { AwsSqsModule } from "@pala-libs/aws";

@Module({
  imports: [
    AwsSqsModule.registerQueueAsync({
      queueName: "sample-queue",
      useFactory: async (configService: ConfigService) => {
        return {
          sqsQueueUrl: configService.getOrThrow<string>(
            "SAMPLE_SQS_QUEUE_URL_FOR_FEATURE"
          ),
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class SomeModule {}
```

Arrays can also be provided for bulk initialization

```ts
import { Module } from "@nestjs/common";
import { AwsSqsModule } from "@pala-libs/aws";

@Module({
  imports: [
    AwsSqsModule.registerQueue([
      {
        queueName: "queue1",
        sqsQueueUrl: "test1",
      },
      {
        queueName: "queue2",
        sqsQueueUrl: "test2",
      },
      {
        queueName: "queue3",
        sqsQueueUrl: "test3",
      },
    ]),
    AwsSqsModule.registerQueueAsync([
      {
        queueName: "sample-queue",
        useFactory: async (configService: ConfigService) => {
          return {
            sqsQueueUrl: configService.getOrThrow<string>(
              "SAMPLE_SQS_QUEUE_URL_FOR_FEATURE"
            ),
          };
        },
        inject: [ConfigService],
      },
      {
        queueName: "sample-queue2",
        useFactory: async (configService: ConfigService) => {
          return {
            sqsQueueUrl: configService.getOrThrow<string>(
              "SAMPLE_SQS_QUEUE_URL_FOR_FEATURE2"
            ),
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
})
export class SomeModule {}
```

The to use the queue, use the `@InjectSqsQueue(queueName: string)` decorator to inject the queue `AwsSqsQueue` to your injectable class.

```ts
import { AwsSqsQueue, InjectSqsQueue } from "@pala-libs/aws";

@Injectable()
class SomeService {
  constructor(
    @InjectSqsQueue("sample-queue") private readonly sqsQueue: AwsSqsQueue
  ) {}
}
```

Multiple injections are also supported

```ts
import { AwsSqsQueue, InjectSqsQueue } from "@pala-libs/aws";

@Injectable()
class SomeService {
  constructor(
    @InjectSqsQueue("queue1") private readonly sqsQueue: AwsSqsQueue,
    @InjectSqsQueue("queue2") private readonly sqsQueue2: AwsSqsQueue,
    @InjectSqsQueue("queue3") private readonly sqsQueue3: AwsSqsQueue,
    @InjectSqsQueue("sample-queue") private readonly sqsQueue4: AwsSqsQueue,
    @InjectSqsQueue("sample-queue2") private readonly sqsQueue5: AwsSqsQueue
  ) {}
}
```

To consume the messages use a cron to poll the queue.

The messages will each have:

- body: the message body
- receiptHandle: the handle to delete the message from the queue
- onMessageComplete: a callback function to delete the message from the queue individually

The onProcessComplete gets the handle list as an array and deletes them from the queue in bulk. This is the recommended way to delete the messages from the queue.

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
class SomeService {
  constructor(@InjectSqsQueue('queue1') private readonly sqsQueue: AwsSqsQueue) {}

  @Cron("*/5 * * * * *")
  public async handleMessage(): Promise<void> {
    const {
      messages,
      onProcessComplete
    } = await this.sqsQueue.receiveMessage<string>({
      queueUrl: "https://some-queue-url"
    });
  }

  // Handle the messages
  const successHandleList: string[] = [];
  for(const message of messages) {
    const { body, receiptHandle, onMessageComplete } = message;

    // Either delete the message individually by calling the onMessageComplete
    if(body === "some-condition") {
      await onMessageComplete();
    }

    // Or push the handle to a list and delete them in bulk later
    if(body === "some-condition") {
      successHandleList.push(receiptHandle);
    }
  }

  // Delete the messages from the queue so they are not processed again
  await onProcessComplete(successHandleList);
}
```
