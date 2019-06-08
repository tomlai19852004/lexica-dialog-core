import { isNil } from 'lodash';
import { Middleware } from '../Api';

const senderInfoMiddleware: Middleware = async (context, next) => {
  const { uni, messenger, request, senderInfoRepository } = context;
  if (!isNil(request)) {
    const senderInfo = await senderInfoRepository
      .findOneByUniAndMessengerAndSenderId(uni, messenger.name, request.senderId);
    if (!isNil(senderInfo)) {
      context.senderInfo = senderInfo;
    }
  }
  await next();
};

export default senderInfoMiddleware;
