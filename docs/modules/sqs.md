# AWS SQS Module Guide

## Overview

The AWS SQS module provides a production-ready integration with Amazon Simple Queue Service (SQS) for NestJS applications. It supports both standard and FIFO queues with features like batch operations, long polling, and graceful shutdown.

**Status**: ✅ Production Ready
**Version**: 1.0.0+

```
┌────────────────────────────────────────────────────────┐
│              AWS SQS Module                            │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Core Features:                                        │
│  ✅ Send single messages                               │
│  ✅ Send message batches (auto-chunking)               │
│  ✅ Receive messages with long polling                 │
│  ✅ Delete processed messages (batch support)          │
│  ✅ FIFO queue support                                 │
│  ✅ Multiple queue instances                           │
│  ✅ Graceful shutdown                                  │
│  ✅ Direct SQSClient access for advanced use           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install nestjs-aws-toolkit @aws-sdk/client-sqs
```

## Quick Start

### 1. Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { AwsSqsModule } from 'nestjs-aws-toolkit';

@Module({
  imports: [
    AwsSqsModule.forRoot({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    }),
    AwsSqsModule.registerQueue({
      queueName: 'my-queue',
      sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/my-queue'
    })
  ]
})
export class AppModule {}
```

### 2. Inject and Use Queue

```typescript
import { Injectable } from '@nestjs/common';
import { InjectSqsQueue, AwsSqsQueue } from 'nestjs-aws-toolkit';

@Injectable()
export class MyService {
  constructor(
    @InjectSqsQueue('my-queue') private queue: AwsSqsQueue
  ) {}

  async sendMessage(data: any) {
    await this.queue.sendMessage({ body: data });
  }

  async processMessages() {
    const response = await this.queue.receiveMessage({
      maxNumberOfMessages: 10
    });

    if (!response) return;

    for (const message of response.messages) {
      console.log('Processing:', message.body);
      await message.onMessageComplete(); // Delete after processing
    }
  }
}
```

## Configuration

### Root Configuration (Shared Across Queues)

```mermaid
graph LR
    A[forRoot Config] -->|Shared credentials| B[Queue 1]
    A -->|Shared region| C[Queue 2]
    A -->|Shared settings| D[Queue N]

    B -->|Can override| B1[Specific URL]
    C -->|Can override| C1[Custom GroupID]
    D -->|Inherit all| D1[Use defaults]

    style A fill:#f59e0b,stroke:#d97706,color:#fff
    style B fill:#3b82f6,stroke:#1e40af,color:#fff
    style C fill:#3b82f6,stroke:#1e40af,color:#fff
    style D fill:#3b82f6,stroke:#1e40af,color:#fff
```

#### Synchronous Configuration

```typescript
AwsSqsModule.forRoot({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  },
  apiVersion: '2012-11-05',
  sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/default-queue',
  messageGroupId: 'default-group' // For FIFO queues
})
```

#### Asynchronous Configuration (Recommended)

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AwsSqsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        region: configService.getOrThrow<string>('AWS_SQS_REGION'),
        credentials: {
          accessKeyId: configService.getOrThrow<string>('AWS_SQS_ACCESS_KEY_ID'),
          secretAccessKey: configService.getOrThrow<string>('AWS_SQS_SECRET_ACCESS_KEY')
        },
        apiVersion: configService.get<string>('AWS_SQS_API_VERSION', '2012-11-05')
      })
    })
  ]
})
export class AppModule {}
```

**Environment Variables (.env):**

```bash
AWS_SQS_REGION=us-east-1
AWS_SQS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SQS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SQS_API_VERSION=2012-11-05
```

### Feature Configuration (Per Queue)

#### Synchronous Queue Registration

```typescript
AwsSqsModule.registerQueue({
  queueName: 'orders',
  sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/orders-queue',
  messageGroupId: 'order-processing' // Override root default
})
```

#### Asynchronous Queue Registration

```typescript
AwsSqsModule.registerQueueAsync({
  queueName: 'orders',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    sqsQueueUrl: configService.getOrThrow<string>('ORDERS_QUEUE_URL'),
    messageGroupId: configService.get<string>('ORDERS_MESSAGE_GROUP_ID', 'default')
  })
})
```

#### Multiple Queues

```typescript
@Module({
  imports: [
    AwsSqsModule.forRoot({
      region: 'us-east-1',
      credentials: { /* ... */ }
    }),
    AwsSqsModule.registerQueue([
      {
        queueName: 'orders',
        sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/orders'
      },
      {
        queueName: 'notifications',
        sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/notifications'
      },
      {
        queueName: 'analytics',
        sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/analytics'
      }
    ])
  ]
})
export class AppModule {}
```

