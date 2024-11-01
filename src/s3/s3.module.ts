import { Module } from '@nestjs/common';
import { AwsModuleFactory } from '../common/module.factory';
import { ConfigModule } from '@nestjs/config';

@Module({})
export class AwsS3Module {
  private static _factory = new AwsModuleFactory({
    tokenRoot: AwsS3Module.name + 'Root',
    baseModuleOptionGetter: () => ({
      module: AwsS3Module,
      imports: [ConfigModule],
      providers: [],
      exports: [],
    }),
    clientInstantiator: () => ({}),
    featureIdentifierGetter: () => '',
  });
}
