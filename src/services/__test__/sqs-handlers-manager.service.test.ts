import { MESSAGE_HANDLER_PROCESSING_ERROR } from '../../constants/event-names';
import { SQSForFeatureConfiguration, SQSMessageHandlerFunction } from '../../types';
import { SQSHandlersManagerService } from '../sqs-handlers-manager.service';
import {
  ConsumerAlreadyRegisteredError,
  ErrorHandlerWithoutConsumerNotAllowed,
} from '../sqs-handlers-manager.service.errors';
import { SQSService } from '../sqs.service';

describe(SQSHandlersManagerService.name, () => {
  let sqsServiceMock: jest.Mocked<SQSService>;
  let messageHandlerMock: jest.Mocked<SQSMessageHandlerFunction>;
  let sqsForFeatureConfiguration: SQSForFeatureConfiguration;
  let sqsHandlersManagerService: SQSHandlersManagerService;
  const queueIdentifierFixture = 'test-identifier';

  beforeAll(() => {
    sqsServiceMock = { receiveMessages: jest.fn() } as Partial<jest.Mocked<SQSService>> as jest.Mocked<SQSService>;
    messageHandlerMock = jest.fn();
    sqsForFeatureConfiguration = <SQSForFeatureConfiguration>{
      queues: {},
      consumerOptions: { waitTimeBetweenTwoPollsMS: 500 },
    };
  });

  describe('onApplicationBootstrap', () => {
    describe('when called', () => {
      describe('should start registered consumer', () => {
        beforeAll(() => {
          sqsHandlersManagerService = new SQSHandlersManagerService(sqsServiceMock, sqsForFeatureConfiguration);
        });

        beforeAll(async () => {
          await sqsHandlersManagerService.registerSQSConsumer(queueIdentifierFixture, messageHandlerMock);
          sqsHandlersManagerService.onApplicationBootstrap();
        });

        afterAll(() => {
          sqsHandlersManagerService.consumers[queueIdentifierFixture].stop();
        });

        it('should have started sqs consumer', () => {
          expect(sqsHandlersManagerService.consumers[queueIdentifierFixture].running).toBe(true);
        });
      });
    });
  });

  describe('onModuleDestroy', () => {
    describe('when called', () => {
      describe('should stop registered consumer', () => {
        beforeAll(() => {
          sqsHandlersManagerService = new SQSHandlersManagerService(sqsServiceMock, sqsForFeatureConfiguration);
        });

        beforeAll(async () => {
          await sqsHandlersManagerService.registerSQSConsumer(queueIdentifierFixture, messageHandlerMock);
          sqsHandlersManagerService.onModuleDestroy();
        });

        it('should have started sqs consumer', () => {
          expect(sqsHandlersManagerService.consumers[queueIdentifierFixture].running).toBe(false);
        });
      });
    });
  });

  describe('registerSQSConsumer', () => {
    describe('when called', () => {
      describe('and consumer does not exists', () => {
        beforeAll(() => {
          sqsHandlersManagerService = new SQSHandlersManagerService(sqsServiceMock, sqsForFeatureConfiguration);
        });

        beforeAll(async () => {
          await sqsHandlersManagerService.registerSQSConsumer(queueIdentifierFixture, messageHandlerMock);
        });

        it('should have the sqs consumer', () => {
          expect(queueIdentifierFixture in sqsHandlersManagerService.consumers).toBe(true);
        });
      });
    });

    describe('when called', () => {
      describe('and consumer already is registered', () => {
        beforeAll(() => {
          sqsHandlersManagerService = new SQSHandlersManagerService(sqsServiceMock, sqsForFeatureConfiguration);
        });

        let result: unknown;

        beforeAll(async () => {
          await sqsHandlersManagerService.registerSQSConsumer(queueIdentifierFixture, messageHandlerMock);
          try {
            await sqsHandlersManagerService.registerSQSConsumer(queueIdentifierFixture, messageHandlerMock);
          } catch (error) {
            result = error;
          }
        });

        it('should throw and exception', () => {
          expect(result).toBeInstanceOf(ConsumerAlreadyRegisteredError);
        });
      });
    });
  });

  describe('registerErrorHandler', () => {
    describe('when called', () => {
      describe('and consumer handler is not registered', () => {
        beforeAll(() => {
          sqsHandlersManagerService = new SQSHandlersManagerService(sqsServiceMock, sqsForFeatureConfiguration);
        });

        let result: unknown;

        beforeAll(async () => {
          try {
            await sqsHandlersManagerService.registerErrorHandler(queueIdentifierFixture, messageHandlerMock);
          } catch (error) {
            result = error;
          }
        });

        it('should throw and exception', () => {
          expect(result).toBeInstanceOf(ErrorHandlerWithoutConsumerNotAllowed);
        });
      });
    });

    describe('when called', () => {
      describe('and consumer handler is registered', () => {
        beforeAll(() => {
          sqsHandlersManagerService = new SQSHandlersManagerService(sqsServiceMock, sqsForFeatureConfiguration);
        });

        beforeAll(async () => {
          await sqsHandlersManagerService.registerSQSConsumer(queueIdentifierFixture, messageHandlerMock);
          await sqsHandlersManagerService.registerErrorHandler(queueIdentifierFixture, messageHandlerMock);
        });

        it('should have started sqs consumer', () => {
          expect(
            sqsHandlersManagerService.consumers[queueIdentifierFixture].listeners(MESSAGE_HANDLER_PROCESSING_ERROR)
              .length,
          ).toBe(1);
        });
      });
    });
  });
});
