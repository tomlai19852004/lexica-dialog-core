import { Map } from 'immutable';
import { PreProcessor } from '../src/Api';

const currentDatePreprocessor: PreProcessor =
  async (context, features: Map<string, string>): Promise<Map<string, string>> => {
    if (!features.has('F_DATE')) {
      return features.set('F_DATE', Date.now().toString());
    }
    return features;
  };

const throwErrorPreprocessor: PreProcessor =
  async (context, features: Map<string, string>): Promise<Map<string, string>> => {
    throw new Error('throw error preprocessor');
  };

export {
  currentDatePreprocessor,
  throwErrorPreprocessor,
};
