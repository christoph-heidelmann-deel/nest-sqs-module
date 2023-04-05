import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { MESSAGE_HANDLER_PROCESSING_ERROR } from '../constants/event-names';
import {
  QueueIdentifier,
  SQSErrorHandlerMethod,
  SQSForFeatureConfiguration,
  SQSMessageHandlerFunction,
  SQSMessageService,
} from '../types';
import { SQSConsumer } from './sqs-consumer';
import {
  ConsumerAlreadyRegisteredError,
  ErrorHandlerWithoutConsumerNotAllowed,
} from './sqs-handlers-manager.service.errors';

@Injectable()
export class SQSHandlersManagerService implements OnModuleDestroy, OnApplicationBootstrap {
  protected readonly sqsConsumers: Record<QueueIdentifier, SQSConsumer> = {};
  public constructor(
    protected readonly sqsService: SQSMessageService,
    protected readonly forFeatureConfig: SQSForFeatureConfiguration,
  ) {}

  public onApplicationBootstrap() {
    for (const sqsConsumer in this.sqsConsumers) {
      this.sqsConsumers[sqsConsumer].start();
    }
  }

  public onModuleDestroy() {
    for (const sqsConsumer in this.sqsConsumers) {
      this.sqsConsumers[sqsConsumer].stop();
    }
  }

  public get consumers(): Record<QueueIdentifier, SQSConsumer> {
    return this.sqsConsumers;
  }

  public async registerSQSConsumer(
    queueIdentifier: QueueIdentifier,
    messageHandler: SQSMessageHandlerFunction,
  ): Promise<void> {
    if (this.sqsConsumers[queueIdentifier] !== undefined) {
      throw new ConsumerAlreadyRegisteredError(queueIdentifier);
    }

    const consumer = new SQSConsumer({
      queueIdentifier: queueIdentifier,
      messageHandler: messageHandler,
      sqsService: this.sqsService,
      consumerOptions: this.forFeatureConfig.consumerOptions,
    });

    this.sqsConsumers[queueIdentifier] = consumer;
  }

  public async registerErrorHandler(
    queueIdentifier: QueueIdentifier,
    errorHandler: SQSErrorHandlerMethod,
  ): Promise<void> {
    if (!(queueIdentifier in this.sqsConsumers)) {
      throw new ErrorHandlerWithoutConsumerNotAllowed(queueIdentifier);
    }
    this.sqsConsumers[queueIdentifier].addListener(MESSAGE_HANDLER_PROCESSING_ERROR, errorHandler);
  }
}
