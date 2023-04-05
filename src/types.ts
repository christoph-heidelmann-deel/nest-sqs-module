import {
  SQSClientConfig as AWSSQSClientConfig,
  Message,
  ReceiveMessageCommandOutput,
  DeleteMessageCommandOutput,
  SendMessageRequest,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { FactoryProvider } from '@nestjs/common';

export type SQSErrorHandlerMethod = (message: SQSMessage, error: Error) => Promise<void>;

export interface SQSErrorHandlerInterface {
  handleError: SQSErrorHandlerMethod;
}

export interface SQSMessageHandlerInterface {
  handleMessage: SQSMessageHandlerFunction;
}

export interface SQSMessageHandlerDecoratorParams {
  queueIdentifier: QueueIdentifier;
}

export interface SQSErrorHandlerDecoratorParams {
  queueIdentifier: QueueIdentifier;
}

export type QueueIdentifier = string;
export type QueueURL = string;
export interface SQSQueues {
  [key: QueueIdentifier]: QueueURL;
}

export interface SQSConsumerOptions {
  waitTimeBetweenTwoPollsMS: number;
}

export type SQSClientConfig = Pick<AWSSQSClientConfig, 'region' | 'endpoint' | 'credentials'>;

export interface SQSModuleConfiguration {
  clientConfig: SQSClientConfig;
}
export interface SQSForFeatureConfiguration {
  queues: SQSQueues;
  consumerOptions: SQSConsumerOptions;
}

export type SQSForFeatureOptions = Pick<FactoryProvider<SQSForFeatureConfiguration>, 'useFactory' | 'inject'>;

export type SQSModuleOptions = Pick<FactoryProvider<SQSModuleConfiguration>, 'useFactory' | 'inject'>;

export type SQSMessageHandlerFunction = (message: Message) => Promise<void>;

export type SQSMessage = Omit<SendMessageRequest, 'QueueUrl'>;

export interface SQSMessageService {
  receiveMessages(queueIdentifier: QueueIdentifier): Promise<ReceiveMessageCommandOutput>;
  deleteMessage(queueIdentifier: QueueIdentifier, messageReceiptHandle: string): Promise<DeleteMessageCommandOutput>;
  sendMessage(queueIdentifier: QueueIdentifier, message: SQSMessage): Promise<SendMessageCommandOutput>;
}
