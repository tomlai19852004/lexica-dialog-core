require('dotenv').config();

import { Map } from 'immutable';
import * as request from 'request-promise-native';
import {
	intentRepository,
	configRepository,
	issueRepository,
	messageRepository,
	senderInfoRepository,
} from 'lexica-dialog-repository';
import * as mongoose from 'mongoose';
import { createClient } from 'redis';
import { createBotServer } from '../src';
import { RequestType, BotServerConfig, BotCommand, BotRequest, Middleware } from '../src/Api';
import { Intent, ResponseType } from 'lexica-dialog-model/dist/Intent';
import { Status } from 'lexica-dialog-model/dist/Issue';
import { KeyValueNlpService } from './NlpService';
import { KeyValueIntentRepository } from './IntentRepository';
import { InMemorySessionRepository } from './SessionRepository';
import { currentDatePreprocessor, throwErrorPreprocessor } from './PreProcessors';
import { toDatePostProcessor } from './PostProcessors';
import { searchBookExecutor } from './Executors';
import { EchoMessenger } from './Messenger';
import { uni, configs, messages, nlpCommands, intents, issues, senderInfo, logs } from './TestData';
import { messengerMiddleware } from '../src/middlewares';

const staticNlpService = new KeyValueNlpService(nlpCommands);
const echoMessenger = new EchoMessenger();
const messengerPath = '/echo';
const messengerServerResponseMiddleware: Middleware = async (context, next) => {
	await next();
	if (context.rawResponses.size === 0) {
		context.serverContext.body = undefined;
	} else if (context.rawResponses.size > 1) {
		context.serverContext.body = context.rawResponses.toArray();
	} else {
		context.serverContext.body = context.rawResponses.first();
	}
};

const config: BotServerConfig = {
	aws: {
		accessKeyId: process.env.TESTING_AWS_ACCESS_KEY_ID as string,
		region: process.env.TESTING_AWS_REGION as string,
		s3: {
			apiVersion: process.env.TESTING_AWS_CHATBOT_S3_API_VERSION as string,
			bucket: process.env.TESTING_AWS_CHATBOT_S3_BUCKET as string,
		},
		secretAccessKey: process.env.TESTING_AWS_SECRET_ACCESS_KEY as string,
		transcoder: {
			apiVersion: process.env.TESTING_AWS_CHATBOT_TRANSCODER_API_VERSION as string,
			audio: {
				pipelineId: process.env.TESTING_AWS_CHATBOT_TRANSCODER_AUDIO_PIPELINE_ID as string,
				preset: {
					contentType: process.env.TESTING_AWS_CHATBOT_TRANSCODER_AUDIO_CONTENT_TYPE as string,
					id: process.env.TESTING_AWS_CHATBOT_TRANSCODER_AUDIO_PRESET_ID as string,
					suffix: process.env.TESTING_AWS_CHATBOT_TRANSCODER_AUDIO_SUFFIX as string,
				},
			},
			delay: parseInt(process.env.TESTING_AWS_CHATBOT_TRANSCODER_DELAY as string, 10),
			maxAttempts: parseInt(process.env.TESTING_AWS_CHATBOT_TRANSCODER_MAX_ATTEMPTS as string, 10),
			video: {
				pipelineId: process.env.TESTING_AWS_CHATBOT_TRANSCODER_VIDEO_PIPELINE_ID as string,
				preset: {
					contentType: process.env.TESTING_AWS_CHATBOT_TRANSCODER_VIDEO_CONTENT_TYPE as string,
					id: process.env.TESTING_AWS_CHATBOT_TRANSCODER_VIDEO_PRESET_ID as string,
					suffix: process.env.TESTING_AWS_CHATBOT_TRANSCODER_VIDEO_SUFFIX as string,  
				},
			},
		},
	},
	executors: Map({
		searchBookExecutor,
	}),
	messengers: Map({
		[messengerPath]: echoMessenger,
	}),
	middlewares: Map<number, Middleware>({
		450: messengerServerResponseMiddleware,
	}),
	mongo: {
		url: 'mongodb://localhost:27017/test',
	},
	nlpService: staticNlpService,
	port: 9999,
	postProcessors: Map({
		toDatePostProcessor,
	}),
	preProcessors: Map({
		currentDatePreprocessor,
		throwErrorPreprocessor,
	}),
	redis: {
		host: 'localhost',
		port: 6379,
		url: 'redis://localhost',
	},
};
const botServer = createBotServer(config);

