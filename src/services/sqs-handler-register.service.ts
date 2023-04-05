import { OnModuleInit } from '@nestjs/common';
import { SQSForFeatureConfiguration } from '../types';
import { SQSHandlerDiscoveryService } from './sqs-handler-discovery.service';
import { SQSHandlersManagerService } from './sqs-handlers-manager.service';

export class SQSHandlerRegisterService implements OnModuleInit {
  public constructor(
    protected readonly handlerManager: SQSHandlersManagerService,
    protected readonly handlerDiscoveryService: SQSHandlerDiscoveryService,
    protected readonly forFeatureConfig: SQSForFeatureConfiguration,
  ) {}

  public async onModuleInit() {
    for (const queueIdentifier in this.forFeatureConfig.queues) {
      const messageHandler = await this.handlerDiscoveryService.discoverMessageHandler(queueIdentifier);

      if (messageHandler === null) {
        continue;
      }

      this.handlerManager.registerSQSConsumer(
        queueIdentifier,
        messageHandler.discoveredMethod.handler.bind(messageHandler.discoveredMethod.parentClass.instance),
      );

      const errorHandler = await this.handlerDiscoveryService.discoverErrorHandler(queueIdentifier);

      if (errorHandler !== null) {
        this.handlerManager.registerErrorHandler(
          queueIdentifier,
          errorHandler.discoveredMethod.handler.bind(errorHandler.discoveredMethod.parentClass.instance),
        );
      }
    }
  }
}
