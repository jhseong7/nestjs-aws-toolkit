import { S3ClientConfig } from '@aws-sdk/client-s3';

export type IAwsS3ModuleOptions = S3ClientConfig & {
  defaultBucketName?: string;
};
