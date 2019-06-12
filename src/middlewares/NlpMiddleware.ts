import { isNil } from 'lodash';
import { Map, List } from 'immutable';
import { RequestMessage } from 'lexica-dialog-model/dist/Message';
import { BotResponse, Middleware, SessionService } from '../Api';

const nlpMiddleware: Middleware = async (context, next) => {
	const { uni, nlpService, request, sessionService, requestMessage, messageRepository } = context;

	let features;

	if (!isNil(sessionService)) {
		features = sessionService.getIntentMemoryFeatures();
	}

	if (!isNil(request) && !isNil(request.message) && context.commands.isEmpty()) {
		const commands = await nlpService.analyse(request.message, uni, features);
		context.commands = List(
			commands.toArray().map(command => ({
				attributes: Map<string, any>(),
				botResponses: List<BotResponse>(),
				features: command.features,
				name: command.name,
				processedFeatures: Map<string, any>(),
			})),
		);

		if (!isNil(requestMessage)) {
			const commandNames = commands.toArray().map(command => command.name);
			requestMessage.commands = commandNames;
			context.requestMessage = (await messageRepository.save(requestMessage)) as RequestMessage;
		}
	}
	await next();
};

export default nlpMiddleware;
