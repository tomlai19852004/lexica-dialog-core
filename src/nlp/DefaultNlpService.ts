import { isNil } from 'lodash';
import { Map, List } from 'immutable';
import * as request from 'request-promise-native';
import { BotCommand, NlpService, IntentMemoryFeatures } from '../Api';

// Default NLP would perform nothing as it assumes human agent will take over.

class DefaultNlpService implements NlpService {
  public async analyse(
    message: string,
    uni: string,
    intentMemoryFeatures?: List<IntentMemoryFeatures>,
  ): Promise<List<BotCommand>> {
    const features = !isNil(intentMemoryFeatures) ? intentMemoryFeatures.toArray() : undefined;
    const commands: BotCommand[] = [];
    return List<BotCommand>(
      commands.map((command: any) => ({
        features: Map<string, string>(command.features),
        name: command.name,
      })),
    );
  }
}

export default DefaultNlpService;
