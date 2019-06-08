import { isNil, defaultTo } from 'lodash';
import {
  Request,
  MessageType,
  RequestType,
  ResponseType,
  RequestMessage,
} from 'lexica-dialog-model/dist/Message';
import { Middleware } from '../Api';

const requestMessageLoggingMiddleware: Middleware = async (context, next) => {
  const {
    uni,
    messenger,
    request,
    sessionService,
    messageRepository,
    issueRepository,
    logger,
    rawRequest,
    commands,
    issue,
  } = context;
  if (!isNil(request) && !isNil(sessionService)) {
    const date = new Date();
    let logRequest: Request;

    if (request.type === RequestType.TEXT) {
      logRequest = {
        message: defaultTo(request.message, ''),
        type: RequestType.TEXT,
      };
    } else {
      logRequest = {
        contentType: defaultTo(request.fileContentType, ''),
        path: defaultTo(request.fileStoredPath, ''),
        type: request.type,
      };
    }

    context.requestMessage = await messageRepository.create({
      date,
      issueId: !isNil(issue) ? issue.id : undefined,
      messenger: messenger.name,
      rawRequest,
      // TODO support multiple request type
      request: logRequest,
      senderId: request.senderId,
      sessionId: sessionService.getSessionId(),
      type: MessageType.REQUEST,
      uni,
    }) as RequestMessage;

    if (!isNil(issue)) {
      issue.lastUpdatedDate = date;
      context.issue = await issueRepository.save(issue);
    }
  }
  await next();
};

export default requestMessageLoggingMiddleware;
