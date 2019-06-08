import { isNil } from 'lodash';
import { Map, List } from 'immutable';
import * as request from 'request-promise-native';
import { BotCommand, NlpService, IntentMemoryFeatures } from '../Api';

class DefaultNlpService implements NlpService {

	constructor(private readonly url: string) { }

	public async analyse(
		message: string,
		uni: string,
		intentMemoryFeatures?: List<IntentMemoryFeatures>,
	): Promise<List<BotCommand>> {
		const features = !isNil(intentMemoryFeatures) ? intentMemoryFeatures.toArray() : undefined;
		const commands = await request({
			body: {
				features,
				msg: message,
				uni,
			},
			json: true,
			method: 'POST',
			uri: this.url,
		});
		return List<BotCommand>(
			commands.map((command: any) => ({
				features: Map<string, string>(command.features),
				name: command.name,
			})),
		);
	}

}

export default DefaultNlpService;
