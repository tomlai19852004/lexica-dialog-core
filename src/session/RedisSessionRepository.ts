import { isNil } from 'lodash';
import { RedisClient } from 'redis';
import { Session, SessionRepository } from '../Api';

class RedisSessionRepository implements SessionRepository {

  constructor(private client: RedisClient) { }

  public findByUniAndSenderId(uni: string, senderId: string): Promise<Session> {
    return new Promise<Session>((resolve, reject) => {
      const key = this.createKey(uni, senderId);
      this.client.get(key, (err, value) => {
        if (isNil(err)) {
          resolve(JSON.parse(value));
        } else {
          reject(err);
        }
      });
    });
  }

  public save(uni: string, senderId: string, session: Session, expireInMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      /**
       * EX seconds -- Set the specified expire time, in seconds.
       * PX milliseconds -- Set the specified expire time, in milliseconds.
       * NX -- Only set the key if it does not already exist.
       * XX -- Only set the key if it already exist.
       */
      const key = this.createKey(uni, senderId);
      this.client.set(key, JSON.stringify(session), 'PX', expireInMs, (err, value) => {
        if (isNil(err)) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  protected createKey(uni: string, senderId: string): string {
    return `${uni}_${senderId}`;
  }

}

export default RedisSessionRepository;
