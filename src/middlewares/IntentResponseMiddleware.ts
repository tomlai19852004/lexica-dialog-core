import { isNil } from 'lodash';
import { Map, List } from 'immutable';
import { Middleware, BotResponse } from '../Api';
import { intentResponseToBotResponse } from '../Utils';

const intentResponseMiddleware: Middleware = async (context, next) => {
  const { request, commands } = context;
  if (!isNil(request)) {
    const { locale } = request;
    commands.toArray().forEach(command => {
      const { intent, processedFeatures } = command;
      if (!isNil(intent)) {
        const responses = List(
          intent.responses.map(response => intentResponseToBotResponse(response, processedFeatures, locale)),
        );
        command.botResponses = List(responses.toArray().reduce((a, b) => a.concat(b), List<BotResponse>()));
      }
    });
  }
  await next();
};

export default intentResponseMiddleware;
