import { isNil } from 'lodash';
import { BotError, BotErrorCode, BotResponse, ConfigRepository } from './Api';
import { Map, List } from 'immutable';
import { default as IntlMessageFormat } from 'intl-messageformat';
import { Config } from 'lexica-dialog-model/dist/Config';
import {
	Message,
	Response,
	ResponseType,
} from 'lexica-dialog-model/dist/Intent';

function intentResponsesToBotResponses(
	responses: Response[],
	features: Map<string, any>,
	locale: string): List<BotResponse> {
	return responses
		.map(response => intentResponseToBotResponse(response, features, locale))
		.reduce((a, b) => a.concat(b), List<BotResponse>())
		.toList();
}

function intentResponseToBotResponse(
	response: Response,
	features: Map<string, any>,
	locale: string): List<BotResponse> {
	let results: List<BotResponse>;
	if (response.type === ResponseType.TEXT && !isNil(response.messages)) {
		const message: string = extractMessage(response.messages, features, locale);
		const responses = message
			.split('[^LEXICA^]')
			.map(msg => ({
				message: msg,
				type: ResponseType.TEXT,
			}));
		results = List<BotResponse>(responses);
	} else if (response.type === ResponseType.OPTIONS && !isNil(response.options)) {
		const options = response.options.map(option => ({
			command: option.command,
			features: option.features,
			message: this.extractMessage(option.messages, features, locale),
			textOnlyIndicator: option.textOnlyIndicator,
		}));
		results = List<BotResponse>([{
			forceShow: response.forceShow,
			message: this.extractMessage(response.messages, features, locale),
			options,
			type: ResponseType.OPTIONS,
		}]);
	} else if (response.type === ResponseType.ITEMS && !isNil(response.items)) {
		const items = response.items.map(item => ({
			message: this.extractMessage(item.messages, features, locale),
			type: item.type,
			url: item.url,
		}));
		results = List<BotResponse>([{
			items,
			message: this.extractMessage(response.messages, features, locale),
			type: ResponseType.ITEMS,
		}]);
	} else {
		throw new BotError(BotErrorCode.INVALID_RESPONSE_TYPE);
	}
	return results;
}

function extractMessage(
	messages: Message[],
	feature: Map<string, string>,
	locale: string): string {
	const text = messages[Math.floor(Math.random() * messages.length)];
	return new IntlMessageFormat(text[locale], locale).format(feature.toObject());
}

function toConfigMap(configs: Config[]): Map<string, Config> {
	return configs.reduce(
		(map, config) => map.set(config.key.toString(), config), Map<string, Config>(),
	);
}

export {
	intentResponsesToBotResponses,
	intentResponseToBotResponse,
	extractMessage,
	toConfigMap,
};
