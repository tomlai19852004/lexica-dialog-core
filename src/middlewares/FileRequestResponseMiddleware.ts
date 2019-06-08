import { isNil } from 'lodash';
import { Map, List } from 'immutable';
import {
	BotError,
	BotErrorCode,
	BotResponse,
	Middleware,
	RunTimeConfig,
} from '../Api';
import { intentResponseToBotResponse } from '../Utils';

const fileRequestMiddleware: Middleware = async (context, next) => {
	const { uni, request, uniConfigs, intentRepository } = context;
	if (
		!isNil(request)
		&& !isNil(request.fileUrl)
		&& request.message === undefined
		&& uniConfigs.has(RunTimeConfig.FILE_REQUEST_COMMAND_NAME)) {

		const { locale } = request;
		const command = uniConfigs.get(RunTimeConfig.FILE_REQUEST_COMMAND_NAME).value as string;
		const intent = await intentRepository.findByUniCommandName(uni, command);

		if (!isNil(intent)) {
			const responses = List(intent.responses
				.map(response => intentResponseToBotResponse(response, Map<string, any>(), locale)));
			context.responses =
				List(responses.toArray().reduce((a, b) => a.concat(b), List<BotResponse>()));
		} else {
			throw new BotError(BotErrorCode.INTENT_NOT_FOUND, 'Command not found: ' + command);
		}

	} else {
		await next();
	}
};

export default fileRequestMiddleware;
