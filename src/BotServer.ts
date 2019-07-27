import { Server } from 'http';
import { List, Map, Set } from 'immutable';
import { default as IntlMessageFormat } from 'intl-messageformat';
import * as Koa from 'koa';
import * as BodyParser from 'koa-bodyparser';
import * as Router from 'koa-router';
import * as mongoose from 'mongoose';
import * as AWS from 'aws-sdk';
import * as winston from 'winston';
import { isObject, isString, isNumber, isNil } from 'lodash';
import { createClient, RedisClient } from 'redis';
import {
  intentRepository as mongoIntentRepository,
  configRepository as mongoConfigRepository,
  messageRepository as mongoMessageRepository,
  issueRepository as mongoIssueRepository,
  senderInfoRepository as mongoSenderInfoRepository,
} from 'lexica-dialog-repository';
import {
  BotResponse,
  BotContextCommand,
  BotServerConfig,
  BotContext,
  ConfigRepository,
  Executor,
  Messenger,
  Middleware,
  NlpService,
  FileService,
  TranscodeService,
  PreProcessor,
  PostProcessor,
  IntentRepository,
  SessionRepository,
  MessageRepository,
  IssueRepository,
  SenderInfoRepository,
} from './Api';
import * as middlewares from './middlewares';
import * as executors from './executors';
import * as preProcessors from './pre-processors';
import * as postProcessors from './post-processors';
import { DefaultNlpService, ExternalNlpService } from './nlp';
import { RedisSessionRepository } from './session';
import { S3Service, ElasticTranscoderService } from './aws';
import { Service } from 'aws-sdk';

class BotServer {
  public readonly server: Koa;
  public readonly router: Router;
  public redisClient: RedisClient;
  public mongoConnection: mongoose.Connection;
  private config: BotServerConfig;
  private messengers: Map<string, Messenger<any, any>>;
  private middlewares: Map<number, Middleware>;
  private sortedMiddlewares: List<Middleware>;
  private preProcessors: Map<string, PreProcessor>;
  private postProcessors: Map<string, PostProcessor>;
  private executors: Map<string, Executor>;

  private nlpService: NlpService;
  private fileService: FileService;
  private transcodeService: TranscodeService;
  private sessionRepository: SessionRepository;
  private intentRepository: IntentRepository;
  private configRepository: ConfigRepository;
  private messageRepository: MessageRepository;
  private issueRepository: IssueRepository;
  private senderInfoRepository: SenderInfoRepository;
  private logger: winston.LoggerInstance;
  private nodeServer: Server;

  constructor(config: BotServerConfig) {
    this.server = new Koa();
    this.router = new Router();
    this.config = config;
    this.messengers = config.messengers;
    // merge middlewares provided by configuration with default middleware
    this.middlewares = this.createDefaultMiddlewares().merge(config.middlewares);
    this.preProcessors = this.createDefaultPreProcessor().merge(config.preProcessors);
    this.postProcessors = this.createDefaultPostProcessor().merge(config.postProcessors);
    this.executors = this.createDefaultExecutor().merge(config.executors);
  }

  public init() {
    const { mongo, redis } = this.config;

    mongoose.connect(mongo.url, { ...mongo.options });
    (mongoose as any).Promise = global.Promise;

    this.mongoConnection = mongoose.connection;

    const redisConfig: any = {
      ...redis.options,
    };

    if (redis.url.trim()) {
      redisConfig.url = redis.url;
    } else {
      redisConfig.host = redis.host;
      redisConfig.port = redis.port;
    }

    this.redisClient = createClient(redisConfig);

    AWS.config.update({
      accessKeyId: this.config.aws.accessKeyId,
      region: this.config.aws.region,
      secretAccessKey: this.config.aws.secretAccessKey,
    });
    AWS.config.setPromisesDependency(Promise);

    if (isNil(this.config.nlpService) && isNil(this.config.nlp)) {
      this.nlpService = new DefaultNlpService();
    } else if (this.config.nlp) {
      this.nlpService = new ExternalNlpService(this.config.nlp.url);
    } else if (this.config.nlpService) {
      this.nlpService = this.config.nlpService;
    } else {
      throw new Error('Unknown NLP error.');
    }

    if (isNil(this.config.aws.s3)) {
      throw new Error('Please config aws.s3 or fileService');
    } else if (!isNil(this.config.aws.s3)) {
      this.fileService = new S3Service(this.config.aws.s3);
    } else if (!isNil(this.config.fileService)) {
      this.fileService = this.config.fileService;
    }

    if (isNil(this.config.aws.transcoder) && isNil(this.config.transcodeService)) {
      throw new Error('Please config aws.transcoder or transcodeService');
    } else if (!isNil(this.config.aws.transcoder)) {
      this.transcodeService = new ElasticTranscoderService(this.config.aws.transcoder);
    } else if (!isNil(this.config.transcodeService)) {
      this.transcodeService = this.config.transcodeService;
    }

    this.intentRepository = this.getDefaultValue(mongoIntentRepository, this.config.intentRepository);

    this.sessionRepository = this.getDefaultValue(
      new RedisSessionRepository(this.redisClient),
      this.config.sessionRepository,
    );

    this.configRepository = this.getDefaultValue(mongoConfigRepository, this.config.configRepository);

    this.messageRepository = this.getDefaultValue(mongoMessageRepository, this.config.messageRepository);

    this.issueRepository = this.getDefaultValue(mongoIssueRepository, this.config.issueRepository);

    this.senderInfoRepository = this.getDefaultValue(mongoSenderInfoRepository, this.config.senderInfoRepository);

    if (isNil(this.config.logger)) {
      this.logger = new winston.Logger({
        level: isString(this.config.logLevel) ? this.config.logLevel : 'info',
        transports: [new winston.transports.Console()],
      });
    } else {
      this.logger = this.config.logger;
    }

    this.redisClient.on('error', (err) => {
      this.logger.error(`Unable to connect Redis ${redis.host}:${redis.port}`);
    });

    this.setupKoa();
    this.nodeServer = this.server.listen(this.config.port);
  }

