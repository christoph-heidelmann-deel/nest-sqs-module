import { DiscoveredMethodWithMeta } from '@nestjs-plus/discovery';
import {
  SQSErrorHandlerDecoratorParams,
  SQSForFeatureConfiguration,
  SQSMessage,
  SQSMessageHandlerDecoratorParams,
} from '../../types';
import { SQSHandlerDiscoveryService } from '../sqs-handler-discovery.service';
import { SQSHandlerRegisterService } from '../sqs-handler-register.service';
import { SQSHandlersManagerService } from '../sqs-handlers-manager.service';

describe(SQSHandlerRegisterService.name, () => {
  let handlerManagerMock: jest.Mocked<SQSHandlersManagerService>;
  let handlerDiscoveryServiceMock: jest.Mocked<SQSHandlerDiscoveryService>;
  let forFeatureConfig: SQSForFeatureConfiguration;
  const queueIdentifierFixture = 'test-identifier';
  const queueURLFixture = 'any-url';
  const mockMessageHandlerResultFixture = 'mock-message-handler';
  const mockErrorHandlerResultFixture = 'mock-error-handler';
  let sqsHandlerRegisterService: SQSHandlerRegisterService;
  let messageHandlerDiscoveredMock: jest.Mocked<DiscoveredMethodWithMeta<SQSMessageHandlerDecoratorParams>>;
  let errorHandlerDiscoveredMock: jest.Mocked<DiscoveredMethodWithMeta<SQSErrorHandlerDecoratorParams>>;

  beforeAll(() => {
    handlerManagerMock = { registerSQSConsumer: jest.fn(), registerErrorHandler: jest.fn() } as Partial<
      jest.Mocked<SQSHandlersManagerService>
    > as jest.Mocked<SQSHandlersManagerService>;
    handlerDiscoveryServiceMock = {
      discoverMessageHandler: jest.fn(),
      discoverErrorHandler: jest.fn(),
    } as Partial<jest.Mocked<SQSHandlerDiscoveryService>> as jest.Mocked<SQSHandlerDiscoveryService>;
    messageHandlerDiscoveredMock = { discoverMessageHandler: jest.fn(), discoverErrorHandler: jest.fn() } as Partial<
      jest.Mocked<DiscoveredMethodWithMeta<SQSMessageHandlerDecoratorParams>>
    > as jest.Mocked<DiscoveredMethodWithMeta<SQSMessageHandlerDecoratorParams>>;
    errorHandlerDiscoveredMock = { discoverMessageHandler: jest.fn(), discoverErrorHandler: jest.fn() } as Partial<
      jest.Mocked<DiscoveredMethodWithMeta<SQSErrorHandlerDecoratorParams>>
    > as jest.Mocked<DiscoveredMethodWithMeta<SQSErrorHandlerDecoratorParams>>;
    forFeatureConfig = {
      queues: { [queueIdentifierFixture]: queueURLFixture },
      consumerOptions: { waitTimeBetweenTwoPollsMS: 500 },
    };

    messageHandlerDiscoveredMock = <DiscoveredMethodWithMeta<SQSMessageHandlerDecoratorParams>>{
      discoveredMethod: {
        handler: () => {
          return mockMessageHandlerResultFixture;
        },
        parentClass: Object(),
      },
    };

    errorHandlerDiscoveredMock = <DiscoveredMethodWithMeta<SQSErrorHandlerDecoratorParams>>{
      discoveredMethod: {
        handler: () => {
          return mockErrorHandlerResultFixture;
        },
        parentClass: Object(),
      },
    };

    sqsHandlerRegisterService = new SQSHandlerRegisterService(
      handlerManagerMock,
      handlerDiscoveryServiceMock,
      forFeatureConfig,
    );
  });

  describe('onModuleInit', () => {
    describe('when called', () => {
      describe('and no handler exists', () => {
        beforeEach(async () => {
          handlerDiscoveryServiceMock.discoverMessageHandler.mockResolvedValueOnce(null);
          await sqsHandlerRegisterService.onModuleInit();
        });

        it('should have called discoverMessageHandler', () => {
          expect(handlerDiscoveryServiceMock.discoverMessageHandler).toHaveBeenCalledTimes(1);
          expect(handlerDiscoveryServiceMock.discoverMessageHandler).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('should not have called discoverMessageHandler', () => {
          expect(handlerDiscoveryServiceMock.discoverErrorHandler).toHaveBeenCalledTimes(0);
        });

        it('should not have called registerSQSConsumer', () => {
          expect(handlerManagerMock.registerSQSConsumer).toHaveBeenCalledTimes(0);
        });

        it('should not have called registerErrorHandler', () => {
          expect(handlerManagerMock.registerErrorHandler).toHaveBeenCalledTimes(0);
        });
      });

      describe(`and handler exists
                and error handler does not exist`, () => {
        beforeEach(async () => {
          handlerDiscoveryServiceMock.discoverMessageHandler.mockResolvedValueOnce(messageHandlerDiscoveredMock);
          handlerDiscoveryServiceMock.discoverErrorHandler.mockResolvedValueOnce(null);
          await sqsHandlerRegisterService.onModuleInit();
        });

        it('should have called discoverMessageHandler', () => {
          expect(handlerDiscoveryServiceMock.discoverMessageHandler).toHaveBeenCalledTimes(1);
          expect(handlerDiscoveryServiceMock.discoverMessageHandler).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('should have called discoverMessageHandler', () => {
          expect(handlerDiscoveryServiceMock.discoverErrorHandler).toHaveBeenCalledTimes(1);
          expect(handlerDiscoveryServiceMock.discoverErrorHandler).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('should have called registerSQSConsumer', () => {
          expect(handlerManagerMock.registerSQSConsumer).toHaveBeenCalledTimes(1);
          expect(handlerManagerMock.registerSQSConsumer).toHaveBeenLastCalledWith(
            queueIdentifierFixture,
            expect.anything(),
          );
        });

        it('should have registered the correct message handler', () => {
          expect(handlerManagerMock.registerSQSConsumer.mock.calls[0][1]({})).toBe(mockMessageHandlerResultFixture);
        });
      });

      describe(`and handler exists
                and error handler exist`, () => {
        beforeEach(async () => {
          handlerDiscoveryServiceMock.discoverMessageHandler.mockResolvedValueOnce(messageHandlerDiscoveredMock);
          handlerDiscoveryServiceMock.discoverErrorHandler.mockResolvedValueOnce(errorHandlerDiscoveredMock);
          await sqsHandlerRegisterService.onModuleInit();
        });

        it('should have called discoverMessageHandler', () => {
          expect(handlerDiscoveryServiceMock.discoverMessageHandler).toHaveBeenCalledTimes(1);
          expect(handlerDiscoveryServiceMock.discoverMessageHandler).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('should have called discoverMessageHandler', () => {
          expect(handlerDiscoveryServiceMock.discoverErrorHandler).toHaveBeenCalledTimes(1);
          expect(handlerDiscoveryServiceMock.discoverErrorHandler).toHaveBeenCalledWith(queueIdentifierFixture);
        });

        it('should have called registerSQSConsumer', () => {
          expect(handlerManagerMock.registerSQSConsumer).toHaveBeenCalledTimes(1);
          expect(handlerManagerMock.registerSQSConsumer).toHaveBeenLastCalledWith(
            queueIdentifierFixture,
            expect.anything(),
          );
        });

        it('should have registered the correct message handler', () => {
          expect(handlerManagerMock.registerSQSConsumer.mock.calls[0][1]({})).toBe(mockMessageHandlerResultFixture);
        });

        it('should have called registerErrorHandler', () => {
          expect(handlerManagerMock.registerErrorHandler).toHaveBeenCalledTimes(1);
          expect(handlerManagerMock.registerErrorHandler).toHaveBeenLastCalledWith(
            queueIdentifierFixture,
            expect.anything(),
          );
        });

        it('should have registered the correct message handler', () => {
          expect(handlerManagerMock.registerErrorHandler.mock.calls[0][1](<SQSMessage>{}, new Error())).toBe(
            mockErrorHandlerResultFixture,
          );
        });
      });
    });
  });
});
