import { Map } from 'immutable';
import { PostProcessor } from '../src/Api';

const toDatePostProcessor: PostProcessor =
  async (context, features: Map<string, any>): Promise<Map<string, any>> => {
    return features.map((value, key) => {
      if (key.match(/date/i)) {
        return new Date(parseInt(value, 10));
      }
      return value;
    }).toMap();
  };

export { toDatePostProcessor };
