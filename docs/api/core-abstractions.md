# API Reference: Core Abstractions

## Type Definitions

### Configuration Types

#### `IModuleOptionBase<T>`

Base interface for synchronous module configuration.

```typescript
type IModuleOptionBase<T> = {
  useValue: T;
};
```

**Usage:**

```typescript
AwsSqsModule.forRoot({
  useValue: {
    region: 'us-east-1',
    credentials: { /* ... */ }
  }
});
```

#### `IModuleAsyncOptionBase<T>`

Base interface for asynchronous module configuration.

```typescript
type IModuleAsyncOptionBase<T> = {
  useFactory: (...args: any[]) => Promise<T> | T;
  inject?: any[];
};
```

**Usage:**

```typescript
AwsSqsModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    region: config.get('AWS_REGION')
  })
});
```

### SQS Types

#### `IAwsSqsModuleOptions`

Root SQS module configuration.

```typescript
interface IAwsSqsModuleOptions {
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  apiVersion?: string;
  sqsQueueUrl?: string;
  messageGroupId?: string;
}
```

#### `IAwsSqsFeatureModuleOptions`

Feature (queue) specific configuration.

```typescript
type IAwsSqsFeatureModuleOptions = Partial<IAwsSqsModuleOptions> & {
  queueName: string;
};
```

#### `IAwsSqsFeatureModuleAsyncOptions`

Asynchronous feature configuration.

```typescript
type IAwsSqsFeatureModuleAsyncOptions = Omit<
  IModuleAsyncOptionBase<Partial<IAwsSqsModuleOptions>>,
  'useFactory'
> & {
  queueName: string;
  useFactory: (
    ...args: any[]
  ) => Promise<Partial<IAwsSqsModuleOptions>> | Partial<IAwsSqsModuleOptions>;
};
```

#### `AwsSqsReceiveMessageResponse<T>`

Response from `receiveMessage()` method.

```typescript
type AwsSqsReceiveMessageResponse<T = unknown> = {
  messages: {
    body: T;
    receiptHandle: string;
    onMessageComplete: () => Promise<unknown>;
  }[];
  onProcessComplete: (receiptHandles: string[]) => Promise<unknown>;
};
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `messages` | Array | List of received messages |
| `messages[].body` | `T` | Deserialized message body |
| `messages[].receiptHandle` | `string` | Receipt handle for deletion |
| `messages[].onMessageComplete` | Function | Delete this specific message |
| `onProcessComplete` | Function | Batch delete multiple messages |

## Classes

### `AwsSqsModule`

Dynamic NestJS module for SQS integration.

#### Static Methods

##### `forRoot(options: IAwsSqsModuleOptions): DynamicModule`

Register root (shared) SQS configuration synchronously.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `IAwsSqsModuleOptions` | ✅ Yes | Root configuration |

**Returns:** `DynamicModule`

**Example:**

```typescript
AwsSqsModule.forRoot({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
```

##### `forRootAsync(options: IModuleAsyncOptionBase<IAwsSqsModuleOptions>): DynamicModule`

Register root configuration asynchronously.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `IModuleAsyncOptionBase<IAwsSqsModuleOptions>` | ✅ Yes | Async configuration |

**Returns:** `DynamicModule`

**Example:**

```typescript
AwsSqsModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    region: configService.get('AWS_REGION')
  })
});
```

##### `registerQueue(options: IAwsSqsFeatureModuleOptions | IAwsSqsFeatureModuleOptions[]): DynamicModule`

Register one or more queues synchronously.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `IAwsSqsFeatureModuleOptions \| IAwsSqsFeatureModuleOptions[]` | ✅ Yes | Queue configuration(s) |

**Returns:** `DynamicModule`

**Example:**

```typescript
AwsSqsModule.registerQueue({
  queueName: 'orders',
  sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/orders'
});

