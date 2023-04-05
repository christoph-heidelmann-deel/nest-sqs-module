import { CustomError } from '../../../shared/custom-error';

export class QueueIdentifierAlreadyRegisteredError extends CustomError {
  constructor(queueIdentifier: string) {
    super();
    this.message = `Queue already exists: ${queueIdentifier}`;
  }
}
