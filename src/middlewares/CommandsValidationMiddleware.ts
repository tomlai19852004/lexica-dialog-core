import { isNil } from 'lodash';
import { BotError, BotErrorCode, Middleware } from '../Api';

const commandsValidationMiddleware: Middleware = async (context, next) => {
	const { commands } = context;

	if (commands.isEmpty()) {
		throw new BotError(BotErrorCode.INTENT_NOT_FOUND);
	}

	commands.toArray().forEach((command) => {
		if (isNil(command.intent)) {
			throw new BotError(BotErrorCode.INTENT_NOT_FOUND);
		}
	});

	await next();
};

export default commandsValidationMiddleware;
