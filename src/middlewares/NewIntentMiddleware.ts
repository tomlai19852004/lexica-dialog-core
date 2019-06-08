import { isNil } from 'lodash';
import { Middleware } from '../Api';

const newIntentMiddleware: Middleware = async (context, next) => {
  const { uni, commands, intentRepository, sessionService } = context;
  // TODO can improve to parallel find
  await Promise.all(
    commands
      .toArray()
      .filter(command => isNil(command.intent))
      .map(async command => {
        if (!isNil(command.name)) {
          const intent = await intentRepository.findByUniCommandName(uni, command.name);
          command.intent = intent == null ? undefined : intent;
        }
      }),
  );
  await next();
};

export default newIntentMiddleware;
