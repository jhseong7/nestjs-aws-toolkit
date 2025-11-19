# Design Philosophy

## Introduction

The NestJS AWS Toolkit is built on a foundation of well-established software engineering principles and patterns. This document explores the philosophy behind architectural decisions and the design patterns that make the library powerful yet maintainable.

## Core Design Principles

### 1. Convention over Configuration

```
Philosophy: Sensible defaults, explicit overrides only when needed
```

**Example:**

```typescript
// ✅ Minimal configuration - uses AWS SDK defaults
AwsSqsModule.forRoot({
  region: 'us-east-1'
  // credentials auto-discovered from environment
  // apiVersion uses latest
  // other settings use AWS defaults
})

// ✅ Override only what you need
AwsSqsModule.registerQueue({
  queueName: 'orders',
  sqsQueueUrl: 'https://...'  // Only override queue URL
  // Inherits region, credentials from root
})
```

**ASCII Diagram:**

```
┌─────────────────────────────────────────────────────┐
│         Convention over Configuration               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Default Behavior (80% of use cases)               │
│  ├─ AWS SDK discovers credentials automatically    │
│  ├─ Latest API version used                        │
│  ├─ Sensible timeouts and retries                  │
│  └─ Standard message formats                       │
│                                                     │
│  ──────────────────────────────────                │
│                                                     │
│  Explicit Configuration (20% of edge cases)        │
│  ├─ Custom credentials                             │
│  ├─ Specific API versions                          │
│  ├─ Custom timeouts                                │
│  └─ FIFO-specific settings                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2. Separation of Concerns

Each component has a single, well-defined responsibility.

```mermaid
graph TD
    subgraph "Module Layer"
        A[sqs.module.ts]
    end

    subgraph "Client Layer"
        B[sqs.queue.ts]
    end

    subgraph "Type Layer"
        C[sqs.type.ts]
    end

    subgraph "Utility Layer"
        D[sqs.utils.ts]
        E[sqs.decorator.ts]
    end

    subgraph "Constant Layer"
        F[sqs.constant.ts]
    end

    A -->|Creates instances of| B
    A -->|Uses types from| C
    A -->|Generates tokens with| D
    B -->|Validates with| C
    E -->|Resolves tokens from| D
    D -->|References| F

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style B fill:#10b981,stroke:#059669,color:#fff
    style C fill:#f59e0b,stroke:#d97706,color:#fff
    style D fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style E fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style F fill:#ef4444,stroke:#dc2626,color:#fff
```

**Responsibility Matrix:**

| File | Responsibility | Should NOT |
|------|---------------|------------|
| `sqs.module.ts` | NestJS module definition, static registration methods | Implement AWS operations, validate types |
| `sqs.queue.ts` | AWS SQS client wrapper, queue operations | Handle module registration, token generation |
| `sqs.type.ts` | Type definitions, validation logic | Create providers, execute AWS calls |
| `sqs.decorator.ts` | Injection decorators | Generate tokens, validate options |
| `sqs.utils.ts` | Token generation utilities | Validate types, create AWS clients |
| `sqs.constant.ts` | String constants for tokens | Any logic whatsoever |

### 3. Don't Repeat Yourself (DRY)

**Problem Without DRY:**

```typescript
// ❌ Repetitive configuration across 10 queues
AwsSqsModule.registerQueue({
  queueName: 'orders',
  region: 'us-east-1',
  credentials: { accessKeyId: '...', secretAccessKey: '...' },
  apiVersion: '2012-11-05'
})

AwsSqsModule.registerQueue({
  queueName: 'notifications',
  region: 'us-east-1',                                      // REPEATED
  credentials: { accessKeyId: '...', secretAccessKey: '...' }, // REPEATED
  apiVersion: '2012-11-05'                                   // REPEATED
})

// Repeated 8 more times... 🤦
```

**Solution With DRY:**

```typescript
// ✅ Define common config once
AwsSqsModule.forRoot({
  region: 'us-east-1',
  credentials: { accessKeyId: '...', secretAccessKey: '...' },
  apiVersion: '2012-11-05'
})

