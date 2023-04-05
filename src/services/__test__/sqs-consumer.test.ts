import { Message, ReceiveMessageCommandOutput } from '@aws-sdk/client-sqs';
import { MESSAGE_HANDLER_PROCESSING_ERROR } from '../../constants/event-names';
import { SQSConsumer } from '../sqs-consumer';
import { SQSService } from '../sqs.service';

jest.spyOn(global, 'setTimeout');

describe(SQSConsumer.name, () => {
  let sqsConsumer: SQSConsumer;
  let sqsService: jest.Mocked<SQSService>;
  let messageHandlerMock: jest.Mock<Promise<void>>;
  const messageMock: Message = <Message>{ Body: 'any' };
  const queueIdentifierFixture = 'test-identifier';
  const awsErrorFixture = new Error('test-aws-error');
  const handlerError = new Error('handler-error');

  beforeAll(() => {
    messageHandlerMock = jest.fn();
    sqsService = { receiveMessages: jest.fn() } as Partial<jest.Mocked<SQSService>> as jest.Mocked<SQSService>;
    sqsConsumer = new SQSConsumer({
      queueIdentifier: queueIdentifierFixture,
      messageHandler: messageHandlerMock,
      sqsService,
      consumerOptions: {
        waitTimeBetweenTwoPollsMS: 100,
      },
    });
    sqsConsumer['logger'].error = jest.fn();
    sqsConsumer.emit = jest.fn();
  });

  describe('start', () => {
    describe('when called', () => {
      let result: boolean;
      beforeEach(async () => {
        sqsService.receiveMessages.mockResolvedValueOnce(<ReceiveMessageCommandOutput>{
          Messages: [messageMock],
        });
        sqsConsumer.start();
        result = sqsConsumer.running;
      });

      afterEach(() => {
        sqsConsumer.stop();
      });

      it('running should be true', () => {
        expect(result).toBe(true);
      });

      it('receiveMessages should be called', () => {
        expect(sqsService.receiveMessages).toHaveBeenCalledTimes(1);
        expect(sqsService.receiveMessages).toHaveBeenCalledWith(queueIdentifierFixture);
      });

      it('messageHandler should be called', () => {
        expect(messageHandlerMock).toHaveBeenCalledTimes(1);
        expect(messageHandlerMock).toHaveBeenCalledWith(messageMock);
      });

      it('should have called setTimeout', () => {
        expect(setTimeout).toHaveBeenCalledTimes(1);
      });
    });

    describe(`when called 
              and receiveMessage rejects`, () => {
      let result: boolean;
      beforeEach(async () => {
        sqsService.receiveMessages.mockRejectedValueOnce(awsErrorFixture);
        sqsConsumer.start();
        result = sqsConsumer.running;
      });

      afterEach(() => {
        sqsConsumer.stop();
      });

      it('running should be true', () => {
        expect(result).toBe(true);
      });

      it('receiveMessages should be called', () => {
        expect(sqsService.receiveMessages).toHaveBeenCalledTimes(1);
        expect(sqsService.receiveMessages).toHaveBeenCalledWith(queueIdentifierFixture);
      });

      it('error should be logged', () => {
        expect(sqsConsumer['logger'].error).toHaveBeenCalledTimes(1);
        expect(sqsConsumer['logger'].error).toHaveBeenCalledWith('receiveMessage', { error: awsErrorFixture });
      });

      it('should have called setTimeout', () => {
        expect(setTimeout).toHaveBeenCalledTimes(1);
      });
    });

    describe(`when called 
              and messageHandler rejects`, () => {
      let result: boolean;
      beforeEach(async () => {
        sqsService.receiveMessages.mockResolvedValueOnce(<ReceiveMessageCommandOutput>{ Messages: [messageMock] });
        messageHandlerMock.mockRejectedValueOnce(handlerError);
        sqsConsumer.start();
        result = sqsConsumer.running;
      });

      afterEach(() => {
        sqsConsumer.stop();
      });

      it('running should be true', () => {
        expect(result).toBe(true);
      });

      it('receiveMessages should be called', () => {
        expect(sqsService.receiveMessages).toHaveBeenCalledTimes(1);
        expect(sqsService.receiveMessages).toHaveBeenCalledWith(queueIdentifierFixture);
      });

      it('messageHandler should be called', () => {
        expect(messageHandlerMock).toHaveBeenCalledTimes(1);
        expect(messageHandlerMock).toHaveBeenCalledWith(messageMock);
      });

      it('error should be logged', () => {
        expect(sqsConsumer['logger'].error).toHaveBeenCalledTimes(1);
        expect(sqsConsumer['logger'].error).toHaveBeenCalledWith('messageHandler', { error: handlerError });
      });

      it('error event should be emitted', () => {
        expect(sqsConsumer.emit).toHaveBeenCalledTimes(1);
        expect(sqsConsumer.emit).toHaveBeenCalledWith(MESSAGE_HANDLER_PROCESSING_ERROR, handlerError, messageMock);
      });

      it('should have called setTimeout', () => {
        expect(setTimeout).toHaveBeenCalledTimes(1);
      });
    });
  });
});