## API Reference

### AwsSqsQueue Class

#### sendMessage()

Send a single message to the queue.

```typescript
async sendMessage<T>(param: {
  body: T;
  messageGroupId?: string;
  queueUrl?: string;
}): Promise<SendMessageResult | null>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `body` | `T` | ✅ Yes | Message body (auto-serialized to JSON if object) |
| `messageGroupId` | `string` | ❌ No | Message group ID for FIFO queues (overrides default) |
| `queueUrl` | `string` | ❌ No | Queue URL (overrides default) |

**Returns:** `SendMessageResult` from AWS SDK or `null` on error

**Example:**

```typescript
// Simple message
await queue.sendMessage({
  body: { orderId: '123', status: 'pending' }
});

// With FIFO group override
await queue.sendMessage({
  body: { orderId: '456', status: 'urgent' },
  messageGroupId: 'high-priority'
});

// To different queue
await queue.sendMessage({
  body: { notification: 'Order shipped' },
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/notifications'
});
```

**ASCII Flow:**

```
┌────────────────────────────────────────────────────┐
│ sendMessage({ body: { orderId: 123 } })           │
└───────────┬────────────────────────────────────────┘
            │
    ┌───────▼───────┐
    │ Serialize body│
    │ (JSON.stringify│
    └───────┬────────┘
            │
    ┌───────▼────────┐
    │ Add metadata:  │
    │ • DeduplicationID│
    │ • GroupID      │
    └───────┬────────┘
            │
    ┌───────▼────────┐
    │ Send to SQS    │
    │ via AWS SDK    │
    └───────┬────────┘
            │
    ┌───────▼────────┐
    │ Return result  │
    │ or null on err │
    └────────────────┘
```

#### sendMessageBatch()

Send multiple messages in batches (automatically chunks into groups of 10).

```typescript
async sendMessageBatch<T>(param: {
  bodyList: T[];
  messageGroupId?: string;
  queueUrl?: string;
}): Promise<SendMessageBatchResult | null>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bodyList` | `T[]` | ✅ Yes | Array of message bodies |
| `messageGroupId` | `string` | ❌ No | Message group ID for all messages (FIFO) |
| `queueUrl` | `string` | ❌ No | Queue URL (overrides default) |

**Returns:** Aggregated `SendMessageBatchResult` with `Successful` and `Failed` arrays

**Example:**

```typescript
const orders = [
  { orderId: '1', status: 'pending' },
  { orderId: '2', status: 'pending' },
  // ... up to 100s of orders
];

const result = await queue.sendMessageBatch({
  bodyList: orders
});

console.log(`Successful: ${result.Successful.length}`);
console.log(`Failed: ${result.Failed.length}`);
```

**Auto-Chunking:**

```
Input: 35 messages
  │
  ├─→ Batch 1: Messages 1-10   (SendMessageBatchCommand)
  ├─→ Batch 2: Messages 11-20  (SendMessageBatchCommand)
  ├─→ Batch 3: Messages 21-30  (SendMessageBatchCommand)
  └─→ Batch 4: Messages 31-35  (SendMessageBatchCommand)

Results aggregated into single response:
  {
    Successful: [...],  // All successful sends
    Failed: [...]       // All failed sends
  }
```

**Throttling Protection:**

```typescript
// Sequential sending to avoid throttling
// (NOT concurrent with Promise.all)
for (const command of commandBatch) {
  result.push(await this.client.send(command));
}
```

#### receiveMessage()

Poll and receive messages from the queue with long polling support.

```typescript
async receiveMessage<T>(options?: {
  maxNumberOfMessages?: number;
  visibilityTimeout?: number;
  waitTimeSeconds?: number;
  queueUrl?: string;
}): Promise<AwsSqsReceiveMessageResponse<T> | null>
```

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `maxNumberOfMessages` | `number` | `1` | Max messages to receive (1-10) |
| `visibilityTimeout` | `number` | `5` | Seconds message is hidden after receipt |
| `waitTimeSeconds` | `number` | `5` | Long polling wait time (0-20) |
| `queueUrl` | `string` | Default | Queue URL |

**Returns:** `AwsSqsReceiveMessageResponse<T>` or `null` if no messages

**Response Structure:**

```typescript
type AwsSqsReceiveMessageResponse<T> = {
  messages: {
    body: T;
    receiptHandle: string;
    onMessageComplete: () => Promise<unknown>; // Delete this message
  }[];
  onProcessComplete: (receiptHandles: string[]) => Promise<unknown>; // Batch delete
};
```

**Example: Cron Job Pattern**

```typescript
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectSqsQueue, AwsSqsQueue } from 'nestjs-aws-toolkit';

