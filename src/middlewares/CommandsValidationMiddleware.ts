import { isNil } from 'lodash';
import { BotError, BotErrorCode, Middleware, RunTimeConfig } from '../Api';

const commandsValidationMiddleware: Middleware = async (context, next) => {
  const { commands, uniConfigs } = context;

  if (
    !uniConfigs.has(RunTimeConfig.SUSPEND_AUTO_REPLY) ||
    (uniConfigs.has(RunTimeConfig.SUSPEND_AUTO_REPLY) &&
    !(uniConfigs.get(RunTimeConfig.SUSPEND_AUTO_REPLY).value as boolean))
  ) {
    if (commands.isEmpty()) {
      throw new BotError(BotErrorCode.INTENT_NOT_FOUND);
    }
  }

  commands.toArray().forEach(command => {
    if (isNil(command.intent)) {
      throw new BotError(BotErrorCode.INTENT_NOT_FOUND);
    }
  });

  await next();
};

export default commandsValidationMiddleware;
