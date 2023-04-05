## SQS Module documentation

This module provides integration with AWS SQS service based on the AWS SDK v3 lib.

## Usage example

In general different queues accessed by an identifier.
During setup you need to associate queueURLs with queueIdentifiers.

In same module or parent module:

```
    imports:[
        SQSModule.forRoot({
            useFactory: <TConfiguration>(configService: ConfigService<AWSEnvironmentVars>): TConfiguration => {
                const clientConfig = {
                    credentials:
                    process.env.NODE_ENV === 'development'
                        ? {
                            accessKeyId: configService.get('accessKeyId'),
                            secretAccessKey: configService.get('secretAccessKey'),
                        }
                        : undefined,
                    region: configService.get('region'),
                    endpoint: configService.get('endpoint'),
                };

                return { clientConfig } as TConfiguration;
            },
            inject: [ConfigService],
        })
    ]
```

By default the SQS consumer service polls for new messages every 1000ms seconds this

In the module you want to listen on SQS messages in queues:

```
    imports:[
        SQSModule.forFeature({
            useFactory: (configService: ConfigService<SQSQueuesEnvironmentVars>): SQSForFeatureConfiguration => {
                const sqsForFeatureConfiguration: SQSForFeatureConfiguration = {
                    queues: {
                        [QUEUE_IDENTIFIER]: configService.getOrThrow('queueUrl',),
                    },
                    consumerOptions: {
                        waitTimeBetweenTwoPollsMS: 1000, // By default the SQS consumer service polls for new messages every 1000ms.
                                                         // You can change this behaviour here.
                    },
                };
                return sqsForFeatureConfiguration;
            },
            inject: [ConfigService],
        }),
        messageHandler
    ]
```

And the message and error Handler:

```
@Injectable()
export class SQSMessageHandler implements SQSMessageHandlerInterface, SQSErrorHandlerInterface {

  public constructor(@Inject(SQS_SYMBOLS.SQS_SERVICE_PROVIDER) protected readonly sqsService: SQSMessageService) {}

  @SQSErrorHandler({ queueIdentifier: QUEUE_IDENTIFIER })
  public async handleError(message: SQSMessage, error: Error): Promise<void> {
    this.logger.log('handleError', { message, error });
    await this.sqsService.sendMessage(DEADLETTER_QUEUE_IDENTIFIER, message);
  }

  @SQSMessageHandler({ queueIdentifier: QUEUE_IDENTIFIER })
  public async handleMessage(message: Message): Promise<void> {
    this.logger.log('handleMessage', message);
    await this.sqsService.deleteMessage(QUEUE_IDENTIFIER, message.ReceiptHandle);
  }
}
```

The sqs Service can be injected and provides basic message handling methods:

```
public constructor(@Inject(SQS_SYMBOLS.SQS_SERVICE_PROVIDER) protected readonly sqsService: SQSMessageService) {}
```