@Injectable()
export class OrderProcessor {
  constructor(
    @InjectSqsQueue('orders') private ordersQueue: AwsSqsQueue
  ) {}

  @Cron('*/10 * * * * *') // Every 10 seconds
  async processOrders() {
    const response = await this.ordersQueue.receiveMessage<Order>({
      maxNumberOfMessages: 10,
      visibilityTimeout: 30,  // 30 seconds to process
      waitTimeSeconds: 20     // Long polling
    });

    if (!response) {
      console.log('No messages');
      return;
    }

    const failedHandles: string[] = [];

    for (const message of response.messages) {
      try {
        await this.handleOrder(message.body);
        // Success - will be deleted below
      } catch (error) {
        console.error('Failed to process:', error);
        failedHandles.push(message.receiptHandle);
      }
    }

    // Delete only successfully processed messages
    const successHandles = response.messages
      .filter(m => !failedHandles.includes(m.receiptHandle))
      .map(m => m.receiptHandle);

    await response.onProcessComplete(successHandles);
  }

  private async handleOrder(order: Order) {
    // Your business logic here
  }
}
```

**Long Polling Diagram:**

```mermaid
sequenceDiagram
    participant App as Application
    participant SQS as AWS SQS Queue

    App->>SQS: receiveMessage({ waitTimeSeconds: 20 })
    Note over SQS: Queue is empty
    Note over SQS: Wait up to 20 seconds<br/>for messages to arrive
    Note over SQS: Message arrives after 5s
    SQS-->>App: Return message immediately
    App->>App: Process message
    App->>SQS: deleteMessage(receiptHandle)
    SQS-->>App: Message deleted
```

**Visibility Timeout Diagram:**

```
Message received:
  ┌───────────────────────────────────────────┐
  │ Message becomes INVISIBLE to other consumers│
  │ for 30 seconds (visibilityTimeout)        │
  └───────────┬───────────────────────────────┘
              │
      ┌───────▼────────┐
      │ Processing...  │
      │ (25 seconds)   │
      └───────┬────────┘
              │
      ┌───────▼────────────┐
      │ onMessageComplete()│
      │ (deletes message)  │
      └────────────────────┘

If processing takes > 30s and message not deleted:
  → Message becomes VISIBLE again
  → Another consumer might pick it up
  → Risk of duplicate processing!
```

#### deleteMessages()

Manually delete messages from the queue.

```typescript
async deleteMessages(
  receiptHandleList: string[],
  queueUrl?: string
): Promise<DeleteMessageBatchResult | null>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `receiptHandleList` | `string[]` | ✅ Yes | Array of receipt handles to delete |
| `queueUrl` | `string` | ❌ No | Queue URL (overrides default) |

**Example:**

```typescript
const response = await queue.receiveMessage({ maxNumberOfMessages: 10 });

if (response) {
  // Process messages...

  // Manual batch delete
  const handles = response.messages.map(m => m.receiptHandle);
  await queue.deleteMessages(handles);
}
```

#### getClient()

Get direct access to the underlying `SQSClient` for advanced operations.

```typescript
getClient(): SQSClient
```

**Example:**

```typescript
import { PurgeQueueCommand } from '@aws-sdk/client-sqs';

const client = queue.getClient();

// Purge entire queue (advanced operation)
await client.send(new PurgeQueueCommand({
  QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/my-queue'
}));
```

#### onApplicationShutdown()

Lifecycle hook for graceful shutdown (automatically called by NestJS).

```typescript
onApplicationShutdown(signal?: string): void
```

**Behavior:**

```
Application shutdown initiated:
  │
  ├─→ NestJS calls onApplicationShutdown()
  │
  ├─→ AwsSqsQueue.client.destroy()
  │   └─ Closes all HTTP connections
  │   └─ Releases resources
  │
  └─→ Application exits cleanly
```

## Common Patterns

### Pattern 1: Event-Driven Order Processing

