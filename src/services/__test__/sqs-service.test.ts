import {
  SQSClient,
  ReceiveMessageCommandOutput,
  Message,
  ReceiveMessageCommand,
  ServiceInputTypes,
  ServiceOutputTypes,
  DeleteMessageCommand,
  DeleteMessageCommandOutput,
  SendMessageCommand,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { SQSMessage, SQSMessageService } from '../../types';
import { AwsStub, mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { SQSService } from '../sqs.service';
import { SQSQueuesService } from '../sqs-queues.service';
import {
  DeleteMessageCommandError,
  QueueIdentifierNotRegisteredError,
  ReceiveMessageCommandError,
  SendMessageCommandError,
} from '../sqs.service.errors';

describe(SQSService.name, () => {
  let sqsClient: AwsStub<ServiceInputTypes, ServiceOutputTypes>;
  const queueIdentifierFixture = 'test-identifier';
  const queueURLFixture = 'any-url';
  let queuesServiceMock: jest.Mocked<SQSQueuesService>;
  const messageFixture: SQSMessage = {
    MessageBody: 'test-body',
  };
  const messagesFixture: { Messages: Message[] } = {
    Messages: [messageFixture],
  };

  const awsErrorFixture = new Error('test-aws-error');
  const messageReceiptHandleFixture = 'message-receipt-handle';
  const deleteMessageCommandOutputFixture: DeleteMessageCommandOutput = { $metadata: {} };
  const sendMessageCommandOutputFixture: SendMessageCommandOutput = { $metadata: {} };

  let sqsServiceProvider: SQSMessageService;

  beforeAll(() => {
    queuesServiceMock = {
      getQueueURLByIdentifier: jest.fn(),
    } as Partial<jest.Mocked<SQSQueuesService>> as jest.Mocked<SQSQueuesService>;

    sqsClient = mockClient(SQSClient);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sqsServiceProvider = new SQSService(sqsClient as any, queuesServiceMock);
  });

  describe('receiveMessages', () => {
    describe('when called', () => {
      describe('and queue does not exist', () => {
        let result: ReceiveMessageCommandOutput;

        beforeEach(async () => {
          queuesServiceMock.getQueueURLByIdentifier.mockReturnValueOnce(null);
          try {
            await sqsServiceProvider.receiveMessages(queueIdentifierFixture);
          } catch (error) {
            result = error;
          }
        });

        afterEach(() => {
          sqsClient.reset();
        });

        it('have called getQueueURLByIdentifier with correct queue identifier', () => {
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledTimes(1);
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('should not have called sqsClient with ReceiveMessageCommand', () => {
          expect(sqsClient).not.toHaveReceivedCommand(ReceiveMessageCommand);
        });

        it('should throw an error', () => {
          expect(result).toBeInstanceOf(QueueIdentifierNotRegisteredError);
        });
      });

      describe('and queue exists', () => {
        let result: ReceiveMessageCommandOutput;

        beforeEach(async () => {
          queuesServiceMock.getQueueURLByIdentifier.mockReturnValueOnce(queueURLFixture);
          sqsClient.on(ReceiveMessageCommand).resolvesOnce(messagesFixture);

          result = await sqsServiceProvider.receiveMessages(queueIdentifierFixture);
        });

        afterEach(() => {
          sqsClient.reset();
        });

        it('have called getQueueURLByIdentifier with correct queue identifier', () => {
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledTimes(1);
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('have called sqsClient with ReceiveMessageCommand', () => {
          expect(sqsClient).toHaveReceivedCommandTimes(ReceiveMessageCommand, 1);
          expect(sqsClient).toHaveReceivedCommandWith(ReceiveMessageCommand, { QueueUrl: queueURLFixture });
        });

        it('should return the correct messages', () => {
          expect(result).toEqual(messagesFixture);
        });
      });

      describe(`and queue exists 
                and command returns error`, () => {
        let result: ReceiveMessageCommandOutput;

        beforeEach(async () => {
          queuesServiceMock.getQueueURLByIdentifier.mockReturnValueOnce(queueURLFixture);
          sqsClient.on(ReceiveMessageCommand).rejectsOnce(awsErrorFixture);

          try {
            await sqsServiceProvider.receiveMessages(queueIdentifierFixture);
          } catch (error) {
            result = error;
          }
        });

        afterEach(() => {
          sqsClient.reset();
        });

        it('have called getQueueURLByIdentifier with correct queue identifier', () => {
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledTimes(1);
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('have called sqsClient with ReceiveMessageCommand', () => {
          expect(sqsClient).toHaveReceivedCommandTimes(ReceiveMessageCommand, 1);
          expect(sqsClient).toHaveReceivedCommandWith(ReceiveMessageCommand, { QueueUrl: queueURLFixture });
        });

        it('should throw an error', () => {
          expect(result).toBeInstanceOf(ReceiveMessageCommandError);
          if (result instanceof ReceiveMessageCommandError) {
            expect((result.awsError as Error).message).toBe(awsErrorFixture.message);
          }
        });
      });
    });
  });

  describe('deleteMessage', () => {
    describe('when called', () => {
      describe('and queue does not exist', () => {
        let result: ReceiveMessageCommandOutput;

        beforeEach(async () => {
          queuesServiceMock.getQueueURLByIdentifier.mockReturnValueOnce(null);

          try {
            await sqsServiceProvider.deleteMessage(queueIdentifierFixture, messageReceiptHandleFixture);
          } catch (error) {
            result = error;
          }
        });

        afterEach(() => {
          sqsClient.reset();
        });

        it('have called getQueueURLByIdentifier with correct queue identifier', () => {
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledTimes(1);
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('should not have called sqsClient with DeleteMessageCommand', () => {
          expect(sqsClient).not.toHaveReceivedCommand(DeleteMessageCommand);
        });

        it('should throw an error', () => {
          expect(result).toBeInstanceOf(QueueIdentifierNotRegisteredError);
        });
      });

      describe('and queue exists', () => {
        let result: ReceiveMessageCommandOutput;

        beforeEach(async () => {
          queuesServiceMock.getQueueURLByIdentifier.mockReturnValueOnce(queueURLFixture);
          sqsClient.on(DeleteMessageCommand).resolvesOnce(deleteMessageCommandOutputFixture);

          result = await sqsServiceProvider.deleteMessage(queueIdentifierFixture, messageReceiptHandleFixture);
        });

        afterEach(() => {
          sqsClient.reset();
        });

        it('have called getQueueURLByIdentifier with correct queue identifier', () => {
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledTimes(1);
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('have called sqsClient with DeleteMessageCommand', () => {
          expect(sqsClient).toHaveReceivedCommandTimes(DeleteMessageCommand, 1);
          expect(sqsClient).toHaveReceivedCommandWith(DeleteMessageCommand, {
            QueueUrl: queueURLFixture,
            ReceiptHandle: messageReceiptHandleFixture,
          });
        });

        it('should return the correct messages', () => {
          expect(result).toEqual(deleteMessageCommandOutputFixture);
        });
      });

      describe(`and queue exists 
                and command returns error`, () => {
        let result: ReceiveMessageCommandOutput;

        beforeEach(async () => {
          queuesServiceMock.getQueueURLByIdentifier.mockReturnValueOnce(queueURLFixture);
          sqsClient.on(DeleteMessageCommand).rejectsOnce(awsErrorFixture);

          try {
            await sqsServiceProvider.deleteMessage(queueIdentifierFixture, messageReceiptHandleFixture);
          } catch (error) {
            result = error;
          }
        });

        afterEach(() => {
          sqsClient.reset();
        });

        it('have called getQueueURLByIdentifier with correct queue identifier', () => {
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledTimes(1);
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('have called sqsClient with DeleteMessageCommand', () => {
          expect(sqsClient).toHaveReceivedCommandTimes(DeleteMessageCommand, 1);
          expect(sqsClient).toHaveReceivedCommandWith(DeleteMessageCommand, {
            QueueUrl: queueURLFixture,
            ReceiptHandle: messageReceiptHandleFixture,
          });
        });

        it('should throw an error', () => {
          expect(result).toBeInstanceOf(DeleteMessageCommandError);
          if (result instanceof DeleteMessageCommandError) {
            expect((result.awsError as Error).message).toBe(awsErrorFixture.message);
          }
        });
      });
    });
  });

  describe('sendMessage', () => {
    describe('when called', () => {
      describe('and queue does not exist', () => {
        let result: ReceiveMessageCommandOutput;

        beforeEach(async () => {
          queuesServiceMock.getQueueURLByIdentifier.mockReturnValueOnce(null);
          try {
            await sqsServiceProvider.sendMessage(queueIdentifierFixture, messageFixture);
          } catch (error) {
            result = error;
          }
        });

        afterEach(() => {
          sqsClient.reset();
        });

        it('have called getQueueURLByIdentifier with correct queue identifier', () => {
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledTimes(1);
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('should throw an error', () => {
          expect(result).toBeInstanceOf(QueueIdentifierNotRegisteredError);
        });

        it('should not have called sqsClient with SendMessageCommand', () => {
          expect(sqsClient).not.toHaveReceivedCommand(SendMessageCommand);
        });
      });

      describe('and queue exists', () => {
        let result: ReceiveMessageCommandOutput;

        beforeEach(async () => {
          queuesServiceMock.getQueueURLByIdentifier.mockReturnValueOnce(queueURLFixture);
          sqsClient.on(SendMessageCommand).resolvesOnce(sendMessageCommandOutputFixture);

          result = await sqsServiceProvider.sendMessage(queueIdentifierFixture, messageFixture);
        });

        afterEach(() => {
          sqsClient.reset();
        });

        it('have called getQueueURLByIdentifier with correct queue identifier', () => {
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledTimes(1);
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('have called sqsClient with SendMessageCommand', () => {
          expect(sqsClient).toHaveReceivedCommandTimes(SendMessageCommand, 1);
          expect(sqsClient).toHaveReceivedCommandWith(SendMessageCommand, {
            QueueUrl: queueURLFixture,
            MessageBody: messageFixture.MessageBody,
          });
        });

        it('should return the correct messages', () => {
          expect(result).toEqual(sendMessageCommandOutputFixture);
        });
      });

      describe(`and queue exists 
                and command returns error`, () => {
        let result: ReceiveMessageCommandOutput;

        beforeEach(async () => {
          queuesServiceMock.getQueueURLByIdentifier.mockReturnValueOnce(queueURLFixture);
          sqsClient.on(SendMessageCommand).rejectsOnce(awsErrorFixture);

          try {
            await sqsServiceProvider.sendMessage(queueIdentifierFixture, messageFixture);
          } catch (error) {
            result = error;
          }
        });

        afterEach(() => {
          sqsClient.reset();
        });

        it('have called getQueueURLByIdentifier with correct queue identifier', () => {
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledTimes(1);
          expect(queuesServiceMock.getQueueURLByIdentifier).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('have called sqsClient with SendMessageCommand', () => {
          expect(sqsClient).toHaveReceivedCommandTimes(SendMessageCommand, 1);
          expect(sqsClient).toHaveReceivedCommandWith(SendMessageCommand, {
            QueueUrl: queueURLFixture,
            MessageBody: messageFixture.MessageBody,
          });
        });

        it('should throw an error', () => {
          expect(result).toBeInstanceOf(SendMessageCommandError);
          if (result instanceof SendMessageCommandError) {
            expect((result.awsError as Error).message).toBe(awsErrorFixture.message);
          }
        });
      });
    });
  });
});
