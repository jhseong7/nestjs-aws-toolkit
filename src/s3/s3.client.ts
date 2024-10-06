import { S3Client } from '@aws-sdk/client-s3';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { IAwsS3ModuleOptions } from './s3.type';

/**
 * The S3 Client class that is injected upon the inject s3 client decorator.
 * The client is injected by the name of the client
 */
export class AwsS3Client implements OnApplicationShutdown {
  private readonly logger = new Logger(AwsS3Client.name);

  private readonly client: S3Client;

  private defaultBucketName: string | undefined;

  constructor(options: IAwsS3ModuleOptions) {
    const { defaultBucketName, ...s3Config } = options;

    this.defaultBucketName = defaultBucketName;

    this.client = new S3Client(s3Config);
  }

  /**
   * Get the s3 client instance
   * @returns The S3 client instance
   */
  public getClient(): S3Client {
    return this.client;
  }

  public onApplicationShutdown(signal?: string) {
    this.logger.log(`Shutting down S3 client due to ${signal}`);
    this.client.destroy();
  }
}
