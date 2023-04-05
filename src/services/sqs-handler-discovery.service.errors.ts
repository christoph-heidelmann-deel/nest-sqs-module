import { CustomError } from '../../../shared/custom-error';

export class MultipleHandlersNotAllowedError extends CustomError {
  constructor(queueIdentifier: string, classesWithHandlers: string[]) {
    super();
    this.message = `Multiple handlers not allowed for: ${queueIdentifier} trying to register handlers in ${classesWithHandlers.join(
      ',',
    )}`;
  }
}