beforeAll(async () => {
	botServer.init();
	botServer.redisClient.flushall();
	await botServer.mongoConnection.dropDatabase();
	await Promise.all(configs.toArray().map(config => configRepository.create(config)));
	await Promise.all(intents.toArray().map(intent => intentRepository.create(intent)));
	await Promise.all(issues.toArray().map(issue => issueRepository.create(issue)));
	await Promise.all(senderInfo.toArray().map(si => senderInfoRepository.create(si)));
	await Promise.all(logs.toArray().map(log => messageRepository.create(log)));
});
afterAll(() => botServer.close());

interface TestOptions {
	body: BotRequest;
	expectedResponse?: string;
}

async function call(options: TestOptions, cuni: string = uni) {
	return request({
		body: options.body,
		json: true,
		method: 'POST',
		uri: `http://localhost:${config.port}/${cuni}${messengerPath}`,
	});
}

async function run(options: TestOptions, cuni: string = uni) {
	const response = await call(options, cuni);
	expect(response).toBeDefined();
	expect(response.message).toEqual(options.expectedResponse);
}

describe('Single Intent', () => {

	it('should say hello by English', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('GREETING'),
				senderId: '123456',
				type: RequestType.TEXT,
			},
			expectedResponse: 'Hello World. I am Lexica.',
		});
	});

	it('should say hello by Chinese', async () => {
		await run({
			body: {
				locale: 'zh-TW',
				message: messages.get('GREETING'),
				senderId: '123456',
				type: RequestType.TEXT,
			},
			expectedResponse: '你好 World，我是 Lexica。',
		});
	});

	it('should say my name that I told bot in previous message', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('WHO_AM_I'),
				senderId: '123456',
				type: RequestType.TEXT,
			},
			expectedResponse: 'You are World.',
		});
	});

	it('should show opening hour', async () => {
		const now = new Date();
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('ENQUIRY_OPENING_TIME'),
				senderId: '123456',
				type: RequestType.TEXT,
			},
			expectedResponse:
				`${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear().toString().substring(2)}`
				+ ' opening hour is 9:00 a.m.',
		});
	});

	it('should show opening hour (date converted by default post processor)', async () => {
		const now = new Date();
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('ENQUIRY_OPENING_TIME_2'),
				senderId: '123456',
				type: RequestType.TEXT,
			},
			expectedResponse:
				`${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear().toString().substring(2)}`
				+ ' opening hour is 9:00 a.m.',
		});
	});

	it('should split huge message into different small messages', async () => {
		const response = await call({
			body: {
				locale: 'en-GB',
				message: messages.get('HUGE_RESPONSE'),
				senderId: '123456',
				type: RequestType.TEXT,
			},
			expectedResponse: '',
		});
		expect(response).toHaveLength(5);
	});

	it('should return my name based on sender info', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('MY_INFO'),
				senderId: '010101',
				type: RequestType.TEXT,
			},
			expectedResponse: 'Your name is Hello World',
		});
	});

	// it('should remove duplicate message', async () => {
	// 	await run({
	// 		body: {
	// 			locale: 'en-GB',
	// 			message: messages.get('DUPLICATE_MESSAGE'),
	// 			senderId: '879879',
	// 			type: RequestType.TEXT,
	// 		},
	// 		expectedResponse: 'Duplicate',
	// 	});
	// });

});

describe('Conversation of booking a room', () => {

	it('should book a room and ask me a date', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('BOOK_ROOM'),
				senderId: '654321',
				type: RequestType.TEXT,
			},
			expectedResponse: 'Which date?',
		});
	});

	it('should book a room and ask me how long does it take', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('BOOK_ROOM_DATE'),
				senderId: '654321',
				type: RequestType.TEXT,
			},
			expectedResponse: 'How long does it take?',
		});
	});

	it('should booked a room', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('BOOK_ROOM_HOURS'),
				senderId: '654321',
				type: RequestType.TEXT,
			},
			expectedResponse: 'OK. The room A123 has been booked for 2 hours',
		});
	});

});


describe('Do questionnaire', () => {

	it('should start a questionnaire', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('DO_QUESTIONNAIRE'),
				senderId: '111111',
				type: RequestType.TEXT,
			},
			expectedResponse: 'QUESTIONNAIRE\nA. Science',
		});
	});

	it('should respond A option', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('QUESTIONNAIRE_ANSWER_A'),
				senderId: '111111',
				type: RequestType.TEXT,
			},
			expectedResponse: 'You select Science.',
		});
	});

});

