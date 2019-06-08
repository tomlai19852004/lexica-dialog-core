import { isNil, isArray } from 'lodash';
import { Middleware, BotError, BotErrorCode } from '../Api';

const intentRequiredFeaturesMiddleware: Middleware = async (context, next) => {
  const { commands } = context;
  commands.toArray().forEach(command => {
    const { intent, features } = command;
    if (!isNil(intent)) {
      let hasAllRequiredKeys = true;

      if (isArray(intent.requiredFeatureKeys)) {
        hasAllRequiredKeys = intent.requiredFeatureKeys.every(key => features.has(key));
      }

      if (!hasAllRequiredKeys) {
        throw new BotError(BotErrorCode.MISSING_REQUIRED_FEATURE);
      }
    }
  });
  await next();
};

export default intentRequiredFeaturesMiddleware;
