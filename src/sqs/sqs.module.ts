import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AwsSqsQueue } from './sqs.queue';
import {
  AwsSqsModuleOptions,
  IAwsSqsFeatureModuleAsyncOptions,
  IAwsSqsFeatureModuleOptions,
  IAwsSqsModuleAsyncOptions,
  IAwsSqsModuleOptions,
} from './sqs.type';
import {
  getSqsQueueOptionsToken,
  getSqsQueueToken,
  getSqsRootOptionsToken,
} from './sqs.utils';
import { createOptionsProvider, ICommonOptionsHolder } from '../utils/token';

// NOTE: how forRootAsync dynamic module works ref: https://github.com/nestjs/typeorm/blob/master/lib/typeorm-core.module.ts#L154
@Module({})
class AwsSqsModule {
  /**
   * Create a provider structure for the async options of the root module
   * @param options
   * @param provideKey
   * @returns
   */
  private static createAsyncRootOptionProvider(
    options: IAwsSqsModuleAsyncOptions
  ): Provider {
    return {
      provide: getSqsRootOptionsToken(),
      useFactory: async (...args) => {
        const value = await options.useFactory(...args);

        return AwsSqsModuleOptions.from(value);
      },
      inject: options.inject || [],
    };
  }

  /**
   * Get the common base module options for module
   * @returns
   */
  private static getBaseModuleOptions(): DynamicModule {
    return {
      module: AwsSqsModule,
      imports: [ConfigModule],
      providers: [],
      exports: [],
    };
  }

  /**
   * Create a provider structure for the async options of the feature module
   * @param options - The options
   * @returns - The provider
   */
  private static createAsyncFeatureOptionProviders(
    options:
      | IAwsSqsFeatureModuleAsyncOptions
      | IAwsSqsFeatureModuleAsyncOptions[]
  ): Provider[] {
    // Provider for the commons config
    const commonConfigHolder = createOptionsProvider(getSqsRootOptionsToken());

    const optionsList = Array.isArray(options) ? options : [options];

    // Providers to provide the async options value for the queue provider below
    const optionsProviderList: Provider[] = optionsList.map(option => ({
      provide: getSqsQueueOptionsToken(option.queueName),
      useFactory: async (...args) => {
        const value = await option.useFactory(...args);

        return value;
      },
      inject: option.inject || [],
    }));

    // Providers to provide the injected queue for @InjectSqsQueue
    const queueProviderList: Provider[] = optionsList.map(option => ({
      provide: getSqsQueueToken(option.queueName),
      useFactory: async (
        configHolder: ICommonOptionsHolder<IAwsSqsModuleOptions>,
        queueOptions: IAwsSqsFeatureModuleOptions
      ) => {
        const commonConfig = configHolder.get();

        return new AwsSqsQueue({ ...commonConfig, ...queueOptions });
      },
      inject: [commonConfigHolder, getSqsQueueOptionsToken(option.queueName)],
    }));

    return [...optionsProviderList, commonConfigHolder, ...queueProviderList];
  }

  /**
   * For root module
   * @param options - The options
   * @returns - The module
   */
  public static forRoot(options: IAwsSqsModuleOptions): DynamicModule {
    const baseModule = AwsSqsModule.getBaseModuleOptions();
    const baseModuleProvider = baseModule.providers || [];

    const providers: Provider[] = [
      ...baseModuleProvider,
      {
        provide: getSqsRootOptionsToken(),
        useValue: AwsSqsModuleOptions.from(options),
      },
    ];

    return {
      ...baseModule,
      global: true,
      providers,
      exports: providers,
    };
  }

  /**
   * For root module. Use this only when a single module is used accross the application. If 2 or more queues are used, use forFeatureAsync instead
   * @param asyncOptions - The async options
   * @returns - The module
   */
  public static forRootAsync(
    asyncOptions: IAwsSqsModuleAsyncOptions
  ): DynamicModule {
    const baseModule = AwsSqsModule.getBaseModuleOptions();
    const baseModuleProvider = baseModule.providers || [];

    const optionProvider =
      AwsSqsModule.createAsyncRootOptionProvider(asyncOptions);

    const providers: Provider[] = [...baseModuleProvider, optionProvider];

    return {
      ...baseModule,
      global: true,
      providers,
      exports: providers,
    };
  }

  /**
   * Add feature module for the given queue. The feature module will add queues aliased by the queue name
   * with inidividual options
   * @param asyncOptions - The async options
   * @returns - The module
   */
  public static registerQueueAsync(
    asyncOptions:
      | IAwsSqsFeatureModuleAsyncOptions
      | IAwsSqsFeatureModuleAsyncOptions[]
  ): DynamicModule {
    const baseModule = AwsSqsModule.getBaseModuleOptions();
    const baseModuleProvider = baseModule.providers || [];

    // Create a custom provider that injects the options into the services of the module
    const optionProviders =
      AwsSqsModule.createAsyncFeatureOptionProviders(asyncOptions);

    const providers = [...baseModuleProvider, ...optionProviders];

    return {
      ...baseModule,
      providers,
      exports: providers,
    };
  }

  /**
   * Add feature module for the given queue. The feature module will add queues aliased by the queue name
   * with individual options
   * @param asyncOptions - The options
   * @returns - The module
   */
  public static registerQueue(
    options: IAwsSqsFeatureModuleOptions | IAwsSqsFeatureModuleOptions[]
  ): DynamicModule {
    const baseModule = AwsSqsModule.getBaseModuleOptions();
    const baseModuleProvider = baseModule.providers || [];

    // Providers for common options from the forRoot
    const commonConfigHolder = createOptionsProvider<IAwsSqsModuleOptions>(
      getSqsRootOptionsToken()
    );

    const optionsList = Array.isArray(options) ? options : [options];

    // Queue providers for the @InjectSqsQueue decorator
    const queueProviders: Provider[] = optionsList.map(option => ({
      provide: getSqsQueueToken(option.queueName),
      useFactory: async (
        configHolder: ICommonOptionsHolder<IAwsSqsModuleOptions>
      ) => {
        const commonConfig = configHolder.get();

        return new AwsSqsQueue({ ...commonConfig, ...option });
      },
      inject: [commonConfigHolder],
    }));

    const providers: Provider[] = [
      ...baseModuleProvider,
      commonConfigHolder,
      ...queueProviders,
    ];

    return {
      ...baseModule,
      providers,
      exports: providers,
    };
  }
}

export { AwsSqsModule };