describe('Prevent Continuous Options Intent', () => {

	it('should return a options intent', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('OPTION_1'),
				senderId: '222222',
				type: RequestType.TEXT,
			},
			expectedResponse: 'Option 1\nA. Yo\nB. Yeah',
		});
	});

	it('should return a text intent when last intent is options', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('OPTION_1_ANSWER_A'),
				senderId: '222222',
				type: RequestType.TEXT,
			},
			expectedResponse: 'Option 2',
		});
	});

});

describe('Prevent Continuous Options Intent with forceShow Property', () => {

	it('should return a options intent', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('OPTION_1'),
				senderId: '333333',
				type: RequestType.TEXT,
			},
			expectedResponse: 'Option 1\nA. Yo\nB. Yeah',
		});
	});

	it('should return a options intent when forceShow options', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('OPTION_1_ANSWER_B'),
				senderId: '333333',
				type: RequestType.TEXT,
			},
			expectedResponse: 'Option 3\nA. Yeah Again',
		});
	});

});

describe('Fallback message', () => {

	it('should find fallback command', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('WHAT'),
				senderId: '000000',
				type: RequestType.TEXT,
			},
			expectedResponse: 'This is a fallback message.',
		});
	});

	it('should respond the fallback message if fallback command not found', async () => {
		await run(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('WHAT'),
					senderId: '101010',
					type: RequestType.TEXT,
				},
				expectedResponse: 'Sorry, I don\'t know',
			},
			'CITY',
		);
	});

	it('should intent specific fallback message', async () => {
		await run(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('CALL_EXTERNAL_SERVICE'),
					senderId: '213564',
					type: RequestType.TEXT,
				},
				expectedResponse: 'External service is temporarily unavailable',
			},
		);
	});

});


describe('White list messenger', () => {

	it('should return 404 not found', async () => {
		expect.assertions(1);
		try {
			const response = await call(
				{
					body: {
						locale: 'en-GB',
						message: messages.get('WHAT'),
						senderId: '101010',
						type: RequestType.TEXT,
					},
					expectedResponse: 'Sorry, I don\'t know',
				},
				'POLY',
			);

		} catch (e) {
			expect(e.response.statusCode).toEqual(404);
		}
	});

});

describe('Intent executor', () => {

	it('should return 2 books', async () => {
		const response = await call({
			body: {
				locale: 'en-GB',
				message: messages.get('SEARCH_BOOKS'),
				senderId: '963852',
				type: RequestType.TEXT,
			},
		});
		expect(response.type).toEqual('ITEMS');
		expect(response.message).toEqual('Books');
		expect(response.items).toHaveLength(2);
		response.items.forEach((item, index) => {
			const name = `book${index + 1}`;
			expect(item.type).toBe('IMAGE');
			expect(item.message).toBe(name);
			expect(item.url).toBe(`http://lexica.io/${name}`);
		});
	});

	it('should create new issue', async () => {
		await run({
			body: {
				locale: 'en-GB',
				message: messages.get('FIND_LIBRARIAN'),
				senderId: '258798',
				type: RequestType.TEXT,
			},
			expectedResponse: 'OK. The current message already redirected to librarian',
		});
		await new Promise(resolve => setTimeout(resolve, 1000));
		const issues = await issueRepository.findByUniAndSenderId(uni, '258798');
		expect(issues).toHaveLength(1);
		const logs =
			await messageRepository.findByUniAndSenderIdAndIssueId(uni, '258798', issues[0].id);
		expect(logs).toHaveLength(2);
	});

});


