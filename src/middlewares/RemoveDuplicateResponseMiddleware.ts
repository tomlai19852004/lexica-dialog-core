import { Set, Iterable } from 'immutable';
import { Middleware, BotResponse, ResponseType } from '../Api';

const removeDuplicateResponseMiddleware: Middleware = async (context, next) => {
  await next();
  const { responses } = context;
  if (responses.size > 1) {
    context.responses = responses
      .groupBy(res => JSON.stringify(res))
      .map((grouped: Iterable<number, BotResponse>) => grouped.first())
      .toList();
  }
};

export default removeDuplicateResponseMiddleware;
