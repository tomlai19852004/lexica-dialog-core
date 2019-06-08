import { Map, List } from 'immutable';
import { BotCommand, NlpService } from '../src/Api';
import { ResponseType } from 'lexica-dialog-model/dist/Intent';

class KeyValueNlpService implements NlpService {

  constructor(private commands: Map<string, BotCommand[]>) { }

  public analyse(message: string): Promise<List<BotCommand>> {
    if (this.commands.has(message)) {
      return Promise.resolve(List(this.commands.get(message)));
    }
    return Promise.resolve(List());
  }

}

export { KeyValueNlpService };
