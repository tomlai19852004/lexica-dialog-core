import { Map } from 'immutable';
import { PostProcessor } from '../Api';

const datePostProcessor: PostProcessor = async (context, features) => {
	return features
		.map((value, key: string) => {
			if (key.search(/date/gi) !== -1) {
				return new Date(parseInt(value, 10));
			}
			return value;
		})
		.toMap();
};

export default datePostProcessor;
