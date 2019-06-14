import { Middleware } from '../Api';
import { toConfigMap } from '../Utils';
import { Config } from 'lexica-dialog-model/dist/Config';

// Global configuration that aree applied to all virtual dialog agent
// This systeem is designed to allow multiple dialog agents.
// E.g. An agent serving Company A and another one for Company B.

const globalConfigMiddleware: Middleware = async (context, next) => {
	const uni = 'GLOBAL';
	const { configRepository } = context;
	const configs = await configRepository.findByUni(uni);
	context.uniConfigs = context.uniConfigs.merge(toConfigMap(configs));
	await next();
};

export default globalConfigMiddleware;
