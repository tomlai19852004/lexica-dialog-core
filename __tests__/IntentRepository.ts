import { Map } from 'immutable';
import { IntentRepository } from '../src/Api';
import { Intent, ResponseType } from 'lexica-dialog-model/dist/Intent';


class KeyValueIntentRepository implements IntentRepository {

  constructor(private intents: Map<string, Intent>) { }

  public findByUniCommandName(uni: string, command: string): Promise<Intent> {
    return Promise.resolve(this.intents.get(command));
  }

}

export { KeyValueIntentRepository };
