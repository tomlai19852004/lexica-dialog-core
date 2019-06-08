import { isNil, defaultTo } from 'lodash';
import { Map } from 'immutable';
import { Middleware } from '../Api';

const intentPostProcessorMiddleware: Middleware = async (context, next) => {
  const {
    request,
    commands,
    postProcessors,
    uni,
    uniConfigs,
    messenger,
    issue,
    senderInfo,
  } = context;
  if (!isNil(request)) {
    const { locale, senderId } = request;
    const processorContext = {
      issue,
      locale,
      messengerName: messenger.name,
      senderId,
      senderInfo,
      uni,
      uniConfigs,
    };
    const commandPromises = commands.toArray().map(async (command) => {
      const { intent, features } = command;
      let processedFeatures = defaultTo(features, Map<string, any>());
      if (!isNil(intent) && !isNil(intent.postProcessors)) {
        const intentPostProcessors = intent.postProcessors
          .filter(postProcessorName => postProcessors.has(postProcessorName))
          .map(postProcessorName => postProcessors.get(postProcessorName));
        for (const postProcessor of intentPostProcessors) {
          processedFeatures = processedFeatures.merge(
            await postProcessor(processorContext, processedFeatures));
        }
      }
      command.processedFeatures = processedFeatures;
    });
    await Promise.all(commandPromises);
  }
  await next();
};

export default intentPostProcessorMiddleware;