// Multiple queues
AwsSqsModule.registerQueue([
  { queueName: 'orders', sqsQueueUrl: '...' },
  { queueName: 'notifications', sqsQueueUrl: '...' }
]);
```

##### `registerQueueAsync(options: IAwsSqsFeatureModuleAsyncOptions | IAwsSqsFeatureModuleAsyncOptions[]): DynamicModule`

Register one or more queues asynchronously.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `IAwsSqsFeatureModuleAsyncOptions \| IAwsSqsFeatureModuleAsyncOptions[]` | ✅ Yes | Async queue configuration(s) |

**Returns:** `DynamicModule`

**Example:**

```typescript
AwsSqsModule.registerQueueAsync({
  queueName: 'orders',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    sqsQueueUrl: config.get('ORDERS_QUEUE_URL')
  })
});
```

### `AwsSqsQueue`

Queue client wrapper for AWS SQS operations.

#### Methods

##### `sendMessage<T>(param: SendMessageParams): Promise<SendMessageResult | null>`

Send a single message to the queue.

**Type Definition:**

```typescript
type SendMessageParams = {
  body: T;
  messageGroupId?: string;
  queueUrl?: string;
};
```

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `body` | `T` | ✅ Yes | - | Message body (auto-serialized if object) |
| `messageGroupId` | `string` | ❌ No | Constructor default | FIFO message group ID |
| `queueUrl` | `string` | ❌ No | Constructor default | Queue URL |

**Returns:** `Promise<SendMessageResult | null>`

**Example:**

```typescript
const result = await queue.sendMessage({
  body: { orderId: '123', status: 'pending' },
  messageGroupId: 'high-priority'
});

console.log('Message ID:', result?.MessageId);
```

##### `sendMessageBatch<T>(param: SendMessageBatchParams): Promise<SendMessageBatchResult | null>`

Send multiple messages in batches.

**Type Definition:**

```typescript
type SendMessageBatchParams = {
  bodyList: T[];
  messageGroupId?: string;
  queueUrl?: string;
};
```

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `bodyList` | `T[]` | ✅ Yes | - | Array of message bodies |
| `messageGroupId` | `string` | ❌ No | Constructor default | FIFO message group ID for all messages |
| `queueUrl` | `string` | ❌ No | Constructor default | Queue URL |

**Returns:** `Promise<SendMessageBatchResult | null>`

**Behavior:**
- Automatically chunks messages into batches of 10
- Sends batches sequentially to avoid throttling
- Aggregates results into single response

**Example:**

```typescript
const result = await queue.sendMessageBatch({
  bodyList: [
    { orderId: '1', status: 'pending' },
    { orderId: '2', status: 'pending' },
    // ... up to hundreds
  ]
});

console.log('Successful:', result?.Successful?.length);
console.log('Failed:', result?.Failed?.length);
```

##### `receiveMessage<T>(options?: ReceiveMessageOptions): Promise<AwsSqsReceiveMessageResponse<T> | null>`

Receive messages from the queue.

**Type Definition:**

```typescript
type ReceiveMessageOptions = {
  maxNumberOfMessages?: number;
  visibilityTimeout?: number;
  waitTimeSeconds?: number;
  queueUrl?: string;
};
```

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `maxNumberOfMessages` | `number` | ❌ No | `1` | Max messages to receive (1-10) |
| `visibilityTimeout` | `number` | ❌ No | `5` | Seconds message is hidden after receipt |
| `waitTimeSeconds` | `number` | ❌ No | `5` | Long polling wait time (0-20) |
| `queueUrl` | `string` | ❌ No | Constructor default | Queue URL |

**Returns:** `Promise<AwsSqsReceiveMessageResponse<T> | null>`

**Example:**

```typescript
const response = await queue.receiveMessage<Order>({
  maxNumberOfMessages: 10,
  visibilityTimeout: 30,
  waitTimeSeconds: 20
});

