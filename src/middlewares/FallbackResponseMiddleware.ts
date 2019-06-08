import { isNil } from 'lodash';
import { Map, List } from 'immutable';
import { BotResponse, Middleware, RunTimeConfig, BotContextCommand } from '../Api';
import { intentResponseToBotResponse } from '../Utils';
import { ResponseType } from 'lexica-dialog-model/dist/Intent';
import { Config } from 'lexica-dialog-model/dist/Config';

function findFallbackCommand(uniConfigs: Map<string, Config>, commands: List<BotContextCommand>) {
  let fallbackCommand: string | undefined;

  const fallbackCommands = commands
    .toArray()
    .map((command) => {
      if (!isNil(command.intent) && !isNil(command.intent.fallbackCommand)) {
        return command.intent.fallbackCommand;
      }
      return undefined;
    })
    .filter(fallbackCommand => !isNil(fallbackCommand));

  if (fallbackCommands.length > 0) {
    fallbackCommand = fallbackCommands[0];
  } else if (uniConfigs.has(RunTimeConfig.FALLBACK_COMMAND_NAME)) {
    fallbackCommand = uniConfigs.get(RunTimeConfig.FALLBACK_COMMAND_NAME).value as string;
  }

  return fallbackCommand;
}

const fallbackResponseMiddleware: Middleware = async (context, next) => {
  try {
    await next();
  } catch (error) {
    const {
      request,
      uni,
      uniConfigs,
      intentRepository,
      logger,
      rawRequest,
      commands,
    } = context;
    const fallbackCommand = findFallbackCommand(uniConfigs, commands);
    let fallbacked = false;

    logger.error(
      `
        Return fallback message.
        Raw Request: %s
        Error: %s
        Stack trace:
        %s
      `,
      JSON.stringify(rawRequest),
      JSON.stringify(error),
      error.stack,
    );

    if (!isNil(request) && !isNil(fallbackCommand)) {
      const { locale } = request;
      const intent = await intentRepository.findByUniCommandName(uni, fallbackCommand);

      if (!isNil(intent)) {
        const responses = List(intent.responses
          .map(response => intentResponseToBotResponse(response, Map<string, any>(), locale)));
        context.responses =
          List(responses.toArray().reduce((a, b) => a.concat(b), List<BotResponse>()));
        fallbacked = true;
      }
    }

    if (!fallbacked) {
      const response: BotResponse = {
        message: 'Sorry, I don\'t know',
        type: ResponseType.TEXT,
      };
      context.responses = List([response]);
    }
  }
};

export default fallbackResponseMiddleware;
