import { SQSQueuesService } from '../sqs-queues.service';
import { QueueIdentifierAlreadyRegisteredError } from '../sqs-queues.service.errors';

describe(SQSQueuesService.name, () => {
  let sqsQueuesService: SQSQueuesService;
  const queueIdentifierFixture = 'test-identifier';
  const notExistingQueueIdentifierFixture = 'not-existing-identifier';
  const queueURLFixture = 'any-url';

  describe('addQueue', () => {
    describe('when called', () => {
      describe('and queue already exists', () => {
        let firstResult: void;
        let secondResult: void;
        beforeAll(async () => {
          sqsQueuesService = new SQSQueuesService();
          firstResult = await sqsQueuesService.addQueue(queueIdentifierFixture, queueURLFixture);
          try {
            await sqsQueuesService.addQueue(queueIdentifierFixture, queueURLFixture);
          } catch (error) {
            secondResult = error;
          }
        });

        it('first call should succeed', () => {
          expect(firstResult).not.toBeInstanceOf(Error);
        });

        it('second call should be an instance of an error ', () => {
          expect(secondResult).toBeInstanceOf(QueueIdentifierAlreadyRegisteredError);
        });
      });
    });
  });

  describe('getQueueURLByIdentifier', () => {
    describe('when called', () => {
      describe('and queue exists', () => {
        let result: string | null;
        beforeAll(async () => {
          sqsQueuesService = new SQSQueuesService();
          await sqsQueuesService.addQueue(queueIdentifierFixture, queueURLFixture);
          result = sqsQueuesService.getQueueURLByIdentifier(queueIdentifierFixture);
        });

        it('should return correct queue url', () => {
          expect(result).toBe(queueURLFixture);
        });
      });

      describe('and queue does not exists', () => {
        let result: string | null;
        beforeAll(async () => {
          sqsQueuesService = new SQSQueuesService();
          await sqsQueuesService.addQueue(queueIdentifierFixture, queueURLFixture);
          result = sqsQueuesService.getQueueURLByIdentifier(notExistingQueueIdentifierFixture);
        });

        it('should return correct queue url', () => {
          expect(result).toBe(null);
        });
      });
    });
  });
});
