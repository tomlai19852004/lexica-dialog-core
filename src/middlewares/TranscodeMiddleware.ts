import { isNil } from 'lodash';
import { Middleware, RequestType } from '../Api';

const transcodeMiddleware: Middleware = async (context, next) => {
  const { request, transcodeService } = context;

  if (
    !isNil(request) &&
    (request.type === RequestType.AUDIO || request.type === RequestType.VIDEO) &&
    !isNil(request.fileStoredPath) &&
    !isNil(request.fileContentType)
  ) {
    const transcode =
      request.type === RequestType.AUDIO ? transcodeService.transcodeAudio : transcodeService.transcodeVideo;
    const file = await transcode.call(transcodeService, {
      contentType: request.fileContentType,
      path: request.fileStoredPath,
    });
    request.fileStoredPath = file.path;
    request.fileContentType = file.contentType;
  }

  await next();
};

export default transcodeMiddleware;
