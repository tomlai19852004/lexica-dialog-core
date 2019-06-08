import { Map, List } from 'immutable';
import * as moment from 'moment';
import { Intent } from 'lexica-dialog-model/dist/Intent';
import { Issue } from 'lexica-dialog-model/dist/Issue';
import { SenderInfo } from 'lexica-dialog-model/dist/SenderInfo';
import { Message, MessageType, RequestType } from 'lexica-dialog-model/dist/Message';
import { RunTimeConfig } from '../src/Api';

const uni = 'HKU';

const configs = List([{
	uni: 'GLOBAL',
	key: RunTimeConfig.SESSION_EXPIRE_IN_MS,
	value: 1000 * 60 * 15,
}, {
	uni: 'GLOBAL',
	key: RunTimeConfig.FALLBACK_COMMAND_NAME,
	value: 'C_FALLBACK_MESSAGE',
}, {
	uni: 'GLOBAL',
	key: RunTimeConfig.SUSPEND_AUTO_REPLY,
	value: false,
}, {
	uni: 'GLOBAL',
	key: RunTimeConfig.FILE_REQUEST_COMMAND_NAME,
	value: 'C_FILE_REQUEST_COMMAND_NAME',
}, {
	uni: 'POLY',
	key: RunTimeConfig.MESSENGER_WHITE_LIST,
	value: ['facebook'],
}, {
	uni: 'ZZZ',
	key: RunTimeConfig.SUSPEND_AUTO_REPLY,
	value: true,
}, {
	uni: 'GLOBAL',
	key: RunTimeConfig.CONFIRM_CLOSE_ISSUE_COMMAND_NAME,
	value: 'C_CONFIRM_CLOSE_ISSUE',
}, {
	uni: 'GLOBAL',
	key: RunTimeConfig.TIME_GAP_IN_MS_TRIGGER_CONFIRM_CLOSE_ISSUE,
	value: 1000 * 60 * 15,
}, {
	uni: 'GLOBAL',
	key: RunTimeConfig.RECREATE_ISSUE_KEY_WORD,
	value: 'Hi Lexica',
}, {
	uni: 'XXX',
	key: RunTimeConfig.ADDITIONAL_RESPONSE_MESSAGE,
	value: {
		COMMAND: 'C_ADDITIONAL_RESPONSE_MESSAGE',
		TRIGGER_REGEXP: 'thank you',
		TRIGGER_USER_TOTAL_MESSAGES: 5,
		TRIGGER_USER_TOTAL_MESSAGES_PERCENTAGE: 100,
	},
}]);

const messages = Map({
	GREETING: 'Hello World. I am Lexica.',
	ENQUIRY_OPENING_TIME: 'What is the library opening time?',
	ENQUIRY_OPENING_TIME_2: 'What is the library opening time2?',
	WHO_AM_I: 'Who am I?',
	BOOK_ROOM: 'Book A123 room',
	BOOK_ROOM_DATE: '13-Aug-2017',
	BOOK_ROOM_HOURS: '2 hours',
	DO_QUESTIONNAIRE: 'Do Questionnaire',
	QUESTIONNAIRE_ANSWER_A: 'A',
	WHAT: 'What?',
	SEARCH_BOOKS: 'Search books',
	HUGE_RESPONSE: 'Give me huge response',
	FIND_LIBRARIAN: 'I want to find librarian',
	MY_INFO: 'My info',
	DUPLICATE_MESSAGE: 'Duplicate',
	HI_LEXICA: 'Hi Lexica',
	GREETING_Y: 'Hello, I am Tom.',
	OPTION_1: 'Option Intent',
	OPTION_1_ANSWER_A: 'A',
	OPTION_1_ANSWER_B: 'B',
	CALL_EXTERNAL_SERVICE: 'Call external service',
	ADDITIONAL_RESPONSE_MESSAGE_REGEXP_TRIGGER: 'thank you',
});

