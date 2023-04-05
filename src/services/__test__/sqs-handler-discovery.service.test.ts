import { DiscoveredMethodWithMeta, DiscoveryService } from '@nestjs-plus/discovery';
import { SYMBOLS } from '../../IoC/symbols';
import { SQSMessageHandlerDecoratorParams } from '../../types';
import { SQSHandlerDiscoveryService } from '../sqs-handler-discovery.service';
import { MultipleHandlersNotAllowedError } from '../sqs-handler-discovery.service.errors';

describe(SQSHandlerDiscoveryService.name, () => {
  let discoveryServiceMock: jest.Mocked<DiscoveryService>;
  let sqsHandlerDiscoveryService: SQSHandlerDiscoveryService;
  const queueIdentifierFixture = 'test-identifier';
  let handlerDiscoveryMock: jest.Mocked<DiscoveredMethodWithMeta<SQSMessageHandlerDecoratorParams>>;
  const mockMessageHandlerResultFixture = 'mock-message-handler';

  beforeAll(() => {
    discoveryServiceMock = { providerMethodsWithMetaAtKey: jest.fn() } as Partial<
      jest.Mocked<DiscoveryService>
    > as jest.Mocked<DiscoveryService>;

    sqsHandlerDiscoveryService = new SQSHandlerDiscoveryService(discoveryServiceMock);

    handlerDiscoveryMock = <DiscoveredMethodWithMeta<SQSMessageHandlerDecoratorParams>>{
      discoveredMethod: {
        handler: () => {
          return mockMessageHandlerResultFixture;
        },
        parentClass: Object(),
      },
      meta: {
        queueIdentifier: queueIdentifierFixture,
      },
    };
  });

  describe('discoverMessageHandler', () => {
    describe('when called', () => {
      describe('and no message handler exists', () => {
        let result: unknown;
        beforeEach(async () => {
          discoveryServiceMock.providerMethodsWithMetaAtKey.mockResolvedValueOnce([]);
          result = await sqsHandlerDiscoveryService.discoverMessageHandler(queueIdentifierFixture);
        });
        it('should have called providerMethodsWithMetaAtKey', () => {
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledTimes(1);
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledWith(
            SYMBOLS.SQS_DECORATOR_CONSUMER_METHOD,
          );
        });
        it('should return null', () => {
          expect(result).toBe(null);
        });
      });

      describe('and single message handler exists', () => {
        let result: unknown;
        beforeEach(async () => {
          discoveryServiceMock.providerMethodsWithMetaAtKey.mockResolvedValueOnce([handlerDiscoveryMock]);
          result = await sqsHandlerDiscoveryService.discoverMessageHandler(queueIdentifierFixture);
        });
        it('should have called providerMethodsWithMetaAtKey', () => {
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledTimes(1);
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledWith(
            SYMBOLS.SQS_DECORATOR_CONSUMER_METHOD,
          );
        });
        it('should return the message handler', () => {
          expect(result).toBe(handlerDiscoveryMock);
        });
      });

      describe('and multiple message handlers for the same queue exists', () => {
        let result: unknown;
        beforeEach(async () => {
          discoveryServiceMock.providerMethodsWithMetaAtKey.mockResolvedValueOnce([
            handlerDiscoveryMock,
            handlerDiscoveryMock,
          ]);
          try {
            await sqsHandlerDiscoveryService.discoverMessageHandler(queueIdentifierFixture);
          } catch (error) {
            result = error;
          }
        });
        it('should have called providerMethodsWithMetaAtKey', () => {
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledTimes(1);
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledWith(
            SYMBOLS.SQS_DECORATOR_CONSUMER_METHOD,
          );
        });
        it('should throw an error', () => {
          expect(result).toBeInstanceOf(MultipleHandlersNotAllowedError);
        });
      });
    });
  });

  describe('discoverErrorHandler', () => {
    describe('when called', () => {
      describe('and no message handler exists', () => {
        let result: unknown;
        beforeEach(async () => {
          discoveryServiceMock.providerMethodsWithMetaAtKey.mockResolvedValueOnce([]);
          result = await sqsHandlerDiscoveryService.discoverErrorHandler(queueIdentifierFixture);
        });
        it('should have called providerMethodsWithMetaAtKey', () => {
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledTimes(1);
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledWith(
            SYMBOLS.SQS_DECORATOR_ERROR_HANDLER,
          );
        });
        it('should return null', () => {
          expect(result).toBe(null);
        });
      });

      describe('and single message handler exists', () => {
        let result: unknown;
        beforeEach(async () => {
          discoveryServiceMock.providerMethodsWithMetaAtKey.mockResolvedValueOnce([handlerDiscoveryMock]);
          result = await sqsHandlerDiscoveryService.discoverErrorHandler(queueIdentifierFixture);
        });
        it('should have called providerMethodsWithMetaAtKey', () => {
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledTimes(1);
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledWith(
            SYMBOLS.SQS_DECORATOR_ERROR_HANDLER,
          );
        });
        it('should return the message handler', () => {
          expect(result).toBe(handlerDiscoveryMock);
        });
      });

      describe('and multiple message handlers for the same queue exists', () => {
        let result: unknown;
        beforeEach(async () => {
          discoveryServiceMock.providerMethodsWithMetaAtKey.mockResolvedValueOnce([
            handlerDiscoveryMock,
            handlerDiscoveryMock,
          ]);
          try {
            await sqsHandlerDiscoveryService.discoverErrorHandler(queueIdentifierFixture);
          } catch (error) {
            result = error;
          }
        });
        it('should have called providerMethodsWithMetaAtKey', () => {
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledTimes(1);
          expect(discoveryServiceMock.providerMethodsWithMetaAtKey).toHaveBeenCalledWith(
            SYMBOLS.SQS_DECORATOR_ERROR_HANDLER,
          );
        });
        it('should throw an error', () => {
          expect(result).toBeInstanceOf(MultipleHandlersNotAllowedError);
        });
      });
    });
  });
});