// All queues inherit automatically
AwsSqsModule.registerQueue({ queueName: 'orders' })
AwsSqsModule.registerQueue({ queueName: 'notifications' })
// ... 8 more with just queue names
```

**Visualization:**

```mermaid
graph LR
    A[Root Config<br/>region: us-east-1<br/>credentials: ***] --> B[Queue: orders]
    A --> C[Queue: notifications]
    A --> D[Queue: shipments]
    A --> E[Queue: analytics]
    A --> F[Queue: emails]

    B -->|Override| B1[Custom URL]
    C -->|Inherit All| C1[Use Root]
    D -->|Override| D1[Custom GroupID]
    E -->|Inherit All| E1[Use Root]
    F -->|Inherit All| F1[Use Root]

    style A fill:#f59e0b,stroke:#d97706,color:#fff
    style B fill:#3b82f6,stroke:#1e40af,color:#fff
    style C fill:#10b981,stroke:#059669,color:#fff
    style D fill:#3b82f6,stroke:#1e40af,color:#fff
    style E fill:#10b981,stroke:#059669,color:#fff
    style F fill:#10b981,stroke:#059669,color:#fff
```

### 4. Open/Closed Principle

**Open for extension, closed for modification.**

The `AwsModuleFactory` is designed to support new AWS services without changing existing code:

```typescript
// ✅ Adding S3 support (EXTENSION - no changes to factory)
class AwsS3Module {
  private static _factory = new AwsModuleFactory({
    tokenRoot: 'S3Root',
    clientInstantiator: (options) => new S3Client(options),
    featureIdentifierGetter: (opt) => opt.bucketName,
    // ...
  });

  // Expose methods...
}

// ✅ Adding DynamoDB support (EXTENSION - no changes to factory)
class AwsDynamoDBModule {
  private static _factory = new AwsModuleFactory({
    tokenRoot: 'DynamoDBRoot',
    clientInstantiator: (options) => new DynamoDBClient(options),
    featureIdentifierGetter: (opt) => opt.tableName,
    // ...
  });

  // Expose methods...
}
```

**ASCII Representation:**

```
┌────────────────────────────────────────────────────────┐
│         AwsModuleFactory (CLOSED)                      │
│  • Core logic never changes                           │
│  • Tested once, works for all services                │
│  • Generic implementation <Feat, Root, Client>        │
└───────────────────┬────────────────────────────────────┘
                    │
                    │ (OPEN for extension)
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼─────┐   ┌────▼────┐   ┌──────▼──────┐
│   SQS   │   │   S3    │   │  DynamoDB   │
│ Module  │   │ Module  │   │   Module    │
│         │   │         │   │             │
│ Config: │   │ Config: │   │   Config:   │
│ • Queue │   │ • Bucket│   │   • Table   │
│   URL   │   │   Name  │   │     Name    │
└─────────┘   └─────────┘   └─────────────┘

     Add new services without touching factory!
```

### 5. Dependency Inversion Principle

**Depend on abstractions, not concretions.**

```mermaid
graph TB
    subgraph "High-Level (Application Code)"
        A[OrderService]
    end

    subgraph "Abstraction Layer"
        B[IAwsSqsQueue Interface]
        C[@InjectSqsQueue Decorator]
    end

    subgraph "Low-Level (Implementation)"
        D[AwsSqsQueue Class]
        E[SQSClient from AWS SDK]
    end

    A -->|Depends on| B
    A -->|Uses| C
    B <-.implements.- D
    D -->|Uses| E

    style B fill:#f59e0b,stroke:#d97706,color:#fff
    style C fill:#f59e0b,stroke:#d97706,color:#fff
```

**Code Example:**

```typescript
// ✅ Service depends on abstraction (interface), not implementation
@Injectable()
export class OrderService {
  constructor(
    @InjectSqsQueue('orders') private queue: AwsSqsQueue  // Abstraction
  ) {}

  async createOrder(order: Order) {
    // Don't care about SQSClient internals
    await this.queue.sendMessage({
      body: order,
      queueUrl: 'https://...'
    });
  }
}

