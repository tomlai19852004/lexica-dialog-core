import { isNil } from 'lodash';
import { Map, List, Record } from 'immutable';
import { Middleware, BotResponse } from '../Api';

const messengerMiddleware: Middleware = async (context, next) => {
  const { messenger, uniConfigs, serverContext, rawRequest } = context;
  const request = messenger.request(rawRequest);
  context.request = request;
  if (!isNil(request.commands) && !request.commands.isEmpty()) {
    context.commands = List(
      request.commands.toArray().map(command => ({
        attributes: Map<string, any>(),
        botResponses: List<BotResponse>(),
        features: command.features,
        name: command.name,
        processedFeatures: Map<string, any>(),
      })),
    );
  }
  await next();
  const { responses } = context;
  context.rawResponses = messenger.response(responses, request.senderId, rawRequest);
  await messenger.send(context.rawResponses, uniConfigs);
};

export default messengerMiddleware;
