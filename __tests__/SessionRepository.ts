import { Map } from 'immutable';
import { Session, SessionRepository } from '../src/Api';

class InMemorySessionRepository implements SessionRepository {

  private storage = Map<string, Session>();

  public findByUniAndSenderId(uni: string, senderId: string): Promise<Session> {
    return Promise.resolve(this.storage.get(senderId));
  }
  public save(uni: string, senderId: string, session: Session, expireInMs: number): Promise<void> {
    this.storage = this.storage.set(senderId, session);
    return Promise.resolve();
  }

}

export { InMemorySessionRepository };