  public close() {
    this.nodeServer.close();
    this.redisClient.quit();
    mongoose.connection.close();
  }

  protected getDefaultValue<T>(defaultValue: T, value?: T) {
    if (isNil(value)) {
      return defaultValue;
    }
    return value;
  }

  protected setupKoa() {
    this.setupMessenger();
    this.sortedMiddlewares = List(
      this.middlewares
        // Sort the order of middleware execution by it's key, including
        .sortBy((value, key) => key, (a, b) => (!isNil(a) && !isNil(b) ? a - b : -1))
        // TODO temporary fix bug: https://github.com/facebook/immutable-js/issues/1246
        .toArray()
        .map(value => value),
    );
    this.server.use(BodyParser());
    this.server.use(this.router.routes());
  }

  protected createDefaultMiddlewares() {
    return [
      middlewares.globalConfigMiddleware,
      middlewares.unitConfigMiddleware,
      middlewares.messengerWhiteListMiddleware,
      middlewares.responseMessageLoggingMiddleware,
      middlewares.messengerMiddleware,
      middlewares.senderInfoMiddleware,
      middlewares.fallbackResponseMiddleware,
      middlewares.fetchIssueMiddleware,
      middlewares.fileRequestMiddleware,
      middlewares.transcodeMiddleware,
      middlewares.sessionMiddleware,
      middlewares.requestMessageLoggingMiddleware,
      middlewares.fileRequestResponseMiddleware,
      middlewares.intentOptionMiddleware,
      middlewares.continuousOptionsToTextMiddleware,
      middlewares.nlpMiddleware,
      middlewares.suspendAutoReplyMiddleware,
      // The original NLP service uses a rule based system where there can be duplicate intent detected.
      // It should be handled within the NLP Service.
      // middlewares.removeDuplicateResponseMiddleware,
      middlewares.additionalResponseMessageMiddleware,
      middlewares.flattenResponsesMiddleware,
      middlewares.conversationIntentMiddleware,
      middlewares.startConversationMiddleware,
      middlewares.newIntentMiddleware,
      middlewares.commandsValidationMiddleware,
      middlewares.intentPreProcessorMiddleware,
      middlewares.memoriesFeatureMiddleware,
      middlewares.intentDefaultFeatureMiddleware,
      middlewares.intentRequiredFeatureMiddleware,
      middlewares.intentPostProcessorMiddleware,
      middlewares.intentResponseMiddleware,
      middlewares.intentExecutorMiddleware,
    ].reduce((map, middleware, i) => map.set((i + 1) * 100, middleware), Map<number, Middleware>());
  }

  protected createDefaultPreProcessor() {
    return Map<string, PreProcessor>({
      SenderNamePreProcessor: preProcessors.senderNamePreProcessor,
    });
  }

  protected createDefaultPostProcessor() {
    return Map<string, PostProcessor>({
      DatePostProcessor: postProcessors.datePostProcessor,
    });
  }

  protected createDefaultExecutor() {
    return Map<string, Executor>({
      CloseIssueExecutor: executors.closeIssueExecutor,
      CreateIssueExecutor: executors.createIssueExecutor,
    });
  }

  protected setupMessenger() {
    this.messengers.forEach((messenger: Messenger<any, any>, path: string) =>
      this.router.all(`/:uni${path}`, this.createMessengerHandler(messenger)),
    );
  }

  protected createMessengerHandler(messenger: Messenger<any, any>) {
    return async (serverContext: Koa.Context) => {
      const context = {
        attributes: Map<string, any>(),
        commands: List<BotContextCommand>(),
        configRepository: this.configRepository,
        executors: this.executors,
        fileService: this.fileService,
        intentRepository: this.intentRepository,
        issueRepository: this.issueRepository,
        logger: this.logger,
        messageRepository: this.messageRepository,
        messenger,
        nlpService: this.nlpService,
        postProcessors: this.postProcessors,
        preProcessors: this.preProcessors,
        rawRequest: serverContext.request.body,
        responses: List<BotResponse>(),
        senderInfoRepository: this.senderInfoRepository,
        serverContext,
        sessionRepository: this.sessionRepository,
        transcodeService: this.transcodeService,
        uni: serverContext.params.uni,
        uniConfigs: Map<string, any>(),
      };
      const start = this.createMiddlewareStartPoint(context, this.sortedMiddlewares);

      try {
        await start();
        if (isNil(serverContext.status)) {
          serverContext.status = 200;
        }
      } catch (err) {
        this.logger.error('Unhandled error from middlewares', err);
        serverContext.status = 200;
      }
    };
  }

  protected createMiddlewareStartPoint(
    botServiceContext: BotContext,
    services: List<Middleware>,
    index: number = 0,
  ): () => Promise<void> {
    if (index >= services.size) {
      return () => Promise.resolve();
    }
    return async () =>
      await services.get(index)(
        botServiceContext,
        this.createMiddlewareStartPoint(botServiceContext, services, index + 1),
      );
  }
}

export default BotServer;
