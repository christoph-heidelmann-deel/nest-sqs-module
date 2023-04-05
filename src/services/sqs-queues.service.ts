import { Injectable } from '@nestjs/common';
import { QueueURL, SQSQueues } from '../types';
import { QueueIdentifierAlreadyRegisteredError } from './sqs-queues.service.errors';

@Injectable()
export class SQSQueuesService {
  protected readonly queues: SQSQueues = {};

  public getQueueURLByIdentifier(queueIdentifier: string): QueueURL | null {
    if (!(queueIdentifier in this.queues)) {
      return null;
    }
    return this.queues[queueIdentifier];
  }

  public async addQueue(queueIdentifier: string, queueURL: QueueURL): Promise<void> {
    if (queueIdentifier in this.queues) {
      throw new QueueIdentifierAlreadyRegisteredError(queueIdentifier);
    }
    this.queues[queueIdentifier] = queueURL;
  }
}
