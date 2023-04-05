import { SetMetadata } from '@nestjs/common';
import { SYMBOLS } from '../IoC/symbols';
import { SQSErrorHandlerDecoratorParams } from '../types';

export const SQSErrorHandler = ({ queueIdentifier }: SQSErrorHandlerDecoratorParams) =>
  SetMetadata(SYMBOLS.SQS_DECORATOR_ERROR_HANDLER, { queueIdentifier });
