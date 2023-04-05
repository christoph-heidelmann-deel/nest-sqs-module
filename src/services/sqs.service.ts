import {
  SQSClient,
  ReceiveMessageCommandOutput,
  ReceiveMessageCommand,
  DeleteMessageCommandOutput,
  DeleteMessageCommand,
  SendMessageCommand,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SYMBOLS } from '../IoC/symbols';
import { QueueIdentifier, QueueURL, SQSMessage, SQSMessageService } from '../types';
import { SQSQueuesService } from './sqs-queues.service';
import {
  DeleteMessageCommandError,
  QueueIdentifierNotRegisteredError,
  ReceiveMessageCommandError,
  SendMessageCommandError,
} from './sqs.service.errors';

@Injectable()
export class SQSService implements SQSMessageService {
  protected readonly logger: Logger = new Logger(SQSService.name);

  public constructor(
    @Inject(SYMBOLS.SQS_CLIENT) protected readonly sqsClient: SQSClient,
    @Inject(SYMBOLS.SQS_QUEUES_SERVICE) protected readonly queueService: SQSQueuesService,
  ) {}

  private async getQueueURL(queueIdentifier: QueueIdentifier): Promise<QueueURL> {
    const queueURL = this.queueService.getQueueURLByIdentifier(queueIdentifier);
    if (queueURL === null) {
      throw new QueueIdentifierNotRegisteredError(queueIdentifier);
    }
    return queueURL;
  }

  public async receiveMessages(queueIdentifier: QueueIdentifier): Promise<ReceiveMessageCommandOutput> {
    const queueURL = await this.getQueueURL(queueIdentifier);

    const receiveMessageCommand: ReceiveMessageCommand = new ReceiveMessageCommand({
      QueueUrl: queueURL,
    });

    let result: ReceiveMessageCommandOutput | undefined = undefined;
    try {
      result = await this.sqsClient.send(receiveMessageCommand);
    } catch (error) {
      throw new ReceiveMessageCommandError(queueIdentifier, receiveMessageCommand, error);
    }

    return result;
  }

  public async deleteMessage(
    queueIdentifier: QueueIdentifier,
    messageReceiptHandle: string,
  ): Promise<DeleteMessageCommandOutput> {
    const queueURL = await this.getQueueURL(queueIdentifier);

    const deleteMessageCommand: DeleteMessageCommand = new DeleteMessageCommand({
      QueueUrl: queueURL,
      ReceiptHandle: messageReceiptHandle,
    });

    let result: DeleteMessageCommandOutput | undefined = undefined;
    try {
      result = await this.sqsClient.send(deleteMessageCommand);
    } catch (error) {
      throw new DeleteMessageCommandError(queueIdentifier, deleteMessageCommand, error);
    }

    return result;
  }

  public async sendMessage(queueIdentifier: QueueIdentifier, message: SQSMessage): Promise<SendMessageCommandOutput> {
    const queueURL = await this.getQueueURL(queueIdentifier);

    const sendMessageCommand: SendMessageCommand = new SendMessageCommand({
      QueueUrl: queueURL,
      ...message,
    });

    let result: SendMessageCommandOutput | undefined = undefined;
    try {
      result = await this.sqsClient.send(sendMessageCommand);
    } catch (error) {
      throw new SendMessageCommandError(queueIdentifier, sendMessageCommand, error);
    }

    return result;
  }
}
