import { Middleware } from '../Api';
import { toConfigMap } from '../Utils';
import { Config } from 'lexica-dialog-model/dist/Config';

// Configuration that is applied to one virtual dialog agent.
// If the system is used to serve only one agent then all config can be applied to GLOBAL

const uniConfigMiddleware: Middleware = async (context, next) => {
  const { uni, configRepository } = context;
  const configs = await configRepository.findByUni(uni);
  context.uniConfigs = context.uniConfigs.merge(toConfigMap(configs));
  await next();
};

export default uniConfigMiddleware;
