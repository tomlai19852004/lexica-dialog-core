import { Map, List } from 'immutable';
import * as Koa from 'koa';
import * as winston from 'winston';
import { Config } from 'lexica-dialog-model/dist/Config';
import { Intent } from 'lexica-dialog-model/dist/Intent';
import { Issue, Status } from 'lexica-dialog-model/dist/Issue';
import {
	BaseMessage,
	RequestMessage,
	RequestType,
	ResponseType,
	ItemType,
	Response,
	TextResponse,
	OptionsResponse,
	ItemsResponse,
} from 'lexica-dialog-model/dist/Message';
import { SenderInfo } from 'lexica-dialog-model/dist/SenderInfo';

enum BotErrorCode {
	INTENT_NOT_FOUND = 'INTENT_NOT_FOUND',
	MISSING_REQUIRED_FEATURE = 'MISSING_REQUIRED_FEATURE',
	INVALID_RESPONSE_TYPE = 'INVALID_RESPONSE_TYPE',
}

enum RunTimeConfig {
	// number
	SESSION_EXPIRE_IN_MS = 'SESSION_EXPIRE_IN_MS',

	// string
	FALLBACK_COMMAND_NAME = 'FALLBACK_COMMAND_NAME',

	// boolean
	SUSPEND_AUTO_REPLY = 'SUSPEND_AUTO_REPLY',

	// string[] : optional
	MESSENGER_WHITE_LIST = 'MESSENGER_WHITE_LIST',

	// string
	FILE_REQUEST_COMMAND_NAME = 'FILE_REQUEST_COMMAND_NAME',

	// string
	CONFIRM_CLOSE_ISSUE_COMMAND_NAME = 'CONFIRM_CLOSE_ISSUE_COMMAND_NAME',

	// integer
	TIME_GAP_IN_MS_TRIGGER_CONFIRM_CLOSE_ISSUE = 'TIME_GAP_IN_MS_TRIGGER_CONFIRM_CLOSE_ISSUE',

	// string
	RECREATE_ISSUE_KEY_WORD = 'RECREATE_ISSUE_KEY_WORD',

	// object
	ADDITIONAL_RESPONSE_MESSAGE = 'ADDITIONAL_RESPONSE_MESSAGE',
}

interface BotCommand {
	name: string;
	features: Map<string, string>;
}

interface BotContextCommand {
	name?: string;
	intent?: Intent;
	features: Map<string, string>;
	processedFeatures: Map<string, any>;
	botResponses: List<Response>;
	attributes: Map<string, any>;
}

class BotError extends Error {
	constructor(public code: BotErrorCode, message?: string) {
	super(message);
	}
}

interface BotRequest {
	type: RequestType;
	locale: string;
	senderId: string;
	message?: string;
	fileUrl?: string;
	fileStoredPath?: string;
	fileContentType?: string;
	commands?: List<BotCommand>;
}

interface BotOptionResponse extends OptionsResponse {
	forceShow?: boolean;
}

type BotResponse = TextResponse | BotOptionResponse | ItemsResponse;

interface ConfigRepository {
	findByUni(uni: string): Promise<Config[]>;
}

interface IntentRepository {
	findByUniCommandName(uni: string, command: string): Promise<Intent | null>;
}

interface IssueRepository {
	create(issue: Issue): Promise<Issue>;
	save(issue: Issue): Promise<Issue>;
	findByUniAndSenderIdAndStatus(uni: string, senderId: string, status: Status): Promise<Issue[]>;
}

interface SessionOption {
	command: string;
	features: { [key: string]: string };
	textOnlyIndicator: string;
	liveCount: number;
}

interface Session {
	id: string;
	memories: Array<{
	expire: number;
	features: { [key: string]: string };
	intent: Intent;
	}>;
	conversation?: {
	intent: Intent;
	features: { [key: string]: string };
	};
	lastOptions?: SessionOption[];
}

interface SessionRepository {
	findByUniAndSenderId(uni: string, senderId: string): Promise<Session>;
	save(uni: string, senderId: string, session: Session, expireInMs: number): Promise<void>;
}

interface IntentMemoryFeatures {
	command: string;
	features: {
	[key: string]: string;
	};
}

interface SessionService {
	init(): Promise<void> ;
	save(): Promise<void> ;
	getSessionId(): string;
	addMemory(intent: Intent, features: Map<string, string>): void;
	getMemoriesFeatures(): Map<string, string>;
	getIntentMemoryFeatures(): List<IntentMemoryFeatures>;
	startConversation(intent: Intent, features: Map<string, string>): void ;
	hasConversation(): boolean;
	getConversationIntent(): Intent;
	getConversationFeatures(): Map<string, string> ;
	updateConversationFeatures(features: Map<string, string>): void ;
	endConversation(): void ;
	setOptions(options: SessionOption[]): void ;
	hasOptions(): boolean;
	getOptions(): SessionOption[];
	removeOptions(): void;
}

interface MessageRepository {
	create(message: BaseMessage): Promise<BaseMessage>;
	save(message: BaseMessage): Promise<BaseMessage>;
	findByUniAndSenderIdAndIssueId(
	uni: string, senderId: string, issueId: string): Promise<BaseMessage[]>;
	countAll(): Promise<number>;
}

