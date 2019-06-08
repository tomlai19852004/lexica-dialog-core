import { RunTimeConfig, Middleware } from '../Api';

const messengerWhiteListMiddleware: Middleware = async (context, next) => {
  const { uniConfigs, messenger, serverContext } = context;
  if (uniConfigs.has(RunTimeConfig.MESSENGER_WHITE_LIST)) {
    const names = uniConfigs.get(RunTimeConfig.MESSENGER_WHITE_LIST).value as string[];
    const exist = names.some(name => name.toLowerCase() === messenger.name.toLowerCase());
    if (exist) {
      await next();
    } else {
      serverContext.status = 404;
    }
  } else {
    await next();
  }
};

export default messengerWhiteListMiddleware;
