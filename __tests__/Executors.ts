import { List } from 'immutable';
import { Executor, ResponseType, ItemType, BotResponse } from '../src/Api';

const searchBookExecutor: Executor = async (context) => {
  const { command } = context;
  const response: BotResponse = {
    items: [{
      message: 'book1',
      type: ItemType.IMAGE,
      url: 'http://lexica.io/book1',
    }, {
      message: 'book2',
      type: ItemType.IMAGE,
      url: 'http://lexica.io/book2',
    }],
    message: 'Books',
    type: ResponseType.ITEMS,
  };
  command.botResponses = List([response]);
};

export { searchBookExecutor };