// Implementation details are hidden
// Future: Could swap AwsSqsQueue with MockQueue for testing
//         Could swap with LocalStackQueue for local dev
//         Could swap with RabbitMQAdapter for different backend
```

### 6. Single Responsibility Principle

Each class/module has one reason to change.

```
┌────────────────────────────────────────────────────────────┐
│  AwsSqsQueue (sqs.queue.ts)                                │
│                                                            │
│  Responsibility: Wrap AWS SQS operations                  │
│  Reason to change: AWS SDK API changes                    │
│                                                            │
│  ✓ sendMessage()         ✓ receiveMessage()              │
│  ✓ sendMessageBatch()    ✓ deleteMessages()              │
│  ✓ getClient()           ✓ onApplicationShutdown()       │
│                                                            │
│  ✗ Does NOT handle module registration                   │
│  ✗ Does NOT generate provider tokens                     │
│  ✗ Does NOT validate TypeScript types                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  AwsSqsModule (sqs.module.ts)                              │
│                                                            │
│  Responsibility: NestJS module definition                 │
│  Reason to change: Module registration logic changes      │
│                                                            │
│  ✓ forRoot()             ✓ forRootAsync()                │
│  ✓ registerQueue()       ✓ registerQueueAsync()          │
│                                                            │
│  ✗ Does NOT execute AWS operations                       │
│  ✗ Does NOT implement SQS client logic                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  AwsSqsModuleOptions (sqs.type.ts)                         │
│                                                            │
│  Responsibility: Type definitions and validation          │
│  Reason to change: Configuration schema changes           │
│                                                            │
│  ✓ Type definitions (interfaces)                         │
│  ✓ Validation with class-validator                       │
│  ✓ Factory methods for creating validated instances      │
│                                                            │
│  ✗ Does NOT create NestJS providers                      │
│  ✗ Does NOT execute AWS operations                       │
└────────────────────────────────────────────────────────────┘
```

## Design Patterns Deep Dive

### Pattern 1: Factory Method Pattern

**Intent**: Define an interface for creating objects, but let subclasses decide which class to instantiate.

**Implementation:**

```mermaid
classDiagram
    class AwsModuleFactory {
        <<Generic Factory>>
        -tokenRoot: string
        -clientInstantiator: Function
        -featureIdentifierGetter: Function
        +forRoot() DynamicModule
        +registerFeature() DynamicModule
    }

    class AwsSqsModule {
        -static _factory: AwsModuleFactory
        +forRoot() DynamicModule
        +registerQueue() DynamicModule
    }

    class AwsS3Module {
        -static _factory: AwsModuleFactory
        +forRoot() DynamicModule
        +registerBucket() DynamicModule
    }

    AwsModuleFactory <|-- AwsSqsModule: instantiates
    AwsModuleFactory <|-- AwsS3Module: instantiates

    note for AwsModuleFactory "Creates providers with\ncustomizable client\ninstantiation logic"
```

**Benefits:**

```
┌─────────────────────────────────────────────────────┐
│  Without Factory Pattern                           │
├─────────────────────────────────────────────────────┤
│  SQS Module:      150 LOC (module registration)    │
│  S3 Module:       150 LOC (module registration)    │
│  DynamoDB Module: 150 LOC (module registration)    │
│                                                     │
│  Total: 450 LOC (mostly duplicate code)            │
│  Maintenance: High (3 places to update)            │
│  Bug risk: High (might forget one module)          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  With Factory Pattern                              │
├─────────────────────────────────────────────────────┤
│  AwsModuleFactory: 150 LOC (shared logic)          │
│  SQS Module:        20 LOC (config only)           │
│  S3 Module:         20 LOC (config only)           │
│  DynamoDB Module:   20 LOC (config only)           │
│                                                     │
│  Total: 210 LOC (53% reduction!)                   │
│  Maintenance: Low (1 place to update)              │
│  Bug risk: Low (fix once, works everywhere)        │
└─────────────────────────────────────────────────────┘
```

### Pattern 2: Dependency Injection Pattern

**Intent**: Invert control of dependency creation to a container.

```mermaid
sequenceDiagram
    participant App as Application
    participant DI as NestJS DI Container
    participant Factory as AwsModuleFactory
    participant Queue as AwsSqsQueue

    App->>DI: Request @InjectSqsQueue('orders')
    DI->>Factory: Resolve token "SqsRootModuleOptions_Feature_orders"
    Factory->>DI: Return provider definition
    DI->>Queue: Instantiate with merged config
    Queue-->>DI: AwsSqsQueue instance
    DI-->>App: Inject instance

    Note over App,DI: Same instance on subsequent requests<br/>(Singleton scope)
```

**Lifecycle Management:**

```typescript
// ✅ NestJS manages lifecycle automatically
@Injectable()
class AwsSqsQueue implements OnApplicationShutdown {
  private client: SQSClient;

  constructor(/* dependencies injected */) {
    this.client = new SQSClient({ /* config */ });
  }

  // Called automatically when app shuts down
  async onApplicationShutdown(signal?: string) {
    this.client.destroy(); // Cleanup AWS connections
  }
}
```

### Pattern 3: Decorator Pattern

**Intent**: Attach additional responsibilities to an object dynamically.

```typescript
// Base decorator from NestJS
@Inject(token)

