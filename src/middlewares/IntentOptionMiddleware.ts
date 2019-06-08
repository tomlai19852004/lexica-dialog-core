import { isNil } from 'lodash';
import { Map, List } from 'immutable';
import { BotResponse, Middleware, SessionOption } from '../Api';
import { ResponseType } from 'lexica-dialog-model/dist/Intent';

const intentOptionMiddleware: Middleware = async (context, next) => {
  const { sessionService, commands, request } = context;
  if (
    !isNil(sessionService) &&
    !isNil(request) &&
    !isNil(request.message) &&
    sessionService.hasOptions() &&
    commands.isEmpty()
  ) {
    const options = List(
      sessionService
        .getOptions()
        .filter(
          option =>
            !isNil(request.message) &&
            option.textOnlyIndicator.toLowerCase().trim() === request.message.toLowerCase().trim(),
        ),
    );
    if (!options.isEmpty() && options.size === 1) {
      const option = options.first();
      context.commands = List([
        {
          attributes: Map<string, any>(),
          botResponses: List<BotResponse>(),
          features: Map(option.features),
          name: option.command,
          processedFeatures: Map<string, any>(),
        },
      ]);
      sessionService.removeOptions();
    }
  }
  await next();
  const responses = List(context.responses.toArray().filter(response => response.type === ResponseType.OPTIONS));
  if (!isNil(sessionService) && !responses.isEmpty() && responses.size === 1) {
    const response = responses.first();
    if (response.type === ResponseType.OPTIONS) {
      const options = !isNil(response.options)
        ? response.options.map(option => ({
            command: option.command,
            features: option.features,
            liveCount: 0,
            textOnlyIndicator: option.textOnlyIndicator,
          }))
        : undefined;
      if (!isNil(options)) {
        sessionService.setOptions(options);
      }
    }
  }
};

export default intentOptionMiddleware;
