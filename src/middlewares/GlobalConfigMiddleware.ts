import { Middleware } from '../Api';
import { toConfigMap } from '../Utils';
import { Config } from 'lexica-dialog-model/dist/Config';

const globalConfigMiddleware: Middleware = async (context, next) => {
	const uni = 'GLOBAL';
	const { configRepository } = context;
	const configs = await configRepository.findByUni(uni);
	context.uniConfigs = context.uniConfigs.merge(toConfigMap(configs));
	await next();
};

export default globalConfigMiddleware;
