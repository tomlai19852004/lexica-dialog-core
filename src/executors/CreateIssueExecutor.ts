import { isNil } from 'lodash';
import { Status } from 'lexica-dialog-model/dist/Issue';
import { RequestMessage } from 'lexica-dialog-model/dist/Message';
import { Executor } from '../Api';

const createIssueExecutor: Executor = async context => {
	const { uni, messengerName, senderId, issueRepository, messageRepository, issue, requestMessage } = context;
	if (isNil(issue) || issue.status === Status.CLOSED) {
		const date = new Date();
		const workingIssue = await issueRepository.create({
			lastUpdatedDate: date,
			messenger: messengerName,
			openDate: date,
			senderId,
			status: Status.OPEN,
			uni,
		});
		context.issue = workingIssue;

		if (!isNil(requestMessage)) {
			requestMessage.issueId = workingIssue.id;
			context.requestMessage = (await messageRepository.save(requestMessage)) as RequestMessage;
		}
	}
};

export default createIssueExecutor;
