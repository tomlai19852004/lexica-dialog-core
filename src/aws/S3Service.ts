import * as https from 'https';
import * as http from 'http';
import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';
import { isString } from 'lodash';
import { File, FileService } from '../Api';

// type S3Params = {
// 	apiVersion: string;
// 	bucket: string;
// };

interface S3Params {
  apiVersion: string;
  bucket: string;
}

class S3Service implements FileService {
  private s3: AWS.S3;

  constructor(private s3Params: S3Params) {
    this.s3 = new AWS.S3({
      apiVersion: s3Params.apiVersion,
    });
  }

  public copy(path: string): Promise<File> {
    return new Promise((resolve, reject) => {
      if (path.startsWith('http') || path.startsWith('https')) {
        const s3Key = uuid.v4();
        const get = path.startsWith('https') ? https.get : http.get;
        get(path, async res => {
          try {
            const headerContentType = res.headers['content-type'];
            const contentType = isString(headerContentType) ? headerContentType : 'application/octet-stream';
            await this.s3
              .upload({
                Body: res,
                Bucket: this.s3Params.bucket,
                ContentType: contentType,
                Key: s3Key,
              })
              .promise();
            resolve({
              contentType,
              path: s3Key,
            });
          } catch (error) {
            reject(error);
          }
        }).on('error', error => reject(error));
      } else {
        reject(new Error('Unsupported path for copy file: ' + path));
      }
    });
  }
}

export { S3Params, S3Service };

export default S3Service;
