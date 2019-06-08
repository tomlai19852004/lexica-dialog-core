import { isNil, defaultTo } from 'lodash';
import { Map } from 'immutable';
import { Middleware } from '../Api';

const intentPreProcessorMiddleware: Middleware = async (context, next) => {
  const { request, commands, preProcessors, uni, uniConfigs, messenger, issue, senderInfo } = context;
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
    const commandPromises = commands.toArray().map(async command => {
      const { intent, features } = command;
      let processedFeatures = defaultTo(features, Map<string, string>());
      if (!isNil(intent) && !isNil(intent.preProcessors)) {
        const intentPreProcessors = intent.preProcessors
          .filter(preProcessorName => preProcessors.has(preProcessorName))
          .map(preProcessorName => preProcessors.get(preProcessorName));
        for (const preProcessor of intentPreProcessors) {
          processedFeatures = processedFeatures.merge(await preProcessor(processorContext, processedFeatures));
        }
        command.features = processedFeatures;
      }
    });
    await Promise.all(commandPromises);
  }
  await next();
};

export default intentPreProcessorMiddleware;