interface Messenger<I, O> {
	readonly name: string;
	request(rawRequest: I): BotRequest;
	response(responses: List<BotResponse>, senderId: string, rawRequest?: I): List<O>;
	send(responses: List<O>, configs: Map<string, Config>): Promise<void>;
}

interface NlpService {
	analyse(
	message: string,
	uni: string,
	intentMemoriesFeatures?: List<IntentMemoryFeatures>,
	): Promise<List<BotCommand>>;
}

interface SenderInfoRepository {
	create(senderInfo: SenderInfo): Promise<SenderInfo>;
	findOneByUniAndMessengerAndSenderId(
	uni: string,
	messenger: string,
	senderId: string,
	): Promise<SenderInfo | null>;
}

interface BaseCommandContext {
	uni: string;
	senderId: string;
	locale: string;
	uniConfigs: Map<string, Config>;
	messengerName: string;

	issue?: Issue;
	senderInfo?: SenderInfo;
}

interface ProcessorContext extends BaseCommandContext {
	unusedProperty?: string;
}

interface ExecutorContext extends BaseCommandContext {
	command: BotContextCommand;
	messenger: Messenger<any, any>;
	sessionService: SessionService;

	intentRepository: IntentRepository;
	sessionRepository: SessionRepository;
	configRepository: ConfigRepository;
	messageRepository: MessageRepository;
	issueRepository: IssueRepository;
	senderInfoRepository: SenderInfoRepository;

	requestMessage?: RequestMessage;
}

type PreProcessor = (context: ProcessorContext, features: Map<string, string>) => Promise<Map<string, string>>;

type PostProcessor = (context: ProcessorContext, features: Map<string, any>) => Promise<Map<string, any>>;

type Executor = (context: ExecutorContext) => Promise<void>;

interface File {
	path: string;
	contentType: string;
}

interface FileService {
	copy(path: string): Promise<File>;
}

interface TranscodeService {
	transcodeAudio(file: File): Promise<File>;
	transcodeVideo(file: File): Promise<File>;
}

interface AwsTranscoderTypeConfig {
	pipelineId: string;
	preset: {
	id: string;
	suffix: string;
	contentType: string;
	};
}

interface AwsTranscoderConfig {
	apiVersion: string;
	delay: number;
	maxAttempts: number;
	audio: AwsTranscoderTypeConfig;
	video: AwsTranscoderTypeConfig;
}

interface BotServerConfig {
	port: number;
	mongo: {
	url: string;
	options?: any;
	};
	redis: {
	url: string;
	options?: any;
	};
	aws: {
	accessKeyId: string;
	secretAccessKey: string;
	region: string;
	s3?: {
		apiVersion: string;
		bucket: string;
	};
	transcoder?: AwsTranscoderConfig;
	};
	nlp?: {
	url: string,
	};
	nlpService?: NlpService;
	fileService?: FileService;
	transcodeService?: TranscodeService;
	intentRepository?: IntentRepository;
	sessionRepository?: SessionRepository;
	configRepository?: ConfigRepository;
	messageRepository?: MessageRepository;
	issueRepository?: IssueRepository;
	senderInfoRepository?: SenderInfoRepository;
	logger?: winston.LoggerInstance;
	logLevel?: string;
	// path
	messengers: Map<string, Messenger<any, any>>;
	// name
	preProcessors: Map<string, PreProcessor>;
	postProcessors: Map<string, PostProcessor>;
	executors: Map<string, Executor>;
	middlewares: Map<number, Middleware>;
}

interface BotContext {
	serverContext: Koa.Context;
	rawRequest: any;
	uni: string;
	messenger: Messenger<any, any>;
	logger: winston.LoggerInstance;
	intentRepository: IntentRepository;
	sessionRepository: SessionRepository;
	configRepository: ConfigRepository;
	messageRepository: MessageRepository;
	issueRepository: IssueRepository;
	senderInfoRepository: SenderInfoRepository;
	nlpService: NlpService;
	fileService: FileService;
	transcodeService: TranscodeService;
	preProcessors: Map<string, PreProcessor>;
	postProcessors: Map<string, PostProcessor>;
	executors: Map<string, Executor>;
	responses: List<BotResponse>;
	commands: List<BotContextCommand>;
	uniConfigs: Map<string, Config>;
	attributes: Map<string, any>;

	request?: BotRequest;
	rawResponses?: List<any>;
	sessionService?: SessionService;
	requestMessage?: RequestMessage;
	issue?: Issue;
	senderInfo?: SenderInfo;
}

type Middleware = (context: BotContext, next: () => Promise<void>) => Promise<void>;

export {
	RequestType,
	ResponseType,
	ItemType,
	BotErrorCode,
	RunTimeConfig,
	BotCommand,
	BotContextCommand,
	BotError,
	BotRequest,
	BotOptionResponse,
	BotResponse,
	ConfigRepository,
	IntentRepository,
	IssueRepository,
	SessionOption,
	Session,
	SessionRepository,
	IntentMemoryFeatures,
	SessionService,
	MessageRepository,
	Messenger,
	NlpService,
	SenderInfoRepository,
	BaseCommandContext,
	ProcessorContext,
	ExecutorContext,
	PreProcessor,
	PostProcessor,
	Executor,
	File,
	FileService,
	TranscodeService,
	AwsTranscoderTypeConfig,
	AwsTranscoderConfig,
	BotContext,
	Middleware,
	BotServerConfig,
};