if (response) {
  for (const message of response.messages) {
    console.log('Order:', message.body);
    await message.onMessageComplete(); // Delete message
  }
}
```

##### `deleteMessages(receiptHandleList: string[], queueUrl?: string): Promise<DeleteMessageBatchResult | null>`

Delete messages from the queue.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `receiptHandleList` | `string[]` | ✅ Yes | - | Array of receipt handles |
| `queueUrl` | `string` | ❌ No | Constructor default | Queue URL |

**Returns:** `Promise<DeleteMessageBatchResult | null>`

**Example:**

```typescript
const response = await queue.receiveMessage({ maxNumberOfMessages: 10 });

if (response) {
  const handles = response.messages.map(m => m.receiptHandle);
  await queue.deleteMessages(handles);
}
```

##### `getClient(): SQSClient`

Get direct access to underlying AWS SDK SQSClient.

**Returns:** `SQSClient`

**Example:**

```typescript
import { PurgeQueueCommand } from '@aws-sdk/client-sqs';

const client = queue.getClient();
await client.send(new PurgeQueueCommand({
  QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/my-queue'
}));
```

##### `onApplicationShutdown(signal?: string): void`

Lifecycle hook for graceful shutdown (called automatically by NestJS).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `signal` | `string` | ❌ No | Shutdown signal name |

**Behavior:**
- Destroys SQS client
- Closes HTTP connections
- Releases resources

## Decorators

### `@InjectSqsQueue(queueName: string)`

Decorator to inject queue instance into service/controller.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `queueName` | `string` | ✅ Yes | Queue identifier (from `registerQueue`) |

**Returns:** Parameter decorator

**Example:**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectSqsQueue, AwsSqsQueue } from 'nestjs-aws-toolkit';

@Injectable()
export class OrderService {
  constructor(
    @InjectSqsQueue('orders') private ordersQueue: AwsSqsQueue
  ) {}
}
```

## Utility Functions

### `getSqsQueueToken(queueName: string): string`

Generate provider token for queue injection.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `queueName` | `string` | ✅ Yes | Queue identifier |

**Returns:** `string` - Provider token

**Usage:**

```typescript
import { getSqsQueueToken } from 'nestjs-aws-toolkit';

// In tests
const module = await Test.createTestingModule({
  providers: [
    {
      provide: getSqsQueueToken('orders'),
      useValue: mockQueue
    }
  ]
}).compile();
```

## Constants

### Token Constants

```typescript
export const AWS_SQS_MODULE_OPTIONS = 'SqsRootModuleOptions';
```

Used internally for provider token generation.

## Generic Factory Types

### `AwsModuleFactoryOptions<Feat, Root, Client>`

Configuration for creating new AWS module factories.

```typescript
type AwsModuleFactoryOptions<Feat, Root, Client> = {
  tokenRoot: string;
  baseModuleOptionGetter: () => DynamicModule;
  clientInstantiator: (options: Root & Feat) => Client;
  featureIdentifierGetter: (option: Feat | IModuleAsyncOptionBase<Feat>) => string;
};
```

**Usage (for library developers):**

```typescript
const factory = new AwsModuleFactory({
  tokenRoot: 'SqsRootModuleOptions',
  clientInstantiator: (options) => new AwsSqsQueue(options),
  featureIdentifierGetter: (opt) => opt.queueName,
  baseModuleOptionGetter: () => ({ module: AwsSqsModule })
});
```

## Type Constraints

### Generic Type Parameters

```typescript
class AwsModuleFactory<Feat extends Partial<Root>, Root, Client = any>
```

**Constraints:**
- `Feat` must extend `Partial<Root>` - ensures feature options can override root options
- `Root` can be any type - represents shared configuration
- `Client` defaults to `any` - represents AWS service client type

## Next Steps

- **[SQS Module Guide](../modules/sqs.md)** - Complete usage documentation
- **[Configuration Guide](../guides/configuration.md)** - All configuration options
- **[Architecture Overview](../architecture/overview.md)** - System design
