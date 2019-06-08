import { isNil } from 'lodash';
import { Status } from 'lexica-dialog-model/dist/Issue';
import { Executor } from '../Api';

const closeIssueExecutor: Executor = async context => {
  const { issueRepository, issue } = context;
  if (!isNil(issue)) {
    const date = new Date();

    issue.status = Status.CLOSED;
    issue.lastUpdatedDate = date;
    issue.closedDate = date;

    context.issue = await issueRepository.save(issue);
  }
};

export default closeIssueExecutor;
