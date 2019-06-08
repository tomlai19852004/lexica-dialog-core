import { isNil } from 'lodash';
import { Middleware } from '../Api';

const intentExecutorMiddleware: Middleware = async (context, next) => {
	const {
		uni,
		uniConfigs,
		request,
		messenger,
		commands,
		intentRepository,
		sessionRepository,
		configRepository,
		messageRepository,
		issueRepository,
		senderInfoRepository,
		sessionService,
		executors,
		requestMessage,
		issue,
		senderInfo,
		logger,
	} = context;
	if (!isNil(request) && !isNil(sessionService)) {
		const { locale, senderId } = request;
		const promises = commands
		.toArray()
		.map(async (command) => {
			if (
				!isNil(command.intent)
				&& !isNil(command.intent.executors)
				&& command.intent.executors.length > 0) {
				const executorContext = {
					command,
					configRepository,
					intentRepository,
					issue,
					issueRepository,
					locale,
					messageRepository,
					messenger,
					messengerName: messenger.name,
					requestMessage,
					senderId,
					senderInfo,
					senderInfoRepository,
					sessionRepository,
					sessionService,
					uni,
					uniConfigs,
				};
				for (const name of command.intent.executors) {
					if (executors.has(name)) {
						await executors.get(name)(executorContext);
					} else {
						logger.warn('Executor not found: [%s]', name);
					}
				}
				context.issue = executorContext.issue;
				context.requestMessage = executorContext.requestMessage;
			}
		});
		await Promise.all(promises);
	}
	await next();
};

export default intentExecutorMiddleware;