```typescript
// ────────────────────────────────────────────────
// OrderModule - Produces order events
// ────────────────────────────────────────────────
@Module({
  imports: [
    AwsSqsModule.registerQueueAsync({
      queueName: 'orders',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        sqsQueueUrl: config.get('ORDERS_QUEUE_URL')
      })
    })
  ],
  providers: [OrderService]
})
export class OrderModule {}

@Injectable()
export class OrderService {
  constructor(
    @InjectSqsQueue('orders') private ordersQueue: AwsSqsQueue
  ) {}

  async createOrder(orderData: CreateOrderDto) {
    const order = await this.saveToDatabase(orderData);

    // Emit event to queue
    await this.ordersQueue.sendMessage({
      body: {
        eventType: 'ORDER_CREATED',
        orderId: order.id,
        customerId: order.customerId,
        items: order.items,
        totalAmount: order.totalAmount
      }
    });

    return order;
  }
}

// ────────────────────────────────────────────────
// ProcessorModule - Consumes order events
// ────────────────────────────────────────────────
@Module({
  imports: [
    AwsSqsModule.registerQueue({
      queueName: 'orders',
      sqsQueueUrl: process.env.ORDERS_QUEUE_URL
    })
  ],
  providers: [OrderProcessor]
})
export class ProcessorModule {}

@Injectable()
export class OrderProcessor {
  constructor(
    @InjectSqsQueue('orders') private ordersQueue: AwsSqsQueue
  ) {}

  @Cron('*/5 * * * * *') // Every 5 seconds
  async processOrderEvents() {
    const response = await this.ordersQueue.receiveMessage<OrderEvent>({
      maxNumberOfMessages: 10,
      visibilityTimeout: 60,
      waitTimeSeconds: 20
    });

    if (!response) return;

    for (const message of response.messages) {
      const { eventType, orderId } = message.body;

      switch (eventType) {
        case 'ORDER_CREATED':
          await this.handleOrderCreated(message.body);
          break;
        case 'ORDER_UPDATED':
          await this.handleOrderUpdated(message.body);
          break;
      }

      await message.onMessageComplete();
    }
  }

  private async handleOrderCreated(event: OrderEvent) {
    // Send confirmation email
    // Update inventory
    // Notify fulfillment center
  }
}
```

### Pattern 2: Fan-Out (Multiple Queues)

```typescript
@Injectable()
export class NotificationService {
  constructor(
    @InjectSqsQueue('email-notifications') private emailQueue: AwsSqsQueue,
    @InjectSqsQueue('sms-notifications') private smsQueue: AwsSqsQueue,
    @InjectSqsQueue('push-notifications') private pushQueue: AwsSqsQueue
  ) {}

  async notifyOrderShipped(order: Order) {
    const notification = {
      orderId: order.id,
      customerId: order.customerId,
      message: `Your order #${order.id} has shipped!`
    };

    // Fan out to multiple queues
    await Promise.all([
      this.emailQueue.sendMessage({ body: notification }),
      this.smsQueue.sendMessage({ body: notification }),
      this.pushQueue.sendMessage({ body: notification })
    ]);
  }
}
```

**ASCII Diagram:**

```
┌────────────────────┐
│ notifyOrderShipped │
└─────────┬──────────┘
          │
          ├─→ Email Queue ────→ Email Worker
          │
          ├─→ SMS Queue ──────→ SMS Worker
          │
          └─→ Push Queue ─────→ Push Worker
```

### Pattern 3: Dead Letter Queue (DLQ)

```typescript
// Configure DLQ in AWS SQS (not in code)
// Main queue: orders-queue
// DLQ: orders-dlq (receives failed messages after N retries)

@Injectable()
export class OrderProcessor {
  constructor(
    @InjectSqsQueue('orders') private ordersQueue: AwsSqsQueue,
    @InjectSqsQueue('orders-dlq') private dlqQueue: AwsSqsQueue
  ) {}

  @Cron('*/5 * * * * *')
  async processOrders() {
    // Process main queue
    const response = await this.ordersQueue.receiveMessage({
      maxNumberOfMessages: 10
    });

    if (response) {
      for (const message of response.messages) {
        try {
          await this.handleOrder(message.body);
          await message.onMessageComplete();
        } catch (error) {
          // Don't delete - let it retry and eventually move to DLQ
          console.error('Processing failed:', error);
        }
      }
    }
  }

  @Cron('0 */5 * * * *') // Every 5 minutes
  async processDLQ() {
    // Investigate and handle failures
    const response = await this.dlqQueue.receiveMessage({
      maxNumberOfMessages: 10
    });

    if (response) {
      for (const message of response.messages) {
        // Log for manual investigation
        console.error('DLQ message:', message.body);

        // Optionally retry with fixes
        try {
          await this.handleOrderWithFallback(message.body);
          await message.onMessageComplete();
        } catch {
          // Leave in DLQ for manual review
        }
      }
    }
  }
}
```

### Pattern 4: FIFO Queue with Message Grouping

```typescript
@Injectable()
export class PaymentService {
  constructor(
    @InjectSqsQueue('payments') private paymentsQueue: AwsSqsQueue
  ) {}

