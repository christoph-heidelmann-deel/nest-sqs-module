import { SetMetadata } from '@nestjs/common';
import { SQSMessageHandlerDecoratorParams } from '../types';
import { SYMBOLS } from '../IoC/symbols';

export const SQSMessageHandler = ({ queueIdentifier }: SQSMessageHandlerDecoratorParams) =>
  SetMetadata(SYMBOLS.SQS_DECORATOR_CONSUMER_METHOD, { queueIdentifier });
