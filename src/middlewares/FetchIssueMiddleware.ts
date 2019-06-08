import { isNil } from 'lodash';
import { Status } from 'lexica-dialog-model/dist/Issue';
import { Middleware } from '../Api';

const fetchIssueMiddleware: Middleware = async (context, next) => {
  const { uni, request, issueRepository } = context;
  if (!isNil(request)) {
    const { senderId } = request;
    const issues = await issueRepository.findByUniAndSenderIdAndStatus(uni, senderId, Status.OPEN);
    if (issues.length > 0) {
      context.issue = issues[0];
    }
  }
  await next();
};

export default fetchIssueMiddleware;
