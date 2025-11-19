# NestJS AWS Toolkit Documentation

> Comprehensive documentation for the NestJS AWS Toolkit library

## 📚 Documentation Index

### 🚀 Getting Started

New to the library? Start here:

- **[Getting Started Guide](./guides/getting-started.md)** - 5-minute quick start tutorial
  - Installation
  - Basic setup
  - First queue integration
  - Common issues

### 🏗️ Architecture

Understand the library's design and structure:

- **[Architecture Overview](./architecture/overview.md)** - High-level system design
  - Project structure
  - Core concepts
  - Supported AWS services
  - Design principles

- **[Design Philosophy](./architecture/design-philosophy.md)** - Principles and patterns
  - SOLID principles
  - Design patterns used
  - Architectural decisions
  - Testing philosophy

- **[Factory Pattern Deep Dive](./architecture/factory-pattern.md)** - Core abstraction explained
  - Factory implementation
  - Type parameters
  - Provider creation
  - Configuration merging

### 📖 Module Guides

Detailed documentation for each AWS service module:

- **[AWS SQS Module](./modules/sqs.md)** - Complete SQS integration guide ✅ Production Ready
  - Configuration
  - API reference
  - Usage patterns
  - Best practices
  - Troubleshooting

### 🔧 Guides

Practical guides for common tasks:

- **[Configuration Guide](./guides/configuration.md)** - All configuration strategies
  - Root vs Feature configuration
  - Synchronous vs Asynchronous
  - Environment-based config
  - Multi-environment setup
  - Security best practices

- **[Advanced Usage](./guides/advanced-usage.md)** - Production patterns
  - Retry logic with exponential backoff
  - Circuit breaker pattern
  - Message batching and aggregation
  - Priority queues
  - Health checks
  - Graceful shutdown
  - Distributed tracing

### 📘 API Reference

Complete type and API documentation:

- **[Core Abstractions](./api/core-abstractions.md)** - Types, classes, and decorators
  - Configuration types
  - SQS types
  - Class methods
  - Decorators
  - Utility functions

## 🗺️ Navigation by Use Case

### "I'm new to the library"

```mermaid
graph LR
    A[Start] --> B[Getting Started]
    B --> C[SQS Module Guide]
    C --> D[Configuration Guide]
    D --> E[Production Ready!]

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style E fill:#10b981,stroke:#059669,color:#fff
```

1. Read [Getting Started Guide](./guides/getting-started.md)
2. Follow [SQS Module Guide](./modules/sqs.md)
3. Review [Configuration Guide](./guides/configuration.md)

### "I want to understand the architecture"

```mermaid
graph LR
    A[Start] --> B[Architecture Overview]
    B --> C[Design Philosophy]
    C --> D[Factory Pattern]
    D --> E[Deep Understanding]

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style E fill:#f59e0b,stroke:#d97706,color:#fff
```

1. Read [Architecture Overview](./architecture/overview.md)
2. Explore [Design Philosophy](./architecture/design-philosophy.md)
3. Deep dive into [Factory Pattern](./architecture/factory-pattern.md)

### "I need production-ready patterns"

```mermaid
graph LR
    A[Start] --> B[Advanced Usage]
    B --> C[Configuration Guide]
    C --> D[SQS Best Practices]
    D --> E[Production Deployment]

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style E fill:#10b981,stroke:#059669,color:#fff
```

