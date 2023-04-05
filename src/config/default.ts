import { SQSForFeatureConfiguration } from '../types';

export const DefaultSQSModuleConfiguration: SQSForFeatureConfiguration = {
  queues: {},
  consumerOptions: {
    waitTimeBetweenTwoPollsMS: 1000,
  },
};
