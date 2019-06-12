import { isNil } from 'lodash';
import { Map, List } from 'immutable';
import { BotResponse, Middleware } from '../Api';

const conversationIntentMiddleware: Middleware = async (context, next) => {
	const { commands, sessionService } = context;
	if (!isNil(sessionService) && sessionService.hasConversation()) {
		const features = commands
			.toArray()
			.map(command => command.features)
			.reduce((prev, next) => prev.merge(next), sessionService.getConversationFeatures());
		const intent = sessionService.getConversationIntent();
		context.commands = List([
			{
				attributes: Map<string, any>(),
				botResponses: List<BotResponse>(),
				features,
				intent,
				processedFeatures: Map<string, any>(),
			},
		]);
	}
	await next();
};

export default conversationIntentMiddleware;
