import { isNil } from 'lodash';
import { MessageType } from 'lexica-dialog-model/dist/Message';
import { Middleware } from '../Api';

const responseMessageLoggingMiddleware: Middleware = async (context, next) => {
  await next();
  const {
    uni,
    messenger,
    request,
    sessionService,
    messageRepository,
    logger,
    responses,
    rawResponses,
    issue,
  } = context;
  if (!isNil(request) && !isNil(sessionService) && !isNil(responses) && !isNil(rawResponses)) {
    let promises;
    const baseResponseMessage = {
      date: new Date(),
      issueId: !isNil(issue) ? issue.id : undefined,
      messenger: messenger.name,
      senderId: request.senderId,
      sessionId: sessionService.getSessionId(),
      type: MessageType.RESPONSE,
      uni,
    };
    if (responses.size === rawResponses.size) {
      promises = Promise.all(responses.toArray().map((response, index) => {
        return messageRepository.create({
          ...baseResponseMessage,
          rawResponse: rawResponses.get(index),
          response,
        });
      }));
    } else {
      promises = Promise.all(responses.toArray().map((response, index) => {
        return messageRepository.create({
          ...baseResponseMessage,
          rawResponse: rawResponses.toObject(),
          response,
        });
      }));
    }

    promises.catch(err => logger.error('Create response message with error', err));
  }
};

export default responseMessageLoggingMiddleware;
