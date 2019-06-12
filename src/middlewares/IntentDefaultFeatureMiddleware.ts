import { isNil, defaultTo } from 'lodash';
import { Map } from 'immutable';
import { Middleware } from '../Api';

const intentDefaultFeatureMiddleware: Middleware = async (context, next) => {
  const { sessionService, commands } = context;
  if (!isNil(sessionService)) {
    const memoriesFeatures = sessionService.getMemoriesFeatures();
    commands.toArray().forEach(command => {
      const { features, intent } = command;
      if (!isNil(intent) && !isNil(intent.defaultFeatures)) {
        const defaultFeatures = intent.defaultFeatures;
        let processedFeatures = defaultTo(features, Map<string, string>());
        processedFeatures = Object.keys(intent.defaultFeatures)
          .filter(key => !processedFeatures.has(key))
          .reduce((feature, key) => feature.set(key, defaultFeatures[key]), processedFeatures);
        command.features = processedFeatures;
      }
    });
  }
  await next();
};

export default intentDefaultFeatureMiddleware;
