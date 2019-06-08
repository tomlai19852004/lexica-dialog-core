import { Map, List } from 'immutable';
import * as Koa from 'koa';
import { Config } from 'lexica-dialog-model/dist/Config';
import { BotRequest, BotResponse, Messenger } from '../src/Api';
import { ResponseType } from 'lexica-dialog-model/dist/Intent';

class EchoMessenger implements Messenger<BotRequest, BotResponse> {

  public name: string = 'echo';

  public request(rawBody: BotRequest): BotRequest {
    return rawBody;
  }

  public response(
    responses: List<BotResponse>,
    senderId: string,
    rawBody?: BotRequest): List<BotResponse> {
    return List(responses.toArray().map((response) => {
      let result: BotResponse;
      if (response.type === ResponseType.OPTIONS && response.options) {
        result = {
          message: response.message + '\n'
            + response.options.map(option => option.message).join('\n'),
          type: ResponseType.TEXT,
        };
      } else {
        result =  response;
      }
      return result;
    }));
  }

  public async send(
    responses: List<BotResponse>,
    configs: Map<string, Config>): Promise<void> {}

}

export { EchoMessenger };
