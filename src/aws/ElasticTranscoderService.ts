import * as AWS from 'aws-sdk';
import { isNil } from 'lodash';
import {
	File,
	TranscodeService,
	AwsTranscoderConfig,
	AwsTranscoderTypeConfig,
} from '../Api';

class ElasticTranscoderService implements TranscodeService {

	private transcoder: AWS.ElasticTranscoder;

	constructor(
		private config: AwsTranscoderConfig) {
		this.transcoder = new AWS.ElasticTranscoder({
			apiVersion: config.apiVersion,
		});
	}

	public transcodeAudio(source: File): Promise<File> {
		return this.transcode(source, this.config.audio);
	}

	public transcodeVideo(source: File): Promise<File> {
		return this.transcode(source, this.config.video);
	}

	public async transcode(source: File, typeConfig: AwsTranscoderTypeConfig): Promise<File> {
		const preset = typeConfig.preset;
		const file = {
			contentType: preset.contentType,
			path: `${source.path}${preset.suffix}`,
		};
		const params = {
			Input: {
				Key: source.path,
			},
			Outputs: [{
				Key: file.path,
				PresetId: preset.id,
			}],
			PipelineId: typeConfig.pipelineId,
		};

		const data = await this.transcoder.createJob(params).promise();

		if (!isNil(data.Job) && !isNil(data.Job.Id)) {
			const jobId = data.Job.Id;
			let attempts = 0;

			while (attempts < this.config.maxAttempts) {
				const jobResp = await this.transcoder.readJob({ Id: jobId }).promise();

				if (!isNil(jobResp.Job)) {
					if (jobResp.Job.Status === 'Complete') {
						return file;
					}

					if (jobResp.Job.Status === 'Canceled') {
						throw new Error(`Transcoder job canceled. ID: ${jobId}`);
					}

					if (jobResp.Job.Status === 'Error') {
						throw new Error(`Transcoder job occur error. ID: ${jobId}`);
					}
				}

				attempts += 1;
				await new Promise(resolve => setTimeout(resolve, this.config.delay));
			}

			throw new Error(`Transcoder job over max attempts. ID: ${jobId}`);
		}

		throw new Error('AWS transcoder return empty Job or Job ID');
	}

}

export {
	ElasticTranscoderService,
};

export default ElasticTranscoderService;
