import { isNil } from 'lodash';
import { Map } from 'immutable';
import { Middleware } from '../Api';

const memoriesFeaturesMiddleware: Middleware = async (context, next) => {
  const { sessionService, commands } = context;
  if (!isNil(sessionService)) {
    const memoriesFeatures = sessionService.getMemoriesFeatures();
    commands.toArray().forEach((command) => {
      const { features } = command;
      if (!isNil(features)) {
        command.features = memoriesFeatures.merge(features);
      } else {
        command.features = memoriesFeatures;
      }
    });
  }
  await next();
  if (!isNil(sessionService)) {
    commands.toArray().forEach((command) => {
      const { intent, features } = command;
      if (!isNil(intent) && !isNil(features)) {
        sessionService.addMemory(intent, features);
      }
    });
  }
};

export default memoriesFeaturesMiddleware;
