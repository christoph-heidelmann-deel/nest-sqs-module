import { DynamicModule, Global, Module } from "@nestjs/common";
import { DiscoveryModule, DiscoveryService } from "@nestjs-plus/discovery";
import {
  SQSForFeatureConfiguration,
  SQSForFeatureOptions,
  SQSMessageService,
  SQSModuleConfiguration,
  SQSModuleOptions,
} from "./types";
import { SQSHandlerDiscoveryService } from "./services/sqs-handler-discovery.service";
import { SYMBOLS } from "./ioc/symbols";
import { DefaultSQSModuleConfiguration } from "./config/default";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SQSService } from "./services/sqs.service";
import { MetadataScanner } from "@nestjs/core";
import { SQSHandlersManagerService } from "./services/sqs-handlers-manager.service";
import { SQSQueuesService } from "./services/sqs-queues.service";
import { SQSHandlerRegisterService } from "./services/sqs-handler-register.service";

@Global()
@Module({})
export class SQSModule {
  public static forFeature(
    sqsForFeatureOptions: SQSForFeatureOptions
  ): DynamicModule {
    return {
      providers: [
        {
          provide: SYMBOLS.SQS_MODULE_FOR_FEATURE_CONFIGURATION,
          useFactory: (queuesService: SQSQueuesService, injections) => {
            const config = {
              ...DefaultSQSModuleConfiguration,
              ...sqsForFeatureOptions.useFactory(injections),
            };

            for (const queueIdentifier in config.queues) {
              const queueUrl = config.queues[queueIdentifier];
              queuesService.addQueue(queueIdentifier, queueUrl);
            }

            return config;
          },
          inject: [
            SYMBOLS.SQS_QUEUES_SERVICE,
            ...(sqsForFeatureOptions.inject ? sqsForFeatureOptions.inject : []),
          ],
        },
        {
          provide: SYMBOLS.SQS_HANDLERS_MANAGER,
          useFactory: (
            sqsService: SQSMessageService,
            config: SQSForFeatureConfiguration
          ) => {
            return new SQSHandlersManagerService(sqsService, config);
          },
          inject: [
            SYMBOLS.SQS_SERVICE,
            SYMBOLS.SQS_MODULE_FOR_FEATURE_CONFIGURATION,
          ],
        },
        {
          provide: SYMBOLS.SQS_HANDLER_REGISTER_SERVICE,
          useFactory: (
            handlerManager: SQSHandlersManagerService,
            handlerDiscoveryService: SQSHandlerDiscoveryService,
            config: SQSForFeatureConfiguration
          ) => {
            return new SQSHandlerRegisterService(
              handlerManager,
              handlerDiscoveryService,
              config
            );
          },
          inject: [
            SYMBOLS.SQS_HANDLERS_MANAGER,
            SYMBOLS.SQS_HANDLER_DISCOVERY_SERVICE,
            SYMBOLS.SQS_MODULE_FOR_FEATURE_CONFIGURATION,
          ],
        },
      ],
      module: SQSModule,
    };
  }

  public static forRoot(
    sqsModuleAsyncOptions: SQSModuleOptions
  ): DynamicModule {
    return {
      imports: [DiscoveryModule, MetadataScanner],
      providers: [
        {
          provide: SYMBOLS.SQS_QUEUES_SERVICE,
          useClass: SQSQueuesService,
        },
        {
          provide: SYMBOLS.SQS_MODULE_CONFIGURATION,
          useFactory: (args) => {
            return sqsModuleAsyncOptions.useFactory(args);
          },
          inject: sqsModuleAsyncOptions.inject
            ? sqsModuleAsyncOptions.inject
            : [],
        },
        {
          provide: SYMBOLS.SQS_HANDLER_DISCOVERY_SERVICE,
          useFactory: (discoveryService: DiscoveryService) => {
            return new SQSHandlerDiscoveryService(discoveryService);
          },
          inject: [DiscoveryService],
        },
        {
          provide: SYMBOLS.SQS_CLIENT,
          inject: [SYMBOLS.SQS_MODULE_CONFIGURATION],
          useFactory: ({ clientConfig }: SQSModuleConfiguration) => {
            return new SQSClient(clientConfig);
          },
        },
        {
          provide: SYMBOLS.SQS_SERVICE,
          useClass: SQSService,
        },
      ],
      global: true,
      exports: [
        SYMBOLS.SQS_QUEUES_SERVICE,
        SYMBOLS.SQS_SERVICE,
        SYMBOLS.SQS_HANDLER_DISCOVERY_SERVICE,
      ],
      module: SQSModule,
    };
  }
}
