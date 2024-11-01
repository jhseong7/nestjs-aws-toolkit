import { IsObject, IsOptional, IsString, validateSync } from 'class-validator';
import { IModuleAsyncOptionBase } from '../common';

type IAwsSqsModuleOptions = {
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  apiVersion?: string;
  sqsQueueUrl?: string;
  messageGroupId?: string;
};

type IAwsSqsModuleAsyncOptions = IModuleAsyncOptionBase<IAwsSqsModuleOptions>;

// NOTE: inherit as partial so any unprovided options will be inherited from the root module
type IAwsSqsFeatureModuleOptions = Partial<IAwsSqsModuleOptions> & {
  // Alias name to call the queue settings
  queueName: string;
};

type IAwsSqsFeatureModuleAsyncOptions = Omit<
  IAwsSqsModuleAsyncOptions,
  'useFactory'
> & {
  // Alias name to call the queue settings
  queueName: string;

  // Factory that returns the partial options to override in the feature module
  useFactory: (
    ...args: any[]
  ) => Promise<Partial<IAwsSqsModuleOptions>> | Partial<IAwsSqsModuleOptions>;
};

// Class type for easy class validation
export class AwsSqsModuleOptions implements IAwsSqsModuleOptions {
  constructor(options: IAwsSqsModuleOptions) {
    this.region = options.region;
    this.credentials = options.credentials;
    this.apiVersion = options.apiVersion;
    this.sqsQueueUrl = options.sqsQueueUrl;
    this.messageGroupId = options.messageGroupId;
  }

  static validate(options: IAwsSqsModuleOptions) {
    const inst = new AwsSqsModuleOptions(options);

    const errors = validateSync(inst);

    if (errors.length > 0) {
      throw new Error(errors.join(', ').toString());
    }

    return true;
  }

  static from(options: IAwsSqsModuleOptions) {
    AwsSqsModuleOptions.validate(options);
    return new AwsSqsModuleOptions(options);
  }

  @IsString()
  @IsOptional()
  region?: string;

  @IsObject()
  @IsOptional()
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };

  @IsString()
  @IsOptional()
  sqsQueueUrl?: string;

  @IsString()
  @IsOptional()
  apiVersion?: string;

  @IsString()
  @IsOptional()
  messageGroupId?: string;
}

type AwsSqsReceiveMessageResponse<T = unknown> = {
  /**
   * The message list (list of body and resolve function)
   */
  messages: {
    body: T;
    receiptHandle: string;
    onMessageComplete: () => Promise<unknown>;
  }[];

  /**
   * The handler to acknowledge the message has been processed. This must be called after the message has been processed to remove the message from the queue
   * @returns - The promise
   */
  onProcessComplete: (receiptHandles: string[]) => Promise<unknown>;
};

export type {
  AwsSqsReceiveMessageResponse,
  IAwsSqsFeatureModuleAsyncOptions,
  IAwsSqsFeatureModuleOptions,
  IAwsSqsModuleAsyncOptions,
  IAwsSqsModuleOptions,
};