describe('Suspend auto reply', () => {

	it('should no reply when has issue status is OPEN and librarian not responded', async () => {
		const oldIssues = await issueRepository.findByUniAndSenderId('YYY', '999999');
		await run(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('WHAT'),
					senderId: '999999',
					type: RequestType.TEXT,
				},
				expectedResponse: 'What?',
			},
			'YYY',
		);
		await new Promise(resolve => setTimeout(resolve, 1000));
		const logs = await messageRepository.findByUniAndSenderId('YYY', '999999');
		const issues = await issueRepository.findByUniAndSenderId('YYY', '999999');
		expect(oldIssues).toHaveLength(1);
		expect(logs).toHaveLength(2);
		logs.forEach(log => expect(log.issueId).toBeDefined());
		expect(oldIssues[0].lastUpdatedDate.getTime())
			.toBeLessThan(issues[0].lastUpdatedDate.getTime());
	});

	it('should no reply when has issue status is OPEN and librarian responded', async () => {
		const oldIssues = await issueRepository.findByUniAndSenderId('YYY', '888888');
		const response = await call(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('WHAT'),
					senderId: '888888',
					type: RequestType.TEXT,
				},
				expectedResponse: '',
			},
			'YYY',
		);
		await new Promise(resolve => setTimeout(resolve, 1000));
		const logs = await messageRepository.findByUniAndSenderId('YYY', '888888');
		const issues = await issueRepository.findByUniAndSenderId('YYY', '888888');
		expect(oldIssues).toHaveLength(1);
		expect(response).toBeUndefined();
		expect(logs).toHaveLength(3);
		logs.forEach(log => expect(log.issueId).toBeDefined());
		expect(oldIssues[0].lastUpdatedDate.getTime())
			.toBeLessThan(issues[0].lastUpdatedDate.getTime());
	});

	it(
		'should no reply when has issue status is OPEN and librarian responded but over time gap -> '
		+ 'close current issue',
		async () => {
			const oldIssues = await issueRepository.findByUniAndSenderId('YYY', '777777');
			await run(
				{
					body: {
						locale: 'en-GB',
						message: messages.get('WHAT'),
						senderId: '777777',
						type: RequestType.TEXT,
					},
					expectedResponse:
						'Confirm to close issue?' +
						'\nA. Yes. Close Issue' +
						'\nB. No. Re-Create new Issue',
				},
				'YYY',
			);

			await run(
				{
					body: {
						locale: 'en-GB',
						message: 'A',
						senderId: '777777',
						type: RequestType.TEXT,
					},
					expectedResponse: 'OK. Issue has been closed.',
				},
				'YYY',
			);

			await run(
				{
					body: {
						locale: 'en-GB',
						message: messages.get('WHAT'),
						senderId: '777777',
						type: RequestType.TEXT,
					},
					expectedResponse: 'What?',
				},
				'YYY',
			);
			await new Promise(resolve => setTimeout(resolve, 1000));
			const logs = await messageRepository.findByUniAndSenderId('YYY', '777777');
			const issues = await issueRepository.findByUniAndSenderId('YYY', '777777');
			expect(oldIssues).toHaveLength(1);
			expect(logs).toHaveLength(8);
			expect(issues).toHaveLength(1);
			expect(issues[0].status).toBe(Status.CLOSED);
		},
	);

	it(
		'should no reply when has issue status is OPEN and librarian responded but over time gap -> '
		+ 'create new issue',
		async () => {
			const oldIssues = await issueRepository.findByUniAndSenderId('YYY', '666666');
			await run(
				{
					body: {
						locale: 'en-GB',
						message: messages.get('WHAT'),
						senderId: '666666',
						type: RequestType.TEXT,
					},
					expectedResponse:
						'Confirm to close issue?' +
						'\nA. Yes. Close Issue' +
						'\nB. No. Re-Create new Issue',
				},
				'YYY',
			);

			await run(
				{
					body: {
						locale: 'en-GB',
						message: 'B',
						senderId: '666666',
						type: RequestType.TEXT,
					},
					expectedResponse: 'OK. Issue has been redirect to librarian.',
				},
				'YYY',
			);

			await run(
				{
					body: {
						locale: 'en-GB',
						message: messages.get('WHAT'),
						senderId: '666666',
						type: RequestType.TEXT,
					},
					expectedResponse: 'What?',
				},
				'YYY',
			);
			await new Promise(resolve => setTimeout(resolve, 1000));
			const logs = await messageRepository.findByUniAndSenderId('YYY', '666666');
			const issues = await issueRepository.findByUniAndSenderId('YYY', '666666');
			expect(oldIssues).toHaveLength(1);
			expect(logs).toHaveLength(8);
			logs.forEach(log => expect(log.issueId).toBeDefined());
			expect(issues).toHaveLength(2);
			expect(issues[0].status).toBe(Status.CLOSED);
			expect(issues[1].status).toBe(Status.OPEN);
		},
	);

	it(
		'should no reply when has issue status is OPEN and librarian responded with special keyword -> '
		+ 'create new issue',
		async () => {
			const oldIssues = await issueRepository.findByUniAndSenderId('YYY', '555555');

			await run(
				{
					body: {
						locale: 'en-GB',
						message: messages.get('HI_LEXICA'),
						senderId: '555555',
						type: RequestType.TEXT,
					},
					expectedResponse: 'What can I help you?',
				},
				'YYY',
			);

			await run(
				{
					body: {
						locale: 'en-GB',
						message: messages.get('GREETING_Y'),
						senderId: '555555',
						type: RequestType.TEXT,
					},
					expectedResponse: 'Hello Tom. I am Lexica.',
				},
				'YYY',
			);
			await new Promise(resolve => setTimeout(resolve, 1000));
			const logs = await messageRepository.findByUniAndSenderId('YYY', '555555');
			const issues = await issueRepository.findByUniAndSenderId('YYY', '555555');
			expect(oldIssues).toHaveLength(1);
			expect(logs).toHaveLength(6);
			logs.forEach(log => expect(log.issueId).toBeDefined());
			expect(issues).toHaveLength(2);
			expect(issues[0].status).toBe(Status.CLOSED);
			expect(issues[1].status).toBe(Status.OPEN);
		},
	);

	it('should no reply when SUSPEND_AUTO_REPLY config is true', async () => {
		const response = await call(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('WHAT'),
					senderId: '123456',
					type: RequestType.TEXT,
				},
				expectedResponse: '',
			},
			'ZZZ',
		);
		await new Promise(resolve => setTimeout(resolve, 1000));
		expect(response).toBeUndefined();
		const logs = await messageRepository.findByUniAndSenderId('ZZZ', '123456');
		expect(response).toBeUndefined();
		expect(logs).toHaveLength(1);
		logs.forEach(log => expect(log.issueId).toBeDefined());
	});

});