// Enhanced decorator with custom logic
export const InjectSqsQueue = (queueAlias: string) => {
  const token = getSqsQueueToken(queueAlias); // Custom token generation
  return Inject(token);                        // Delegate to base decorator
};
```

**ASCII Flow:**

```
┌──────────────────────────────────────────────────────────┐
│  @InjectSqsQueue('orders') ← Custom decorator            │
│         │                                                │
│         ├─→ Calls getSqsQueueToken('orders')            │
│         │   Returns: "SqsRootModuleOptions_Feature_orders"│
│         │                                                │
│         └─→ Delegates to @Inject(token)                 │
│             NestJS resolves provider                    │
│                                                          │
│  Result: Clean API with complex logic hidden            │
└──────────────────────────────────────────────────────────┘
```

### Pattern 4: Template Method Pattern

**Intent**: Define the skeleton of an algorithm, letting subclasses override specific steps.

```typescript
class AwsModuleFactory<Feat, Root, Client> {
  // TEMPLATE METHOD - defines the algorithm
  public registerFeature(options: Feat | Feat[]): DynamicModule {
    const optionsArray = Array.isArray(options) ? options : [options];

    // STEP 1: Create providers (hook point for customization)
    const providers = optionsArray.map(option => {
      const identifier = this.featureIdentifierGetter(option); // ← HOOK
      const token = this.getFeatureToken(identifier);

      return {
        provide: token,
        useFactory: (...args) => {
          const merged = this.mergeConfigs(rootConfig, option);
          return this.clientInstantiator(merged); // ← HOOK
        },
        inject: [this.getCommonOptionsToken()]
      };
    });

    // STEP 2: Return module (fixed algorithm)
    return {
      module: this.moduleClass,
      providers,
      exports: providers
    };
  }

  // Subclasses customize these hooks:
  // - featureIdentifierGetter: Extract unique ID from options
  // - clientInstantiator: Create specific AWS client
}
```

### Pattern 5: Strategy Pattern

**Intent**: Define a family of algorithms, encapsulate each one, and make them interchangeable.

```mermaid
graph TB
    subgraph "Context"
        A[AwsModuleFactory]
    end

    subgraph "Strategies (Injected Functions)"
        B[clientInstantiator]
        C[featureIdentifierGetter]
        D[baseModuleOptionGetter]
    end

    subgraph "Concrete Strategies (SQS)"
        E["(options) => new SQSClient(options)"]
        F["(opt) => opt.queueName"]
        G["() => SQS default options"]
    end

    subgraph "Concrete Strategies (S3)"
        H["(options) => new S3Client(options)"]
        I["(opt) => opt.bucketName"]
        J["() => S3 default options"]
    end

    A -->|Uses| B
    A -->|Uses| C
    A -->|Uses| D

    B -.implements.- E
    C -.implements.- F
    D -.implements.- G

    B -.implements.- H
    C -.implements.- I
    D -.implements.- J

    style A fill:#f59e0b,stroke:#d97706,color:#fff
    style E fill:#3b82f6,stroke:#1e40af,color:#fff
    style H fill:#10b981,stroke:#059669,color:#fff
```

**Code Example:**

```typescript
// SQS Strategy
new AwsModuleFactory({
  clientInstantiator: (options) => new SQSClient(options), // ← Strategy 1
  featureIdentifierGetter: (opt) => opt.queueName,         // ← Strategy 2
})

// S3 Strategy (different implementations, same interface)
new AwsModuleFactory({
  clientInstantiator: (options) => new S3Client(options),  // ← Different strategy 1
  featureIdentifierGetter: (opt) => opt.bucketName,        // ← Different strategy 2
})
```

### Pattern 6: Builder Pattern (Fluent Interface)

**Intent**: Separate construction of complex objects from their representation.

```typescript
// Fluent configuration syntax
AwsSqsModule
  .forRoot({ region: 'us-east-1' })        // Step 1
  .registerQueue({ queueName: 'orders' })   // Step 2
  .registerQueue({ queueName: 'emails' });  // Step 3

// Alternative async configuration
AwsSqsModule
  .forRootAsync({
    inject: [ConfigService],
    useFactory: (config) => ({ region: config.get('REGION') })
  })
  .registerQueueAsync({
    queueName: 'orders',
    inject: [ConfigService],
    useFactory: (config) => ({ sqsQueueUrl: config.get('ORDERS_URL') })
  });
