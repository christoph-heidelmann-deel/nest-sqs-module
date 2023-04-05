import { SYMBOLS } from "./ioc/symbols";
import { SQSMessageHandler } from "./decorators/sqs-message-handler";
import { SQSErrorHandler } from "./decorators/sqs-error-handler";
import {
  SQSClientConfig,
  SQSErrorHandlerInterface,
  SQSMessageHandlerInterface,
  SQSModuleConfiguration,
  SQSForFeatureConfiguration,
  SQSMessage,
  SQSMessageService,
} from "./types";
import { SQSModule } from "../sqs.module";

const SQS_SYMBOLS = {
  SQS_SERVICE: SYMBOLS.SQS_SERVICE,
};
export {
  SQS_SYMBOLS,
  SQSMessageService,
  SQSMessageHandler,
  SQSMessageHandlerInterface,
  SQSErrorHandler,
  SQSErrorHandlerInterface,
  SQSClientConfig,
  SQSModuleConfiguration,
  SQSModule,
  SQSForFeatureConfiguration,
  SQSMessage,
};
