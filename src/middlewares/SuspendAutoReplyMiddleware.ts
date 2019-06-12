import { Map, List } from 'immutable';
import { isNil } from 'lodash';
import { Middleware, RunTimeConfig, MessageRepository } from '../Api';
import { Issue, Status } from 'lexica-dialog-model/dist/Issue';
import { RequestMessage, BaseMessage, Response, MessageType } from 'lexica-dialog-model/dist/Message';

const updateLog = async (messageRepository: MessageRepository, requestMessage: RequestMessage, issue: Issue) => {
  requestMessage.issueId = issue.id;
  await messageRepository.save(requestMessage);
};

const sortMessage = (messages: BaseMessage[]) => {
  const sortedMessages = messages.slice();
  sortedMessages.sort((a: BaseMessage, b: BaseMessage) => a.date.getTime() - b.date.getTime());
  return sortedMessages;
};

const findFirstLibrarianMessage = (messages: BaseMessage[]) => {
  const sortedMessages = sortMessage(messages).filter(message => isNil(message.sessionId));
  if (sortedMessages.length === 0) {
    return null;
  }
  return sortedMessages[0];
};

const getLastMessageTimeGap = (messages: BaseMessage[]) => {
  if (messages.length <= 1) {
    return 0;
  }
  const sortedMessages = sortMessage(messages);
  const lastMessage = sortedMessages.pop() as BaseMessage;
  const last2Message = sortedMessages.pop() as BaseMessage;
  return lastMessage.date.getTime() - last2Message.date.getTime();
};

const suspendAutoReplyMiddleware: Middleware = async (context, next) => {
  const {
    uni,
    uniConfigs,
    request,
    messenger,
    issueRepository,
    messageRepository,
    requestMessage,
    intentRepository,
    logger,
  } = context;

  if (!isNil(request)) {
    const { senderId } = request;
    const issues = await issueRepository.findByUniAndSenderIdAndStatus(uni, senderId, Status.OPEN);
    let issue: Issue;

    if (
      uniConfigs.has(RunTimeConfig.SUSPEND_AUTO_REPLY) &&
      (uniConfigs.get(RunTimeConfig.SUSPEND_AUTO_REPLY).value as boolean)
    ) {
      if (issues.length === 0) {
        const date = new Date();
        issue = await issueRepository.create({
          lastUpdatedDate: date,
          messenger: messenger.name,
          openDate: date,
          senderId,
          status: Status.OPEN,
          uni,
        });

        if (!isNil(requestMessage)) {
          await updateLog(messageRepository, requestMessage, issue);
        }

        context.issue = issue;

        return;
      }
    }

    if (issues.length === 0) {
      // No issue found, virtual agent is allowed to response
      await next();
    } else {
      const workingIssue = issues[0];
      const messages = sortMessage(
        await messageRepository.findByUniAndSenderIdAndIssueId(uni, senderId, workingIssue.id as string),
      );
      const firstLibrarianMessage = findFirstLibrarianMessage(messages);
      if (isNil(firstLibrarianMessage)) {
        // No response from librarian, virtual agent is allowed to response
        await next();
      } else {
        // Calculate if the virtual agent should response to client automatically:
        // Check if there is an existing issue and if the time of the last response from user has surpassed the waiting period
        const timeGap = getLastMessageTimeGap(messages);
        const commandNameConfig = uniConfigs.get(RunTimeConfig.CONFIRM_CLOSE_ISSUE_COMMAND_NAME);
        const timeGapConfig = uniConfigs.get(RunTimeConfig.TIME_GAP_IN_MS_TRIGGER_CONFIRM_CLOSE_ISSUE);
        const recreateIssueConfig = uniConfigs.get(RunTimeConfig.RECREATE_ISSUE_KEY_WORD);
        let goToNext = false;

        if (isNil(commandNameConfig)) {
          logger.warn('Config not found: [%s]', RunTimeConfig.CONFIRM_CLOSE_ISSUE_COMMAND_NAME);
        }

        if (isNil(timeGapConfig)) {
          logger.warn('Config not found: [%s]', RunTimeConfig.TIME_GAP_IN_MS_TRIGGER_CONFIRM_CLOSE_ISSUE);
        }

        if (isNil(recreateIssueConfig)) {
          logger.warn('Config not found: [%s]', RunTimeConfig.RECREATE_ISSUE_KEY_WORD);
        }

        const recreateIssueWords = isNil(recreateIssueConfig)
          ? ''
          : (recreateIssueConfig.value as string).toLowerCase();
        const requestText = isNil(request.message) ? undefined : request.message.toLowerCase();

        if (!goToNext && recreateIssueWords === requestText) {
          const date = new Date();
          const newIssue = {
            lastUpdatedDate: date,
            messenger: messenger.name,
            openDate: date,
            senderId,
            status: Status.OPEN,
            uni,
          };
          workingIssue.status = Status.CLOSED;
          workingIssue.closedDate = date;
          workingIssue.lastUpdatedDate = date;
          await issueRepository.save(workingIssue);
          context.issue = await issueRepository.create(newIssue);
          if (!isNil(requestMessage)) {
            await updateLog(messageRepository, requestMessage, workingIssue);
          }
          goToNext = true;
        }

        if (
          !goToNext &&
          !isNil(commandNameConfig) &&
          !isNil(timeGapConfig) &&
          timeGap >= (timeGapConfig.value as number)
        ) {
          const commandName = commandNameConfig.value as string;
          context.commands = context.commands.clear().push({
            attributes: Map<string, any>(),
            botResponses: List<Response>(),
            features: Map<string, string>(),
            name: commandName,
            processedFeatures: Map<string, any>(),
          });

          if (!isNil(requestMessage)) {
            requestMessage.commands.push(commandName);
            context.requestMessage = (await messageRepository.save(requestMessage)) as RequestMessage;
          }

          goToNext = true;
        }

        if (!goToNext && !isNil(commandNameConfig)) {
          const commandName = commandNameConfig.value as string;
          goToNext = messages
            .filter(message => message.type === MessageType.REQUEST)
            .some(message => {
              if (!isNil(message.commands) && message.commands.indexOf(commandName) !== -1) {
                return true;
              }
              return false;
            });
        }

        if (goToNext) {
          await next();
        }
      }
    }

    // End of if issues.length === 0
  } else {
    await next();
  }
};

export default suspendAutoReplyMiddleware;
