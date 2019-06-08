import { isNil } from 'lodash';
import { Map, List } from 'immutable';
import { Middleware, RequestType } from '../Api';

const supportedTypes = [RequestType.AUDIO, RequestType.FILE, RequestType.IMAGE, RequestType.VIDEO];

const fileRequestMiddleware: Middleware = async (context, next) => {
  const { request, fileService } = context;
  if (!isNil(request) && !isNil(request.fileUrl) && supportedTypes.indexOf(request.type) !== -1) {
    const file = await fileService.copy(request.fileUrl);
    request.fileStoredPath = file.path;
    request.fileContentType = file.contentType;
  }
  await next();
};

export default fileRequestMiddleware;
