# Configuration Guide

## Overview

The NestJS AWS Toolkit uses a **two-level configuration system**:

1. **Root Configuration** - Shared settings (credentials, region, etc.)
2. **Feature Configuration** - Resource-specific settings (queue URLs, bucket names, etc.)

```mermaid
graph TB
    A[Root Config<br/>Shared across all resources] --> B[SQS Queue 1]
    A --> C[SQS Queue 2]
    A --> D[S3 Bucket 1]
    A --> E[S3 Bucket 2]

    B --> F[Can override<br/>any root setting]
    C --> G[Can override<br/>any root setting]
    D --> H[Can override<br/>any root setting]
    E --> I[Can override<br/>any root setting]

    style A fill:#f59e0b,stroke:#d97706,color:#fff
    style B fill:#3b82f6,stroke:#1e40af,color:#fff
    style C fill:#3b82f6,stroke:#1e40af,color:#fff
    style D fill:#10b981,stroke:#059669,color:#fff
    style E fill:#10b981,stroke:#059669,color:#fff
```

## Root Configuration

### Synchronous Configuration

Use when you have static configuration values available at module load time.

```typescript
import { Module } from '@nestjs/common';
import { AwsSqsModule } from 'nestjs-aws-toolkit';

@Module({
  imports: [
    AwsSqsModule.forRoot({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      },
      apiVersion: '2012-11-05',
      sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/default-queue',
      messageGroupId: 'default-group'
    })
  ]
})
export class AppModule {}
```

### Asynchronous Configuration (Recommended)

Use when configuration depends on other services (ConfigService, database, etc.).

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AwsSqsModule } from 'nestjs-aws-toolkit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
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

### Root Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `region` | `string` | ❌ No | AWS region (e.g., `us-east-1`). Falls back to AWS SDK defaults if not provided. |
| `credentials` | `AwsCredentials` | ❌ No | AWS credentials object. See below for options. |
| `apiVersion` | `string` | ❌ No | AWS API version. Default: latest |
| `sqsQueueUrl` | `string` | ❌ No | Default SQS queue URL (optional, can override per queue) |
| `messageGroupId` | `string` | ❌ No | Default message group ID for FIFO queues |

### Credentials Configuration

```typescript
type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string; // For temporary credentials
};
```

**Options:**

1. **Explicit Credentials** (shown above)
2. **AWS SDK Default Credential Chain** (omit `credentials` option):
   - Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
   - AWS credentials file (`~/.aws/credentials`)
   - ECS container credentials
   - EC2 instance metadata

```typescript
// Let AWS SDK discover credentials automatically
AwsSqsModule.forRoot({
  region: 'us-east-1'
  // credentials omitted - uses AWS default chain
})
```

## Feature Configuration

### SQS Queue Registration

#### Synchronous

```typescript
AwsSqsModule.registerQueue({
  queueName: 'orders',
  sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/orders-queue',
  messageGroupId: 'order-processing', // Optional: override root default
  region: 'us-west-2' // Optional: override root region
})
```

#### Asynchronous

```typescript
AwsSqsModule.registerQueueAsync({
  queueName: 'orders',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    sqsQueueUrl: configService.getOrThrow<string>('ORDERS_QUEUE_URL'),
    messageGroupId: configService.get<string>('ORDERS_MESSAGE_GROUP_ID')
  })
})
```

#### Multiple Queues at Once

```typescript
// Synchronous
AwsSqsModule.registerQueue([
  { queueName: 'orders', sqsQueueUrl: '...' },
  { queueName: 'notifications', sqsQueueUrl: '...' },
  { queueName: 'analytics', sqsQueueUrl: '...' }
])

// Asynchronous
AwsSqsModule.registerQueueAsync([
  {
    queueName: 'orders',
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      sqsQueueUrl: config.get('ORDERS_QUEUE_URL')
    })
  },
  {
    queueName: 'notifications',
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      sqsQueueUrl: config.get('NOTIFICATIONS_QUEUE_URL')
    })
  }
])
```

### Feature Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `queueName` | `string` | ✅ Yes | Unique identifier for queue injection |
| `sqsQueueUrl` | `string` | ❌ No | Queue URL (overrides root default) |
| `messageGroupId` | `string` | ❌ No | Message group ID (overrides root default) |
| `region` | `string` | ❌ No | Region (overrides root default) |
| `credentials` | `AwsCredentials` | ❌ No | Credentials (overrides root default) |
| `apiVersion` | `string` | ❌ No | API version (overrides root default) |