```

## Architectural Decisions

### Decision 1: Why NestJS Dynamic Modules?

**Alternatives Considered:**

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Static Modules** | Simple | No runtime config, no DI | ❌ Rejected |
| **Global Providers** | Easy access | Pollutes global scope | ❌ Rejected |
| **Dynamic Modules** | Flexible, follows NestJS patterns | Slight complexity | ✅ **Chosen** |
| **Standalone Classes** | No framework dependency | Loses NestJS benefits | ❌ Rejected |

**Rationale:**

```
Dynamic modules provide:
  ✓ Runtime configuration via useFactory
  ✓ Dependency injection of ConfigService, etc.
  ✓ Proper module encapsulation
  ✓ Follows NestJS ecosystem conventions
  ✓ Testing utilities compatibility
```

### Decision 2: Why Multi-Level Configuration?

**Problem:**

In large applications with many AWS resources:
- Credentials repeated in every module → security risk
- Region repeated everywhere → maintenance nightmare
- API versions duplicated → inconsistency risk

**Solution:**

```mermaid
graph TD
    A[forRoot - Shared Config] --> B[Feature 1 - Orders Queue]
    A --> C[Feature 2 - Notifications Queue]
    A --> D[Feature 3 - Shipments Queue]

    B -->|Overrides| B1[Custom URL]
    C -->|Inherits| C1[All root settings]
    D -->|Overrides| D1[Custom FIFO settings]

    style A fill:#f59e0b,stroke:#d97706,color:#fff
    style B fill:#3b82f6,stroke:#1e40af,color:#fff
    style C fill:#10b981,stroke:#059669,color:#fff
    style D fill:#3b82f6,stroke:#1e40af,color:#fff
```

### Decision 3: Why class-validator for Runtime Validation?

**Alternatives:**

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **TypeScript Only** | Compile-time safety | No runtime checks | ❌ Rejected |
| **Joi/Yup** | Popular | Additional dependency | ❌ Rejected |
| **class-validator** | Integrates with NestJS, decorators | NestJS standard | ✅ **Chosen** |
| **Zod** | Type inference | Less NestJS integration | ❌ Rejected |

**Example:**

```typescript
class AwsSqsModuleOptions {
  @IsString()
  @IsOptional()
  region?: string;

  @ValidateNested()
  @IsOptional()
  credentials?: AwsCredentials;

  static validate(options: IAwsSqsModuleOptions) {
    const errors = validateSync(new AwsSqsModuleOptions(options));
    if (errors.length > 0) {
      throw new Error(`Invalid SQS configuration: ${errors}`);
    }
  }
}
```

### Decision 4: Why Generic AwsModuleFactory?

**Without Generics:**

```typescript
// ❌ Separate factory for each service
class SqsModuleFactory { /* 150 LOC */ }
class S3ModuleFactory { /* 150 LOC (90% duplicate) */ }
class DynamoDBModuleFactory { /* 150 LOC (90% duplicate) */ }

// Total: 450 LOC, high maintenance burden
```

**With Generics:**

```typescript
// ✅ One factory for all services
class AwsModuleFactory<Feat, Root, Client> { /* 150 LOC */ }

// Reuse:
const sqsFactory = new AwsModuleFactory<SqsOptions, RootOptions, SQSClient>({ /* */ });
const s3Factory = new AwsModuleFactory<S3Options, RootOptions, S3Client>({ /* */ });

// Total: 150 LOC + (20 LOC per service) = much less code
```

## Testing Philosophy

### Testability by Design

```mermaid
graph LR
    A[Dependency Injection] -->|Enables| B[Mock Injection]
    C[Interface-based Design] -->|Enables| C1[Stub Implementations]
    D[Modular Structure] -->|Enables| D1[Unit Testing]
    E[Factory Pattern] -->|Enables| E1[Test Factories]

    B --> F[Easy Testing]
    C1 --> F
    D1 --> F
    E1 --> F

    style F fill:#10b981,stroke:#059669,color:#fff
```

**Example Test:**

```typescript
describe('OrderService', () => {
  let service: OrderService;
  let mockQueue: Partial<AwsSqsQueue>;

  beforeEach(async () => {
    // ✅ Mock queue easily injected
    mockQueue = {
      sendMessage: jest.fn().mockResolvedValue({ MessageId: '123' })
    };

    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getSqsQueueToken('orders'), useValue: mockQueue }
      ]
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should send order to queue', async () => {
    await service.createOrder({ id: '1', items: [] });
    expect(mockQueue.sendMessage).toHaveBeenCalled();
  });
});
```

## Performance Philosophy

### Lazy Initialization

```typescript
// ✅ Providers created only when module is imported
@Module({
  imports: [
    AwsSqsModule.registerQueue({ queueName: 'orders' })
  ]
})
class OrderModule {} // ← Queue created only when OrderModule is loaded