  async processPayment(customerId: string, amount: number) {
    // FIFO queue ensures order of messages per customer
    await this.paymentsQueue.sendMessage({
      body: {
        customerId,
        amount,
        timestamp: Date.now()
      },
      messageGroupId: customerId // All messages for same customer processed in order
    });
  }
}
```

**FIFO Guarantees:**

```
Customer A sends 3 payments:
  Payment 1 (GroupID: "A") ──→ Processed first
  Payment 2 (GroupID: "A") ──→ Processed second
  Payment 3 (GroupID: "A") ──→ Processed third

Customer B sends 2 payments (concurrent with A):
  Payment 1 (GroupID: "B") ──→ Processed in parallel to A
  Payment 2 (GroupID: "B") ──→ After B's payment 1

Guarantee: Messages within same GroupID are STRICTLY ordered
           Messages across different GroupIDs can be parallel
```

## Testing

### Unit Testing with Mocks

```typescript
import { Test } from '@nestjs/testing';
import { OrderService } from './order.service';
import { getSqsQueueToken } from 'nestjs-aws-toolkit';

describe('OrderService', () => {
  let service: OrderService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      sendMessage: jest.fn().mockResolvedValue({ MessageId: '123' }),
      receiveMessage: jest.fn().mockResolvedValue(null),
      deleteMessages: jest.fn().mockResolvedValue({})
    };

    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getSqsQueueToken('orders'),
          useValue: mockQueue
        }
      ]
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should send order to queue', async () => {
    await service.createOrder({ items: [] });

    expect(mockQueue.sendMessage).toHaveBeenCalledWith({
      body: expect.objectContaining({
        eventType: 'ORDER_CREATED'
      })
    });
  });
});
```

### Integration Testing with LocalStack

```typescript
// Use LocalStack for local SQS testing
import { AwsSqsModule } from 'nestjs-aws-toolkit';

@Module({
  imports: [
    AwsSqsModule.forRoot({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      },
      endpoint: 'http://localhost:4566' // LocalStack endpoint
    })
  ]
})
export class TestAppModule {}
```

## Troubleshooting

### Issue: "Default queue url is not provided"

**Cause:** Trying to use a method without specifying `queueUrl` and no default was set.

**Solution:**

```typescript
// Option 1: Set default in configuration
AwsSqsModule.registerQueue({
  queueName: 'orders',
  sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/orders' // ← Set default
})

// Option 2: Always provide queueUrl
await queue.sendMessage({
  body: data,
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/orders' // ← Explicit
})
```

### Issue: Messages not being deleted

**Cause:** Processing takes longer than `visibilityTimeout`.

**Solution:** Increase visibility timeout

```typescript
await queue.receiveMessage({
  maxNumberOfMessages: 10,
  visibilityTimeout: 300 // 5 minutes instead of default 5 seconds
})
```

### Issue: Throttling errors

**Cause:** Sending too many concurrent requests.

**Solution:** The library already uses sequential batch sending. Consider rate limiting:

```typescript
const chunks = chunkArray(orders, 100);

for (const chunk of chunks) {
  await queue.sendMessageBatch({ bodyList: chunk });
  await sleep(1000); // 1 second delay between batches
}
```

## Best Practices

### ✅ DO

- Use `forRootAsync` with `ConfigService` for credentials
- Set appropriate `visibilityTimeout` based on processing time
- Delete messages only after successful processing
- Use FIFO queues when order matters
- Handle errors gracefully (log and let DLQ catch failures)
- Use long polling (`waitTimeSeconds: 20`) to reduce costs
- Batch operations when possible

### ❌ DON'T

- Hardcode AWS credentials in code
- Set `visibilityTimeout` too low (causes duplicate processing)
- Delete messages before processing completes
- Use standard queues when strict ordering is required
- Ignore errors (messages will be lost)
- Use short polling in production
- Send messages one-by-one when you can batch

## Next Steps

- **[Configuration Guide](../guides/configuration.md)** - All configuration options
- **[Advanced Usage](../guides/advanced-usage.md)** - Patterns and best practices
- **[API Reference](../api/core-abstractions.md)** - Complete type definitions
- **[Architecture Overview](../architecture/overview.md)** - Understand the design