## Configuration Patterns

### Pattern 1: Environment-Based Configuration

**.env file:**

```bash
# AWS Credentials
AWS_SQS_REGION=us-east-1
AWS_SQS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SQS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Queue URLs
ORDERS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/orders
NOTIFICATIONS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/notifications
ANALYTICS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/analytics

# FIFO Settings
ORDERS_MESSAGE_GROUP_ID=order-processing
NOTIFICATIONS_MESSAGE_GROUP_ID=notification-delivery
```

**app.module.ts:**

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AwsSqsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        region: config.getOrThrow('AWS_SQS_REGION'),
        credentials: {
          accessKeyId: config.getOrThrow('AWS_SQS_ACCESS_KEY_ID'),
          secretAccessKey: config.getOrThrow('AWS_SQS_SECRET_ACCESS_KEY')
        }
      })
    })
  ]
})
export class AppModule {}
```

**order.module.ts:**

```typescript
@Module({
  imports: [
    AwsSqsModule.registerQueueAsync({
      queueName: 'orders',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        sqsQueueUrl: config.getOrThrow('ORDERS_QUEUE_URL'),
        messageGroupId: config.get('ORDERS_MESSAGE_GROUP_ID')
      })
    })
  ]
})
export class OrderModule {}
```

### Pattern 2: Multi-Environment Configuration

**config/aws.config.ts:**

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  queues: {
    orders: {
      url: process.env.ORDERS_QUEUE_URL!,
      messageGroupId: process.env.ORDERS_MESSAGE_GROUP_ID || 'orders'
    },
    notifications: {
      url: process.env.NOTIFICATIONS_QUEUE_URL!,
      messageGroupId: process.env.NOTIFICATIONS_MESSAGE_GROUP_ID || 'notifications'
    }
  }
}));
```

**app.module.ts:**

```typescript
import awsConfig from './config/aws.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [awsConfig]
    }),
    AwsSqsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('aws')!
    })
  ]
})
export class AppModule {}
```

**order.module.ts:**

```typescript
@Module({
  imports: [
    AwsSqsModule.registerQueueAsync({
      queueName: 'orders',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const queueConfig = config.get('aws.queues.orders')!;
        return {
          sqsQueueUrl: queueConfig.url,
          messageGroupId: queueConfig.messageGroupId
        };
      }
    })
  ]
})
export class OrderModule {}
```

### Pattern 3: Per-Environment Overrides

**.env.development:**

```bash
AWS_SQS_REGION=us-east-1
ORDERS_QUEUE_URL=http://localhost:4566/000000000000/orders-local
```

**.env.production:**

```bash
AWS_SQS_REGION=us-east-1
ORDERS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/orders-prod
```

### Pattern 4: IAM Role-Based (AWS ECS/EC2)

```typescript
// No credentials needed - uses IAM role attached to ECS task or EC2 instance
AwsSqsModule.forRoot({
  region: 'us-east-1'
  // credentials omitted - AWS SDK uses IAM role automatically
})
```

### Pattern 5: Cross-Region Configuration

```typescript
@Module({
  imports: [
    // Root config for primary region
    AwsSqsModule.forRoot({
      region: 'us-east-1',
      credentials: { /* ... */ }
    }),

    // Queue in primary region
    AwsSqsModule.registerQueue({
      queueName: 'orders-us-east',
      sqsQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/orders'
    }),

    // Queue in different region (override)
    AwsSqsModule.registerQueue({
      queueName: 'orders-eu-west',
      region: 'eu-west-1', // Override
      sqsQueueUrl: 'https://sqs.eu-west-1.amazonaws.com/123/orders'
    })
  ]
})
export class AppModule {}
```

## Configuration Merging

### Merge Priority

```
Feature Config  >  Root Config  >  AWS SDK Defaults
```

**Example:**

```typescript
// Root config
forRoot({
  region: 'us-east-1',
  credentials: { accessKeyId: 'ABC', secretAccessKey: 'XYZ' },
  messageGroupId: 'default'
})

// Feature config
registerQueue({
  queueName: 'orders',
  region: 'us-west-2',        // OVERRIDES us-east-1
  messageGroupId: 'priority'  // OVERRIDES default
  // credentials INHERITED from root
})

// Resulting merged config for 'orders' queue:
// {
//   region: 'us-west-2',              ← from feature
//   credentials: { ... },             ← from root
//   messageGroupId: 'priority',       ← from feature
//   sqsQueueUrl: undefined            ← not set anywhere
// }
```