@Module({
  imports: [/* AwsSqsModule NOT imported */]
})
class UserModule {} // ← No queue overhead in this module
```

### Connection Pooling

```typescript
// ✅ Singleton instances - one connection per queue
@InjectSqsQueue('orders') queue1: AwsSqsQueue // ← Same instance
@InjectSqsQueue('orders') queue2: AwsSqsQueue // ← Same instance (reused)

@InjectSqsQueue('emails') queue3: AwsSqsQueue // ← Different instance
```

### Minimal Abstraction Overhead

```
┌──────────────────────────────────────────────────┐
│  Performance Impact Analysis                     │
├──────────────────────────────────────────────────┤
│                                                  │
│  Direct AWS SDK Call:                           │
│    await sqsClient.send(new SendMessageCommand())│
│    Time: 150ms (network latency)                │
│                                                  │
│  Through AwsSqsQueue Wrapper:                   │
│    await queue.sendMessage({ ... })             │
│    Time: 150.5ms (network + 0.5ms wrapper)      │
│                                                  │
│  Overhead: 0.3% (negligible)                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Security Considerations

### 1. Credential Management

```typescript
// ✅ Best Practice: Use async factory with ConfigService
AwsSqsModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    credentials: {
      accessKeyId: config.getOrThrow('AWS_ACCESS_KEY'),      // From .env
      secretAccessKey: config.getOrThrow('AWS_SECRET_KEY')   // From .env
    }
  })
})

// ❌ Avoid: Hardcoded credentials
AwsSqsModule.forRoot({
  credentials: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',     // NEVER DO THIS
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG' // SECURITY RISK
  }
})
```

### 2. Validation Before Execution

```typescript
class AwsSqsModuleOptions {
  // Runtime validation prevents invalid configurations
  static validate(options: IAwsSqsModuleOptions) {
    const errors = validateSync(new AwsSqsModuleOptions(options));
    if (errors.length > 0) {
      throw new Error('Invalid configuration detected before AWS call');
    }
  }
}
```

### 3. Graceful Shutdown

```typescript
// ✅ Cleanup AWS connections on app shutdown
class AwsSqsQueue implements OnApplicationShutdown {
  async onApplicationShutdown(signal?: string) {
    await this.client.destroy(); // Close connections properly
  }
}
```

## Evolution Strategy

```mermaid
graph TB
    A[Current State<br/>SQS Production Ready] --> B[Phase 2<br/>S3 Implementation]
    B --> C[Phase 3<br/>DynamoDB Support]
    C --> D[Phase 4<br/>SNS & EventBridge]
    D --> E[Phase 5<br/>Lambda & Secrets Manager]

    F[Parallel Track<br/>Testing & Documentation] --> A
    F --> B
    F --> C
    F --> D
    F --> E

    style A fill:#10b981,stroke:#059669,color:#fff
    style B fill:#f59e0b,stroke:#d97706,color:#fff
    style F fill:#3b82f6,stroke:#1e40af,color:#fff
```

## Summary: Design Philosophy Pillars

```
┌────────────────────────────────────────────────────────────┐
│              The 7 Pillars of Design                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1️⃣  CONVENTION OVER CONFIGURATION                         │
│      Sensible defaults, explicit overrides only           │
│                                                            │
│  2️⃣  SEPARATION OF CONCERNS                                │
│      Each file has one clear responsibility               │
│                                                            │
│  3️⃣  DRY (DON'T REPEAT YOURSELF)                           │
│      Root config shared across features                   │
│                                                            │
│  4️⃣  OPEN/CLOSED PRINCIPLE                                 │
│      Extend with new services, don't modify core          │
│                                                            │
│  5️⃣  DEPENDENCY INVERSION                                  │
│      Depend on abstractions, not implementations          │
│                                                            │
│  6️⃣  SINGLE RESPONSIBILITY                                 │
│      One reason to change per component                   │
│                                                            │
│  7️⃣  TYPE SAFETY + RUNTIME VALIDATION                      │
│      TypeScript + class-validator = bulletproof           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Next Steps

- **[Factory Pattern Deep Dive](./factory-pattern.md)** - Detailed factory implementation
- **[Architecture Overview](./overview.md)** - High-level system design
- **[SQS Module Guide](../modules/sqs.md)** - Using SQS in your app
- **[Configuration Guide](../guides/configuration.md)** - All config options
