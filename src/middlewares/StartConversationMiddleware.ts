import { isNil, defaultTo } from 'lodash';
import { List, Map } from 'immutable';
import {
  BotError,
  BotErrorCode,
  Middleware,
  BotResponse,
} from '../Api';
import { intentResponseToBotResponse } from '../Utils';
import { ResponseType } from 'lexica-dialog-model/dist/Intent';

const startConversationMiddleware: Middleware = async (context, next) => {
  try {
    await next();
  } catch (error) {
    const { sessionService, request, commands } = context;
    if (
      !isNil(sessionService)
      && !isNil(request)
      && error instanceof BotError
      && error.code === BotErrorCode.MISSING_REQUIRED_FEATURE
      && commands.size === 1) {
      const { locale } = request;
      const command = commands.first();
      const intent = command.intent;
      const features = command.features;
      const processedFeatures = command.processedFeatures;

      if (!isNil(intent) && !isNil(intent.missingFeatures)) {
        const missingFeatures = Map(intent.missingFeatures);
        if (sessionService.hasConversation()) {
          sessionService.updateConversationFeatures(features);
        } else {
          sessionService.startConversation(intent, features);
        }
        const highestPriority = missingFeatures
          .filter((value, key) => !features.has(defaultTo(key, '')))
          .toList()
          .sort((a, b) => a.priority - b.priority)
          .first();
        const responses = List(intent.responses
          .map(response => intentResponseToBotResponse(
            highestPriority.response, features, locale)));
        command.botResponses =
            List(responses.toArray().reduce((a, b) => a.concat(b), List<BotResponse>()));
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
};

export default startConversationMiddleware;
