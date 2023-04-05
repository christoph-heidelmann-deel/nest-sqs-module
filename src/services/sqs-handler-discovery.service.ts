import { DiscoveredMethodWithMeta, DiscoveryService } from '@nestjs-plus/discovery';
import { QueueIdentifier, SQSErrorHandlerDecoratorParams, SQSMessageHandlerDecoratorParams } from '../types';
import { SYMBOLS } from '../IoC/symbols';
import { Injectable } from '@nestjs/common';
import { MultipleHandlersNotAllowedError } from './sqs-handler-discovery.service.errors';

@Injectable()
export class SQSHandlerDiscoveryService {
  public constructor(protected readonly discover: DiscoveryService) {}

  public async discoverMessageHandler(
    queueIdentifier: QueueIdentifier,
  ): Promise<DiscoveredMethodWithMeta<SQSMessageHandlerDecoratorParams> | null> {
    const messageHandlers: DiscoveredMethodWithMeta<SQSMessageHandlerDecoratorParams>[] =
      await this.discover.providerMethodsWithMetaAtKey<SQSMessageHandlerDecoratorParams>(
        SYMBOLS.SQS_DECORATOR_CONSUMER_METHOD,
      );

    return this.filterFoundHandlers(queueIdentifier, messageHandlers);
  }

  public async discoverErrorHandler(
    queueIdentifier: QueueIdentifier,
  ): Promise<DiscoveredMethodWithMeta<SQSErrorHandlerDecoratorParams> | null> {
    const errorHandlers: DiscoveredMethodWithMeta<SQSErrorHandlerDecoratorParams>[] =
      await this.discover.providerMethodsWithMetaAtKey<SQSErrorHandlerDecoratorParams>(
        SYMBOLS.SQS_DECORATOR_ERROR_HANDLER,
      );

    return this.filterFoundHandlers(queueIdentifier, errorHandlers);
  }

  private filterFoundHandlers<TDecoratorParams extends { queueIdentifier: string }>(
    queueIdentifier: QueueIdentifier,
    messageHandlers: DiscoveredMethodWithMeta<TDecoratorParams>[],
  ) {
    const handlersWithMatchingQueueIdentifier: DiscoveredMethodWithMeta<TDecoratorParams>[] = messageHandlers.filter(
      (messageHandler) => messageHandler.meta.queueIdentifier === queueIdentifier,
    );

    if (handlersWithMatchingQueueIdentifier.length === 0) {
      return null;
    }

    if (handlersWithMatchingQueueIdentifier.length > 1) {
      throw new MultipleHandlersNotAllowedError(
        queueIdentifier,
        handlersWithMatchingQueueIdentifier.map((handler) => handler.discoveredMethod.parentClass.name),
      );
    }

    return handlersWithMatchingQueueIdentifier[0];
  }
}