### ASCII Merge Visualization

```
┌─────────────────────────────────────────────────┐
│         CONFIGURATION MERGE FLOW                │
├─────────────────────────────────────────────────┤
│                                                 │
│  AWS SDK Defaults (Lowest Priority)            │
│  ┌─────────────────────────────────────┐       │
│  │ region: from env/credentials file   │       │
│  │ credentials: from IAM role          │       │
│  └─────────────────────────────────────┘       │
│                    ▲                            │
│                    │ (overridden by)            │
│  Root Config (Medium Priority)                 │
│  ┌─────────────────────────────────────┐       │
│  │ region: 'us-east-1'                 │       │
│  │ credentials: { accessKeyId, ... }   │       │
│  │ messageGroupId: 'default'           │       │
│  └─────────────────────────────────────┘       │
│                    ▲                            │
│                    │ (overridden by)            │
│  Feature Config (Highest Priority)             │
│  ┌─────────────────────────────────────┐       │
│  │ queueName: 'orders'                 │       │
│  │ region: 'us-west-2'        ← WINS  │       │
│  │ messageGroupId: 'priority' ← WINS  │       │
│  └─────────────────────────────────────┘       │
│                    │                            │
│                    ▼                            │
│  Final Merged Config                           │
│  ┌─────────────────────────────────────┐       │
│  │ queueName: 'orders'                 │       │
│  │ region: 'us-west-2'                 │       │
│  │ credentials: { accessKeyId, ... }   │       │
│  │ messageGroupId: 'priority'          │       │
│  └─────────────────────────────────────┘       │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Validation

### Runtime Validation

Configuration is validated using `class-validator`:

```typescript
import { IsString, IsOptional, ValidateNested } from 'class-validator';

class AwsSqsModuleOptions {
  @IsString()
  @IsOptional()
  region?: string;

  @ValidateNested()
  @IsOptional()
  credentials?: AwsCredentials;

  static validate(options: IAwsSqsModuleOptions): boolean {
    const instance = new AwsSqsModuleOptions(options);
    const errors = validateSync(instance);

    if (errors.length > 0) {
      throw new Error(`Invalid SQS configuration: ${errors}`);
    }

    return true;
  }
}
```

### Configuration Errors

**Error:** `Invalid options provided`

**Cause:** Configuration object doesn't match expected schema.

**Solution:** Ensure all required fields are present and types are correct.

---

**Error:** `Default queue url is not provided`

**Cause:** Calling queue methods without `queueUrl` parameter and no default set.

**Solution:** Either set `sqsQueueUrl` in configuration or pass it explicitly:

```typescript
// Option 1: Set default
registerQueue({
  queueName: 'orders',
  sqsQueueUrl: 'https://...' // ← Set default
})

// Option 2: Pass explicitly
queue.sendMessage({
  body: data,
  queueUrl: 'https://...' // ← Explicit parameter
})
```

## Best Practices

### ✅ DO

- Use `forRootAsync` with `ConfigService` for production
- Store credentials in environment variables or AWS Secrets Manager
- Use IAM roles on AWS infrastructure (no credentials in code)
- Validate required environment variables at startup
- Use typed configuration with `registerAs`
- Set sensible defaults with `.get(key, defaultValue)`
- Use different configurations per environment

### ❌ DON'T

- Hardcode credentials in source code
- Commit `.env` files to version control
- Use `forRoot` with inline credentials in production
- Skip validation of required configuration
- Use same credentials across all environments
- Expose AWS credentials in logs or error messages

## Security Checklist

- [ ] Credentials stored in environment variables or secrets manager
- [ ] `.env` file in `.gitignore`
- [ ] IAM roles used on AWS infrastructure (preferred over access keys)
- [ ] Least privilege IAM policies attached to roles
- [ ] Credentials rotated regularly
- [ ] No credentials in application logs
- [ ] Configuration validated at startup
- [ ] Different AWS accounts for dev/staging/production

## Next Steps

- **[Getting Started Guide](./getting-started.md)** - Quick start tutorial
- **[SQS Module Guide](../modules/sqs.md)** - Complete SQS documentation
- **[Advanced Usage](./advanced-usage.md)** - Patterns and best practices
