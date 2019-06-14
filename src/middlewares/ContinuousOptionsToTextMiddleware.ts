import { List } from 'immutable';
import { isNil } from 'lodash';
import { BotResponse, Middleware, SessionOption } from '../Api';
import { OptionResponse, ResponseType } from 'lexica-dialog-model/dist/Intent';

const continuousOptionsToTextMiddleware: Middleware = async (context, next) => {
  const { sessionService } = context;
  const lastIntentIsOption = !context.commands.isEmpty();
  await next();
  const { responses } = context;
  if (lastIntentIsOption) {
    context.responses = responses
      .map((response: BotResponse) => {
        let result: BotResponse = response;
        if (result.type === ResponseType.OPTIONS && (isNil(result.forceShow) || !result.forceShow)) {
          result = {
            message: result.message,
            type: ResponseType.TEXT,
          };
        }
        return result;
      })
      .toList();
  }
};

export default continuousOptionsToTextMiddleware;
