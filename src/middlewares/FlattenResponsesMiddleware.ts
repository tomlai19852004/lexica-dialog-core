import { Map, List } from 'immutable';
import { BotResponse, Middleware } from '../Api';

const flattenResponsesMiddleware: Middleware = async (context, next) => {
  await next();
  context.responses = List(context.commands
    .toArray()
    .map(command => command.botResponses)
    .reduce((a, b) => a.concat(b), List<BotResponse>()));
};

export default flattenResponsesMiddleware;
