import { Map, List } from 'immutable';
import { isNil, random } from 'lodash';
import { Middleware, RunTimeConfig, BotResponse, RequestType } from '../Api';
import { intentResponsesToBotResponses } from '../Utils';

const additionalResponseMessageMiddleware: Middleware = async (context, next) => {
	await next();
	const { uni, uniConfigs, request, responses, messageRepository, intentRepository, logger } = context;

	if (
		!isNil(request) &&
		!isNil(request.message) &&
		!isNil(request.type === RequestType.TEXT) &&
		uniConfigs.has(RunTimeConfig.ADDITIONAL_RESPONSE_MESSAGE) &&
		responses.size > 0
	) {
		const config = uniConfigs.get(RunTimeConfig.ADDITIONAL_RESPONSE_MESSAGE);
		const value: any = config.value;
		const command = value.COMMAND;
		const triggerRegexp = new RegExp(value.TRIGGER_REGEXP, 'i');
		const triggerUserTotalMessages = value.TRIGGER_USER_TOTAL_MESSAGES;
		const triggerUserTotalMessagesPercentage = value.TRIGGER_USER_TOTAL_MESSAGES_PERCENTAGE;
		let hasAdditionalResponseMessage = triggerRegexp.test(request.message);

		if (!hasAdditionalResponseMessage) {
			const r = random(0, 100);
			const count = await messageRepository.countAll();
			if (count >= triggerUserTotalMessages && triggerUserTotalMessagesPercentage >= r) {
				hasAdditionalResponseMessage = true;
			}
		}

		if (hasAdditionalResponseMessage) {
			const intent = await intentRepository.findByUniCommandName(uni, command);
			if (isNil(intent)) {
				logger.warn(`Additional message not found with command: [${command}]`);
			} else {
				context.responses = context.responses
					.concat(intentResponsesToBotResponses(intent.responses, Map(), request.locale))
					.toList();
			}
		}
	}
};

export default additionalResponseMessageMiddleware;