describe('Additional Message', () => {

	it('should return additional message when match REGEXP', async () => {
		const response = await call(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('ADDITIONAL_RESPONSE_MESSAGE_REGEXP_TRIGGER'),
					senderId: '999999',
					type: RequestType.TEXT,
				},
				expectedResponse: '',
			},
			'XXX',
		);
		expect(response).toBeDefined();
		expect(response).toHaveLength(2);
		expect(response[0].message).toBe('response');
		expect(response[1].message).toBe('additional');
	});

	it('should return additional message when total message over configurated variable', async () => {
		await call(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('GREETING'),
					senderId: '654321',
					type: RequestType.TEXT,
				},
				expectedResponse: '',
			},
			'XXX',
		);
		await call(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('GREETING'),
					senderId: '654321',
					type: RequestType.TEXT,
				},
				expectedResponse: '',
			},
			'XXX',
		);
		await call(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('GREETING'),
					senderId: '654321',
					type: RequestType.TEXT,
				},
				expectedResponse: '',
			},
			'XXX',
		);
		const response = await call(
			{
				body: {
					locale: 'en-GB',
					message: messages.get('GREETING'),
					senderId: '654321',
					type: RequestType.TEXT,
				},
				expectedResponse: '',
			},
			'XXX',
		);
		expect(response).toBeDefined();
		expect(response).toHaveLength(2);
		expect(response[0].message).toBe('Hello World. I am Lexica.');
		expect(response[1].message).toBe('additional');
	});

});

describe('File Request', () => {

	it('should copy image and stored into s3 (https)', async () => {
		await run({
			body: {
				locale: 'en-GB',
				// tslint:disable-next-line
				fileUrl: 'https://scontent-hkg3-2.xx.fbcdn.net/v/t34.0-12/22554668_10155080158976588_467198426_n.png?oh=fc869dc47f792ab8d951fb10f541f111&oe=59E8AA93',
				senderId: '123456',
				type: RequestType.IMAGE,
			},
			expectedResponse: 'Please enter text.',
		});
	});

	it('should copy image and stored into s3 (http)', async () => {
		await run({
			body: {
				locale: 'en-GB',
				// tslint:disable-next-line
				fileUrl: 'http://www.duluthnewstribune.com/sites/all/themes/fcc_basetheme/images/image-info.png',
				senderId: '123456',
				type: RequestType.IMAGE,
			},
			expectedResponse: 'Please enter text.',
		});
	}, 10000);

	it(
		'should transcode audio format',
		async () => {
			await run({
				body: {
					// tslint:disable-next-line
					// fileUrl: 'https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4',
					fileUrl: "https://tomlai.s3-ap-southeast-1.amazonaws.com/demo.m4a",
					locale: 'en-GB',
					senderId: '123456',
					type: RequestType.AUDIO,
				},
				expectedResponse: 'Please enter text.',
			});
		},
		120000,
	);

	it(
		'should transcode video format',
		async () => {
			await run({
				body: {
					// tslint:disable-next-line
					// fileUrl: 'https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.webm',
					fileUrl: "https://tomlai.s3-ap-southeast-1.amazonaws.com/demo.mov",
					locale: 'en-GB',
					senderId: '123456',
					type: RequestType.VIDEO,
				},
				expectedResponse: 'Please enter text.',
			});
		},
		120000,
	);

});