1. Study [Advanced Usage](./guides/advanced-usage.md)
2. Review [Configuration Guide](./guides/configuration.md)
3. Apply [SQS Best Practices](./modules/sqs.md#best-practices)

### "I'm implementing a specific feature"

| Feature | Documentation |
|---------|---------------|
| **Queue Integration** | [SQS Module](./modules/sqs.md) |
| **Environment Config** | [Configuration Guide](./guides/configuration.md) |
| **Retry Logic** | [Advanced Usage - Retry Pattern](./guides/advanced-usage.md#1-retry-logic-with-exponential-backoff) |
| **Circuit Breaker** | [Advanced Usage - Circuit Breaker](./guides/advanced-usage.md#2-circuit-breaker-pattern) |
| **Message Batching** | [Advanced Usage - Batching](./guides/advanced-usage.md#3-message-batching-with-aggregation) |
| **Health Checks** | [Advanced Usage - Monitoring](./guides/advanced-usage.md#5-health-checks-and-monitoring) |
| **Testing** | [Advanced Usage - Testing](./guides/advanced-usage.md#testing-strategies) |
| **Type Definitions** | [API Reference](./api/core-abstractions.md) |

## 📊 Documentation Structure

```
docs/
├── README.md (you are here)
│
├── architecture/
│   ├── overview.md              ← System design & concepts
│   ├── design-philosophy.md     ← Principles & patterns
│   └── factory-pattern.md       ← Core abstraction
│
├── modules/
│   └── sqs.md                   ← SQS complete guide
│
├── guides/
│   ├── getting-started.md       ← Quick start tutorial
│   ├── configuration.md         ← All config options
│   └── advanced-usage.md        ← Production patterns
│
└── api/
    └── core-abstractions.md     ← Types & API reference
```

## 🎯 Quick Links

### Most Popular Pages

1. [Getting Started](./guides/getting-started.md) - Start here
2. [SQS Module Guide](./modules/sqs.md) - Most commonly used
3. [Configuration Guide](./guides/configuration.md) - Essential for setup
4. [Advanced Usage](./guides/advanced-usage.md) - Production patterns

### Reference Pages

- [Architecture Overview](./architecture/overview.md) - High-level design
- [API Reference](./api/core-abstractions.md) - Complete type definitions
- [Factory Pattern](./architecture/factory-pattern.md) - Deep dive

## 🔍 Search by Topic

### Configuration

- [Root Configuration](./guides/configuration.md#root-configuration)
- [Feature Configuration](./guides/configuration.md#feature-configuration)
- [Async Configuration](./guides/configuration.md#asynchronous-configuration-recommended)
- [Environment Variables](./guides/configuration.md#pattern-1-environment-based-configuration)
- [Multi-Environment Setup](./guides/configuration.md#pattern-2-multi-environment-configuration)

### SQS Operations

- [Send Message](./modules/sqs.md#sendmessage)
- [Send Batch](./modules/sqs.md#sendmessagebatch)
- [Receive Messages](./modules/sqs.md#receivemessage)
- [Delete Messages](./modules/sqs.md#deletemessages)
- [FIFO Queues](./modules/sqs.md#pattern-4-fifo-queue-with-message-grouping)

### Patterns

- [Cron Job Processing](./modules/sqs.md#example-cron-job-pattern)
- [Event-Driven Architecture](./modules/sqs.md#pattern-1-event-driven-order-processing)
- [Fan-Out Pattern](./modules/sqs.md#pattern-2-fan-out-multiple-queues)
- [Dead Letter Queue](./modules/sqs.md#pattern-3-dead-letter-queue-dlq)
- [Retry Logic](./guides/advanced-usage.md#1-retry-logic-with-exponential-backoff)
- [Circuit Breaker](./guides/advanced-usage.md#2-circuit-breaker-pattern)

### Architecture

- [Factory Pattern](./architecture/factory-pattern.md)
- [Dependency Injection](./architecture/design-philosophy.md#pattern-2-dependency-injection-pattern)
- [Multi-Level Configuration](./architecture/overview.md#1-multi-level-configuration)
- [Provider Token System](./architecture/overview.md#3-provider-token-system)

### Testing

- [Unit Testing](./modules/sqs.md#unit-testing-with-mocks)
- [Integration Testing](./modules/sqs.md#integration-testing-with-localstack)
- [Testing Strategies](./guides/advanced-usage.md#testing-strategies)

## 🏷️ Documentation by Role

### Developers (Using the Library)

**Priority Order:**

1. [Getting Started](./guides/getting-started.md)
2. [SQS Module Guide](./modules/sqs.md)
3. [Configuration Guide](./guides/configuration.md)
4. [Advanced Usage](./guides/advanced-usage.md)
5. [API Reference](./api/core-abstractions.md)

### Architects (Understanding the Design)

**Priority Order:**

1. [Architecture Overview](./architecture/overview.md)
2. [Design Philosophy](./architecture/design-philosophy.md)
3. [Factory Pattern](./architecture/factory-pattern.md)
4. [Advanced Usage](./guides/advanced-usage.md)

### Contributors (Extending the Library)

**Priority Order:**

1. [Architecture Overview](./architecture/overview.md)
2. [Factory Pattern](./architecture/factory-pattern.md)
3. [Design Philosophy](./architecture/design-philosophy.md)
4. [API Reference](./api/core-abstractions.md)

## 📖 Reading Order

### Recommended Learning Path

```
Day 1: Getting Started
├─ Getting Started Guide (15 min)
├─ SQS Module Guide - Quick Start (15 min)
└─ First Integration (30 min)

Day 2: Configuration Mastery
├─ Configuration Guide (30 min)
├─ Environment Setup (30 min)
└─ Multi-Queue Setup (30 min)

Day 3: Advanced Patterns
├─ Advanced Usage Guide (45 min)
├─ Implement Cron Processor (60 min)
└─ Error Handling & Retry (45 min)

Day 4: Architecture Deep Dive
├─ Architecture Overview (30 min)
├─ Design Philosophy (45 min)
└─ Factory Pattern (45 min)

Day 5: Production Readiness
├─ Best Practices (30 min)
├─ Security Checklist (30 min)
├─ Performance Tuning (30 min)
└─ Testing Strategies (30 min)
```

## 🎓 Learning Resources

### Tutorials

- [5-Minute Quick Start](./guides/getting-started.md#quick-start-in-5-minutes)
- [First Queue Integration](./guides/getting-started.md#step-3-configure-root-module)
- [Cron Job Example](./guides/getting-started.md#example-cron-job-message-processor)

### Examples

- [Basic Send/Receive](./guides/getting-started.md#step-4-create-a-service)
- [Event-Driven Processing](./modules/sqs.md#pattern-1-event-driven-order-processing)
- [Multiple Queues](./modules/sqs.md#multiple-queues)
- [Batch Operations](./modules/sqs.md#sendmessagebatch)

### Diagrams

- [System Architecture](./architecture/overview.md#high-level-architecture)
- [Configuration Flow](./architecture/overview.md#1-multi-level-configuration)
- [Provider Injection](./architecture/overview.md#4-dependency-injection-flow)
- [Factory Pattern](./architecture/factory-pattern.md#class-diagram)

## ❓ FAQ

### General

**Q: What AWS services are supported?**
A: Currently SQS (production-ready). S3 is in development. See [Architecture Overview](./architecture/overview.md#supported-aws-services).

**Q: Is this production-ready?**
A: Yes, the SQS module is fully production-ready. See [SQS Module](./modules/sqs.md).

### Configuration

**Q: Should I use sync or async configuration?**
A: Use async configuration in production. See [Configuration Guide](./guides/configuration.md#asynchronous-configuration-recommended).

**Q: How do I handle multiple queues?**
A: Use `registerQueue([...])` with an array. See [Multiple Queues](./modules/sqs.md#multiple-queues).

### Operations

**Q: How do I delete messages after processing?**
A: Call `message.onMessageComplete()` or `onProcessComplete(handles)`. See [Receive Messages](./modules/sqs.md#receivemessage).

**Q: What's the best way to poll queues?**
A: Use cron jobs with long polling. See [Cron Pattern](./modules/sqs.md#example-cron-job-pattern).

### Troubleshooting

**Q: "Default queue url is not provided" error?**
A: Set `sqsQueueUrl` in config or pass it explicitly. See [Troubleshooting](./modules/sqs.md#issue-default-queue-url-is-not-provided).

**Q: Messages not being deleted?**
A: Ensure you call `onMessageComplete()`. See [Troubleshooting](./modules/sqs.md#issue-messages-not-being-deleted).

## 🤝 Contributing

Found an issue or want to improve the documentation?

1. Open an issue on [GitHub](https://github.com/yourusername/nestjs-aws-toolkit/issues)
2. Submit a pull request with improvements
3. Follow the [Architecture Guidelines](./architecture/design-philosophy.md)

## 📝 Documentation Standards

This documentation follows:

- **Mermaid.js** for diagrams
- **ASCII art** for visual explanations
- **Code examples** for every feature
- **Progressive disclosure** (simple → advanced)
- **Cross-references** for easy navigation

## 🔗 External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [AWS SQS Documentation](https://docs.aws.amazon.com/sqs/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**License:** MIT
