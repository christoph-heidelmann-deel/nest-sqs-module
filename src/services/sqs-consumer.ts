import { Message, ReceiveMessageCommandOutput } from "@aws-sdk/client-sqs";
import { Logger } from "@nestjs/common";
import EventEmitter from "events";
import { MESSAGE_HANDLER_PROCESSING_ERROR } from "../constants/event-names";
import {
  QueueIdentifier,
  SQSConsumerOptions,
  SQSMessageHandlerFunction,
  SQSMessageService,
} from "../types";

export interface SQSConsumerCreateParams {
  queueIdentifier: QueueIdentifier;
  messageHandler: SQSMessageHandlerFunction;
  sqsService: SQSMessageService;
  consumerOptions: SQSConsumerOptions;
}

export class SQSConsumer extends EventEmitter {
  protected readonly sqsService: SQSMessageService;
  protected readonly queueIdentifier: string;
  protected readonly messageHandler: SQSMessageHandlerFunction;
  protected readonly consumerOptions: SQSConsumerOptions;

  protected readonly logger: Logger = new Logger(SQSConsumer.name);

  protected pollingTimeoutId: NodeJS.Timeout | undefined = undefined;
  protected isRunning = false;

  public constructor(consumerCreateParams: SQSConsumerCreateParams) {
    super();

    this.queueIdentifier = consumerCreateParams.queueIdentifier;
    this.messageHandler = consumerCreateParams.messageHandler;
    this.sqsService = consumerCreateParams.sqsService;
    this.consumerOptions = consumerCreateParams.consumerOptions;
  }

  protected static hasMessages(
    receiveMessageCommandOutput: ReceiveMessageCommandOutput
  ): receiveMessageCommandOutput is ReceiveMessageCommandOutput & {
    Messages: Message[];
  } {
    return (
      receiveMessageCommandOutput.Messages !== undefined &&
      Array.isArray(receiveMessageCommandOutput.Messages) &&
      receiveMessageCommandOutput.Messages.length > 0
    );
  }

  public get running(): boolean {
    return this.isRunning;
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    return this.poll();
  }

  public stop() {
    this.isRunning = false;

    if (this.pollingTimeoutId) {
      clearTimeout(this.pollingTimeoutId);

      this.pollingTimeoutId = undefined;
    }
  }

  protected async poll(): Promise<void> {
    if (!this.isRunning) return;

    let sqsResponse: ReceiveMessageCommandOutput | undefined = undefined;
    try {
      sqsResponse = await this.sqsService.receiveMessages(this.queueIdentifier);
    } catch (error) {
      this.logger.error("receiveMessage", { error });
    }

    if (sqsResponse !== undefined && SQSConsumer.hasMessages(sqsResponse)) {
      for (const message of sqsResponse.Messages) {
        try {
          await this.messageHandler(message);
        } catch (error) {
          this.logger.error("messageHandler", { error });
          this.emit(MESSAGE_HANDLER_PROCESSING_ERROR, error, message);
        }
      }
    }

    if (this.pollingTimeoutId !== undefined) {
      clearTimeout(this.pollingTimeoutId);
    }

    this.pollingTimeoutId = setTimeout(
      this.poll.bind(this),
      this.consumerOptions.waitTimeBetweenTwoPollsMS
    );
  }
}
