import { isNil } from 'lodash';
import { Middleware, RunTimeConfig } from '../Api';
import { SessionService } from '../session';

const createSessionServiceMiddleware: Middleware = async (context, next) => {
  const { uni, sessionRepository, request, uniConfigs } = context;
  if (!isNil(request)) {
    const sessionService = new SessionService(
      sessionRepository,
      uni,
      request.senderId,
      (uniConfigs.get(RunTimeConfig.SESSION_EXPIRE_IN_MS).value as number),
    );
    context.sessionService = sessionService;
    await sessionService.init();
    await next();
    await sessionService.save();
  } else {
    await next();
  }
};

export default createSessionServiceMiddleware;
