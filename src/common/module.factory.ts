import { DynamicModule, Provider } from '@nestjs/common';
import {
  createOptionsProvider,
  getModuleTokenFunctions,
  ICommonOptionsHolder,
} from '../utils/token';
import { IModuleAsyncOptionBase, IModuleOptionBase } from './type';

export type AwsModuleFactoryOptions<Feat, Root, Client> = {
  // The provider token root to auto generate the options token
  tokenRoot: string;

  // Function to get the base module options
  baseModuleOptionGetter: () => DynamicModule;

  // The Client instantiator function. This is used to create the client instance
  // e.g. new SqsClient(options)
  // The client MUST extend both the Root and Feat types
  clientInstantiator: (options: Root & Feat) => Client;

  /**
   * Function to return a unique identifier for the feature e.g.) queueName
   *
   * As the feature module is intended to be used asynchronously and synchronously,
   * The unique identifier must be extracted from the options to be used as a token
   * The token is extracted from data type IModuleAsyncOptionBase and Feature type
   */
  featureIdentifierGetter: (
    option: Feat | IModuleAsyncOptionBase<Feat>
  ) => string;
};

/**
 * WIP: testing if the factory pattern works for this project.
 *
 *
 * Factory class to get the common module logics for the AWS modules.
 * It builds the basic dynamic modules for the aws modules
 *
 * For each module, instantiate a new factory class to get the module
 * and map the static module methods to the factory class
 */
export class AwsModuleFactory<Feat extends Partial<Root>, Root, Client = any> {
  private getRootToken: () => string;
  private getFeatureToken: (...featureToken: string[]) => string;
  private getFeatureOptionsToken: (...featureToken: string[]) => string;

  // Function to get the base module options
  private getBaseModuleOptions: () => DynamicModule;

  private clientInstantiator: (...options: any) => Client;
  private featureIdentifierGetter: (
    option: Feat | IModuleAsyncOptionBase<Feat>
  ) => string;

  constructor(params: AwsModuleFactoryOptions<Feat, Root, Client>) {
    // Get the nestjs provider token get functions for the module
    const { getRootToken, getFeatureToken, getFeatureOptionsToken } =
      getModuleTokenFunctions(params.tokenRoot);

    this.getRootToken = getRootToken;
    this.getFeatureToken = getFeatureToken;
    this.getFeatureOptionsToken = getFeatureOptionsToken;
    this.getBaseModuleOptions = params.baseModuleOptionGetter;
    this.clientInstantiator = params.clientInstantiator;
    this.featureIdentifierGetter = params.featureIdentifierGetter;
  }

  /**
   * Create a provider structure that provides the AsyncRoot Option data type to the module
   * @param option
   * @returns
   */
  private createAsyncRootOptionProvider(
    option: IModuleAsyncOptionBase<Root>
  ): Provider {
    return {
      provide: this.getRootToken(),
      useFactory: async (...args) => {
        const value = await option.useFactory(...args);

        return value;
      },
      inject: option.inject || [],
    };
  }

  private createAsyncFeatureOptionProviders(
    options: IModuleAsyncOptionBase<Feat> | IModuleAsyncOptionBase<Feat>[]
  ): Provider[] {
    // Provider for the commons config
    const commonConfigHolder = createOptionsProvider<Root>(this.getRootToken());

    const optionsList = Array.isArray(options) ? options : [options];

    // Providers to provide the async options value for the queue provider below
    const optionsProviderList: Provider[] = optionsList.map(option => ({
      provide: this.getFeatureOptionsToken(
        this.featureIdentifierGetter(option)
      ),
      useFactory: async (...args) => {
        const value = await option.useFactory(...args);

        return value;
      },
      inject: option.inject || [],
    }));

    // Providers to provide the injected queue for @InjectSqsQueue
    const queueProviderList: Provider[] = optionsList.map(option => ({
      provide: this.getFeatureToken(this.featureIdentifierGetter(option)),
      useFactory: async (
        configHolder: ICommonOptionsHolder<Root>,
        featureOptions: Feat
      ) => {
        const commonConfig = configHolder.get();

        return this.clientInstantiator({ ...commonConfig, ...featureOptions });
      },
      inject: [
        commonConfigHolder,
        this.getFeatureOptionsToken(this.featureIdentifierGetter(option)),
      ],
    }));

    return [...optionsProviderList, commonConfigHolder, ...queueProviderList];
  }

  /**
   * Asynchronously get the feature module options
   * @param options
   * @returns
   */
  public forRootAsync(options: IModuleAsyncOptionBase<Root>): DynamicModule {
    const baseModule = this.getBaseModuleOptions();
    const baseModuleProbider = baseModule.providers || [];

    const optionProvider = this.createAsyncRootOptionProvider(options);

    const providers: Provider[] = [...baseModuleProbider, optionProvider];

    return {
      ...baseModule,
      global: true,
      providers,
      exports: providers,
    };
  }

  /**
   * The base forRoot method to provide the root module options
   * Extend this method to provide the root module options
   * @param options
   * @returns
   */
  public forRoot(options: IModuleOptionBase<Root>): DynamicModule {
    const baseModule = this.getBaseModuleOptions();
    const baseModuleProbider = baseModule.providers || [];

    const providers: Provider[] = [
      ...baseModuleProbider,
      {
        provide: this.getRootToken(),
        useValue: options,
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
   * Add a feature module for the given feature. The feature module will add the feature aliased by the feature name
   * with individual options + the root options extended.
   *
   * @param asyncOptions - The async options
   * @returns - The module
   */
  public registerFeatureAsync(
    asyncOptions: IModuleAsyncOptionBase<Feat> | IModuleAsyncOptionBase<Feat>[]
  ): DynamicModule {
    const baseModule = this.getBaseModuleOptions();
    const baseModuleProvider = baseModule.providers || [];

    // Create a custom provider that injects the options into the services of the module
    const optionProviders =
      this.createAsyncFeatureOptionProviders(asyncOptions);

    const providers = [...baseModuleProvider, ...optionProviders];

    return {
      ...baseModule,
      providers,
      exports: providers,
    };
  }

  public registerFeature(options: Feat | Feat[]): DynamicModule {
    const baseModule = this.getBaseModuleOptions();
    const baseModuleProvider = baseModule.providers || [];

    // Providers for common options from the forRoot
    const commonConfigHolder = createOptionsProvider<Root>(this.getRootToken());

    const optionsList = Array.isArray(options) ? options : [options];

    // Queue providers for the @InjectSqsQueue decorator
    const clientProviders: Provider[] = optionsList.map(option => ({
      provide: this.getFeatureOptionsToken(
        this.featureIdentifierGetter(option)
      ),
      useFactory: async (configHolder: ICommonOptionsHolder<Root>) => {
        const commonConfig = configHolder.get();

        return this.clientInstantiator({ ...commonConfig, ...option });
      },
      inject: [commonConfigHolder],
    }));

    const providers: Provider[] = [
      ...baseModuleProvider,
      commonConfigHolder,
      ...clientProviders,
    ];

    return {
      ...baseModule,
      providers,
      exports: providers,
    };
  }
}
