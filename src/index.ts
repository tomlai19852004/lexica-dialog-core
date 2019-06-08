import { BotServerConfig } from './Api';
import BotServer from './BotServer';

export const createBotServer = (config: BotServerConfig) => new BotServer(config);
