import { isNil } from 'lodash';
import { PreProcessor } from '../Api';

const senderNamePreProcessor: PreProcessor = async (context, features) => {
	const { senderInfo } = context;

	let firstName = '';
	let lastName = '';

	if (!isNil(senderInfo)) {
		firstName = senderInfo.firstName;
		lastName = senderInfo.lastName;
	}
	return features
		.set('SENDER_FIRST_NAME', firstName)
		.set('SENDER_LAST_NAME', lastName)
		.set('SENDER_NAME', `${firstName} ${lastName}`.trim());
};

export default senderNamePreProcessor;