const nlpCommands = Map({
	[messages.get('GREETING')]: [{
		name: 'C_GREETING',
		features: Map({
			F_NAME: 'World',
		}),
	}],
	[messages.get('ENQUIRY_OPENING_TIME')]: [{
		name: 'C_ENQUIRY_OPENING_TIME',
		features: Map<string, string>(),
	}],
	[messages.get('ENQUIRY_OPENING_TIME_2')]: [{
		name: 'C_ENQUIRY_OPENING_TIME_2',
		features: Map<string, string>(),
	}],
	[messages.get('WHO_AM_I')]: [{
		name: 'C_WHO_AM_I',
		features: Map<string, string>(),
	}],
	[messages.get('BOOK_ROOM')]: [{
		name: 'C_BOOK_ROOM',
		features: Map<string, string>({
			F_ROOM: 'A123',
		}),
	}],
	[messages.get('BOOK_ROOM_DATE')]: [{
		name: '',
		features: Map<string, string>({
			F_DATE: messages.get('BOOK_ROOM_DATE'),
		}),
	}],
	[messages.get('BOOK_ROOM_HOURS')]: [{
		name: '',
		features: Map<string, string>({
			F_HOUR: '2',
		}),
	}],
	[messages.get('DO_QUESTIONNAIRE')]: [{
		name: 'C_DO_QUESTIONNAIRE',
		features: Map<string, string>(),
	}],
	[messages.get('QUESTIONNAIRE_ANSWER_A')]: [{
		name: 'C_QUESTIONNAIRE_ANSWER_A',
		features: Map<string, string>(),
	}],
	[messages.get('WHAT')]: [{
		name: 'C_WHAT',
		features: Map<string, string>(),
	}],
	[messages.get('SEARCH_BOOKS')]: [{
		name: 'C_SEARCH_BOOK',
		features: Map<string, string>(),
	}],
	[messages.get('HUGE_RESPONSE')]: [{
		name: 'C_HUGE_RESPONSE',
		features: Map<string, string>(),
	}],
	[messages.get('FIND_LIBRARIAN')]: [{
		name: 'C_FIND_LIBRARIAN',
		features: Map<string, string>(),
	}],
	[messages.get('MY_INFO')]: [{
		name: 'C_MY_INFO',
		features: Map<string, string>(),
	}],
	[messages.get('DUPLICATE_MESSAGE')]: [{
		name: 'C_DUPLICATE_MESSAGE',
		features: Map<string, string>(),
	}, {
		name: 'C_DUPLICATE_MESSAGE',
		features: Map<string, string>(),
	}],
	[messages.get('HI_LEXICA')]: [{
		name: 'C_HI_LEXICA',
		features: Map<string, string>(),
	}],
	[messages.get('GREETING_Y')]: [{
		name: 'C_GREETING_Y',
		features: Map({
			F_NAME: 'Tom',
		}),
	}],
	[messages.get('OPTION_1')]: [{
		name: 'C_OPTION_1',
		features: Map<string, string>(),
	}],
	[messages.get('CALL_EXTERNAL_SERVICE')]: [{
		name: 'C_CALL_EXTERNAL_SERVICE',
		features: Map<string, string>(),
	}],
	[messages.get('ADDITIONAL_RESPONSE_MESSAGE_REGEXP_TRIGGER')]: [{
		name: 'C_ADDITIONAL_RESPONSE_MESSAGE_REGEXP_TRIGGER',
		features: Map<string, string>(),
	}],
});

