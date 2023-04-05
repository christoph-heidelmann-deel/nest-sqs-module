import { CustomError } from '../../../shared/custom-error';

export class ErrorHandlerWithoutConsumerNotAllowed extends CustomError {
  constructor(queueIdentifier: string) {
    super();
    this.message = `Registering error handler for ${queueIdentifier} without existing consumer is not allowed.`;
  }
}

export class ConsumerAlreadyRegisteredError extends CustomError {
  constructor(queueIdentifier: string) {
    super();
    this.message = `Consumer for queue ${queueIdentifier} already exists`;
  }
}
