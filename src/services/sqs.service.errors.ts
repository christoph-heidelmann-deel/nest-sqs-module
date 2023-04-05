import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSServiceException,
} from '@aws-sdk/client-sqs';
import { CustomError } from '../../../shared/custom-error';

export class QueueIdentifierNotRegisteredError extends CustomError {
  constructor(queueIdentifier: string) {
    super();
    this.message = `Queue does not exists: ${queueIdentifier}`;
  }
}

export class SQSServiceError extends CustomError {
  constructor(
    public readonly queueIdentifier: string,
    public readonly command: unknown,
    public readonly awsError: unknown,
  ) {
    super();
  }
}

export class SendMessageCommandError extends SQSServiceError {
  constructor(queueIdentifier: string, command: SendMessageCommand, awsError: SQSServiceException) {
    super(queueIdentifier, command, awsError);
    this.message = `Error while sending message to queue: ${command.input.QueueUrl}`;
  }
}

export class DeleteMessageCommandError extends SQSServiceError {
  constructor(queueIdentifier: string, command: DeleteMessageCommand, awsError: SQSServiceException) {
    super(queueIdentifier, command, awsError);
    this.message = `Error while deleting message in queue: ${command.input.QueueUrl}`;
  }
}

export class ReceiveMessageCommandError extends SQSServiceError {
  constructor(queueIdentifier: string, command: ReceiveMessageCommand, awsError: SQSServiceException) {
    super(queueIdentifier, command, awsError);
    this.message = `Error while receiving message in queue: ${command.input.QueueUrl}`;
  }
}