const intents = Map<string, Intent>({
	C_GREETING: {
		uni,
		command: 'C_GREETING',
		requiredFeatureKeys: ['F_NAME'],
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'Hello {F_NAME}. I am Lexica.',
					'zh-TW': '你好 {F_NAME}，我是 Lexica。',
				}],
			},
		],
		sessionExpire: 5,
		category: 'HIDDEN',
	},
	C_ENQUIRY_OPENING_TIME: {
		uni,
		command: 'C_ENQUIRY_OPENING_TIME',
		requiredFeatureKeys: ['F_DATE', 'F_OPENING_HOUR'],
		defaultFeatures: {
			F_OPENING_HOUR: '9:00 a.m.',
		},
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': '{F_DATE, date, short} opening hour is {F_OPENING_HOUR}',
				}],
			},
		],
		preProcessors: ['currentDatePreprocessor'],
		postProcessors: ['toDatePostProcessor'],
		category: 'HIDDEN',
	},
	C_ENQUIRY_OPENING_TIME_2: {
		uni,
		command: 'C_ENQUIRY_OPENING_TIME_2',
		requiredFeatureKeys: ['F_DATE', 'F_OPENING_HOUR'],
		defaultFeatures: {
			F_OPENING_HOUR: '9:00 a.m.',
		},
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': '{F_DATE, date, short} opening hour is {F_OPENING_HOUR}',
				}],
			},
		],
		preProcessors: ['currentDatePreprocessor'],
		postProcessors: ['DatePostProcessor'],
		category: 'HIDDEN',
	},
	C_WHO_AM_I: {
		uni,
		command: 'C_WHO_AM_I',
		requiredFeatureKeys: ['F_NAME'],
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'You are {F_NAME}.',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_BOOK_ROOM: {
		uni,
		command: 'C_BOOK_ROOM',
		requiredFeatureKeys: ['F_ROOM', 'F_DATE', 'F_HOUR'],
		missingFeatures: {
			F_DATE: {
				response: {
					type: 'TEXT',
					messages: [{
						'en-GB': 'Which date?',
					}],
				},
				priority: 1,
			},
			F_HOUR: {
				response: {
					type: 'TEXT',
					messages: [{
						'en-GB': 'How long does it take?',
					}],
				},
				priority: 2,
			},
		},
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'OK. The room {F_ROOM} has been booked for {F_HOUR} '
					+ '{F_HOUR, plural, one {hour} other {hours} }',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_DO_QUESTIONNAIRE: {
		uni,
		command: 'C_DO_QUESTIONNAIRE',
		responses: [
			{
				type: 'OPTIONS',
				messages: [{
					'en-GB': 'QUESTIONNAIRE',
				}],
				options: [{
					command: 'C_QUESTIONNAIRE_ANSWER_A',
					messages: [{
						'en-GB': 'A. Science',
					}],
					features: {
						F_ANSWER: 'Science',
					},
					textOnlyIndicator: 'A',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_QUESTIONNAIRE_ANSWER_A: {
		uni,
		command: 'C_QUESTIONNAIRE_ANSWER_A',
		requiredFeatureKeys: ['F_ANSWER'],
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'You select {F_ANSWER}.',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_FALLBACK_MESSAGE: {
		uni,
		command: 'C_FALLBACK_MESSAGE',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'This is a fallback message.',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_FILE_REQUEST_COMMAND_NAME: {
		uni,
		command: 'C_FILE_REQUEST_COMMAND_NAME',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'Please enter text.',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_WHAT: {
		uni: 'YYY',
		command: 'C_WHAT',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'What?',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_SEARCH_BOOK: {
		uni,
		command: 'C_SEARCH_BOOK',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'Dummy',
				}],
			},
		],
		executors: ['searchBookExecutor'],
		category: 'HIDDEN',
	},
	C_HUGE_RESPONSE: {
		uni,
		command: 'C_HUGE_RESPONSE',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB':
					`
					Google Inc. is an American multinational technology company that specializes
					in Internet-related services and products.
					These include online advertising technologies, search, cloud computing,
					software, and hardware.[^LEXICA^]
					Google was founded in 1998 by Larry Page and Sergey Brin while they were
					Ph.D. students at Stanford University,[^LEXICA^]
					in California. Together, they own about 14 percent of its shares,
					and control 56 percent of the stockholder voting power through supervoting stock.
					They incorporated Google as a privately held company on September 4, 1998.
					An initial public offering (IPO) took place on August 19, 2004,[^LEXICA^]
					and Google moved to its new headquarters in Mountain View, California,
					nicknamed the Googleplex. In August 2015, Google announced plans to reorganize
					its various interests as a conglomerate called Alphabet Inc.
					Google, Alphabet's leading subsidiary,[^LEXICA^]
					will continue to be the umbrella company for Alphabet's Internet interests.
					pon completion of the restructure, Sundar Pichai was appointed CEO of Google;
					he replaced Larry Page, who became CEO of Alphabet.
					`,
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_FIND_LIBRARIAN: {
		uni,
		command: 'C_FIND_LIBRARIAN',
		executors: ['CreateIssueExecutor'],
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'OK. The current message already redirected to librarian',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_MY_INFO: {
		uni,
		command: 'C_MY_INFO',
		requiredFeatureKeys: ['SENDER_FIRST_NAME', 'SENDER_LAST_NAME', 'SENDER_NAME'],
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'Your name is {SENDER_NAME}',
				}],
			},
		],
		preProcessors: ['SenderNamePreProcessor'],
		category: 'HIDDEN',
	},
	C_DUPLICATE_MESSAGE: {
		uni,
		command: 'C_DUPLICATE_MESSAGE',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'Duplicate',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_CONFIRM_CLOSE_ISSUE: {
		uni: 'YYY',
		command: 'C_CONFIRM_CLOSE_ISSUE',
		responses: [
			{
				type: 'OPTIONS',
				messages: [{
					'en-GB': 'Confirm to close issue?',
				}],
				options: [{
					command: 'C_CLOSE_ISSUE',
					messages: [{
						'en-GB': 'A. Yes. Close Issue',
					}],
					features: {
						abc: '',
					},
					textOnlyIndicator: 'A',
				}, {
					command: 'C_CLOSE_AND_CREATE_NEW_ISSUE',
					messages: [{
						'en-GB': 'B. No. Re-Create new Issue',
					}],
					features: {
						abc: '',
					},
					textOnlyIndicator: 'B',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_CLOSE_ISSUE: {
		uni: 'YYY',
		command: 'C_CLOSE_ISSUE',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'OK. Issue has been closed.',
				}],
			},
		],
		executors: ['CloseIssueExecutor'],
		category: 'HIDDEN',
	},
	C_CLOSE_AND_CREATE_NEW_ISSUE: {
		uni: 'YYY',
		command: 'C_CLOSE_AND_CREATE_NEW_ISSUE',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'OK. Issue has been redirect to librarian.',
				}],
			},
		],
		executors: ['CloseIssueExecutor', 'CreateIssueExecutor'],
		category: 'HIDDEN',
	},
	C_HI_LEXICA: {
		uni: 'YYY',
		command: 'C_HI_LEXICA',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'What can I help you?',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_GREETING_Y: {
		uni: 'YYY',
		command: 'C_GREETING_Y',
		requiredFeatureKeys: ['F_NAME'],
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'Hello {F_NAME}. I am Lexica.',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_OPTION_1: {
		uni,
		command: 'C_OPTION_1',
		responses: [
			{
				type: 'OPTIONS',
				messages: [{
					'en-GB': 'Option 1',
				}],
				options: [{
					command: 'C_OPTION_2',
					messages: [{
						'en-GB': 'A. Yo',
					}],
					features: {
						F_ANSWER: 'A',
					},
					textOnlyIndicator: 'A',
				}, {
					command: 'C_OPTION_3',
					messages: [{
						'en-GB': 'B. Yeah',
					}],
					features: {
						F_ANSWER: 'B',
					},
					textOnlyIndicator: 'B',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_OPTION_2: {
		uni,
		command: 'C_OPTION_2',
		responses: [
			{
				type: 'OPTIONS',
				messages: [{
					'en-GB': 'Option 2',
				}],
				options: [{
					command: 'C_OPTION_1',
					messages: [{
						'en-GB': 'A. Yo Again',
					}],
					features: {
						F_ANSWER: 'A',
					},
					textOnlyIndicator: 'A',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_OPTION_3: {
		uni,
		command: 'C_OPTION_3',
		responses: [
			{
				type: 'OPTIONS',
				messages: [{
					'en-GB': 'Option 3',
				}],
				options: [{
					command: 'C_OPTION_1',
					messages: [{
						'en-GB': 'A. Yeah Again',
					}],
					features: {
						F_ANSWER: 'A',
					},
					textOnlyIndicator: 'A',
				}],
				forceShow: true,
			},
		],
		category: 'HIDDEN',
	},
	C_CALL_EXTERNAL_SERVICE: {
		uni,
		command: 'C_CALL_EXTERNAL_SERVICE',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'Call external service',
				}],
			},
		],
		preProcessors: ['throwErrorPreprocessor'],
		category: 'HIDDEN',
		fallbackCommand: 'C_CALL_EXTERNAL_FALLBACK',
	},
	C_CALL_EXTERNAL_FALLBACK: {
		uni,
		command: 'C_CALL_EXTERNAL_FALLBACK',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'External service is temporarily unavailable',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_ADDITIONAL_RESPONSE_MESSAGE_REGEXP_TRIGGER: {
		uni: 'XXX',
		command: 'C_ADDITIONAL_RESPONSE_MESSAGE_REGEXP_TRIGGER',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'response',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_ADDITIONAL_RESPONSE_MESSAGE: {
		uni: 'XXX',
		command: 'C_ADDITIONAL_RESPONSE_MESSAGE',
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'additional',
				}],
			},
		],
		category: 'HIDDEN',
	},
	C_GREETING_X: {
		uni: 'XXX',
		command: 'C_GREETING',
		requiredFeatureKeys: ['F_NAME'],
		responses: [
			{
				type: 'TEXT',
				messages: [{
					'en-GB': 'Hello {F_NAME}. I am Lexica.',
					'zh-TW': '你好 {F_NAME}，我是 Lexica。',
				}],
			},
		],
		sessionExpire: 5,
		category: 'HIDDEN',
	},
});

const issues = List<Issue>([
	{
		uni: 'YYY',
		messenger: 'echo',
		senderId: '999999',
		status: 'OPEN',
		openDate: new Date(),
		lastUpdatedDate: new Date(),
	},
	{
		_id: '5a0870000000000000000000',
		uni: 'YYY',
		messenger: 'echo',
		senderId: '888888',
		status: 'OPEN',
		openDate: new Date(),
		lastUpdatedDate: new Date(),
	},
	{
		_id: '5a0870000000000000000001',
		uni: 'YYY',
		messenger: 'echo',
		senderId: '777777',
		status: 'OPEN',
		openDate: moment().subtract(1, 'hour').toDate(),
		lastUpdatedDate: moment().subtract(1, 'hour').toDate(),
	},
	{
		_id: '5a0870000000000000000002',
		uni: 'YYY',
		messenger: 'echo',
		senderId: '666666',
		status: 'OPEN',
		openDate: moment().subtract(1, 'hour').toDate(),
		lastUpdatedDate: moment().subtract(1, 'hour').toDate(),
	},
	{
		_id: '5a0870000000000000000003',
		uni: 'YYY',
		messenger: 'echo',
		senderId: '555555',
		status: 'OPEN',
		openDate: moment().subtract(1, 'hour').toDate(),
		lastUpdatedDate: moment().subtract(1, 'hour').toDate(),
	},
]);

const senderInfo = List<SenderInfo>([
	{
		uni,
		messenger: 'echo',
		senderId: '010101',
		firstName: 'Hello',
		lastName: 'World',
		creationDate: new Date(),
		lastUpdatedDate: new Date(),
	},
]);

const logs = List<Message>([
	{
		uni: 'YYY',
		rawRequest: {
			type: RequestType.TEXT,
			message: 'What?',
		},
		messenger: 'FACEBOOK',
		senderId: '888888',
		sessionId: '266061ba-0558-4a1d-a011-46866d45ba24',
		issueId: '5a0870000000000000000000',
		type: MessageType.REQUEST,
		date: new Date(),
		request: {
			type: RequestType.TEXT,
			message: 'What?',
		},
		commands: [
			'CIRCULATION BORROW_PRIVILEGE',
			'PHOTOCOPYING_WHAT',
		],
	},
	{
		uni: 'YYY',
		rawResponse: {
			type: RequestType.TEXT,
			message: 'This is librarian',
		},
		messenger: 'FACEBOOK',
		senderId: '888888',
		issueId: '5a0870000000000000000000',
		type: MessageType.RESPONSE,
		date: new Date(),
		response: {
			type: RequestType.TEXT,
			message: 'This is librarian',
		},
		commands: [
			'CIRCULATION BORROW_PRIVILEGE',
			'PHOTOCOPYING_WHAT',
		],
	},

	{
		uni: 'YYY',
		rawRequest: {
			type: RequestType.TEXT,
			message: 'What?',
		},
		messenger: 'FACEBOOK',
		senderId: '777777',
		sessionId: '266061ba-0558-4a1d-a011-46866d45ba24',
		issueId: '5a0870000000000000000001',
		type: MessageType.REQUEST,
		date: moment().subtract(1, 'hour').toDate(),
		request: {
			type: RequestType.TEXT,
			message: 'What?',
		},
		commands: [
			'CIRCULATION BORROW_PRIVILEGE',
			'PHOTOCOPYING_WHAT',
		],
	},
	{
		uni: 'YYY',
		rawResponse: {
			type: RequestType.TEXT,
			message: 'This is librarian',
		},
		messenger: 'FACEBOOK',
		senderId: '777777',
		issueId: '5a0870000000000000000001',
		type: MessageType.RESPONSE,
		date: moment().subtract(15, 'minute').toDate(),
		response: {
			type: RequestType.TEXT,
			message: 'This is librarian',
		},
		commands: [
			'CIRCULATION BORROW_PRIVILEGE',
			'PHOTOCOPYING_WHAT',
		],
	},

	{
		uni: 'YYY',
		rawRequest: {
			type: RequestType.TEXT,
			message: 'What?',
		},
		messenger: 'FACEBOOK',
		senderId: '666666',
		sessionId: '266061ba-0558-4a1d-a011-46866d45ba24',
		issueId: '5a0870000000000000000002',
		type: MessageType.REQUEST,
		date: moment().subtract(1, 'hour').toDate(),
		request: {
			type: RequestType.TEXT,
			message: 'What?',
		},
		commands: [
			'CIRCULATION BORROW_PRIVILEGE',
			'PHOTOCOPYING_WHAT',
		],
	},
	{
		uni: 'YYY',
		rawResponse: {
			type: RequestType.TEXT,
			message: 'This is librarian',
		},
		messenger: 'FACEBOOK',
		senderId: '666666',
		issueId: '5a0870000000000000000002',
		type: MessageType.RESPONSE,
		date: moment().subtract(15, 'minute').toDate(),
		response: {
			type: RequestType.TEXT,
			message: 'This is librarian',
		},
		commands: [
			'CIRCULATION BORROW_PRIVILEGE',
			'PHOTOCOPYING_WHAT',
		],
	},

	{
		uni: 'YYY',
		rawRequest: {
			type: RequestType.TEXT,
			message: 'What?',
		},
		messenger: 'FACEBOOK',
		senderId: '555555',
		sessionId: '266061ba-0558-4a1d-a011-46866d45ba24',
		issueId: '5a0870000000000000000003',
		type: MessageType.REQUEST,
		date: moment().subtract(1, 'hour').toDate(),
		request: {
			type: RequestType.TEXT,
			message: 'What?',
		},
		commands: [
			'CIRCULATION BORROW_PRIVILEGE',
			'PHOTOCOPYING_WHAT',
		],
	},
	{
		uni: 'YYY',
		rawResponse: {
			message: 'This is librarian',
			type: RequestType.TEXT,
			
		},
		messenger: 'FACEBOOK',
		senderId: '555555',
		issueId: '5a0870000000000000000003',
		type: MessageType.RESPONSE,
		date: moment().subtract(15, 'minute').toDate(),
		response: {
			message: 'This is librarian',
			type: RequestType.TEXT,
		},
		commands: [
			'CIRCULATION BORROW_PRIVILEGE',
			'PHOTOCOPYING_WHAT',
		],
	},
]);


export { uni, configs, messages, nlpCommands, intents, issues, senderInfo, logs };
