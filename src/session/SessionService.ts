import { isNil, defaultTo } from 'lodash';
import { Map, List } from 'immutable';
import * as uuid from 'uuid';
import { Session, SessionRepository, SessionOption, SessionService } from '../Api';
import { Intent } from 'lexica-dialog-model/dist/Intent';

class DefaultSessionService implements SessionService {
  private session: Session;

  constructor(
    private sessionRepository: SessionRepository,
    private uni: string,
    private senderId: string,
    private expireInMs: number,
  ) {}

  public async init(): Promise<void> {
    if (isNil(this.session)) {
      await this.findOrCreate();
    }
  }

  public async save(): Promise<void> {
    this.session.memories = this.session.memories
      .map(memory => {
        memory.expire = memory.expire - 1;
        return memory;
      })
      .filter(memory => memory.expire > 0);
    if (!isNil(this.session.lastOptions)) {
      this.session.lastOptions = this.session.lastOptions.map(sessionOption => {
        sessionOption.liveCount += 1;
        return sessionOption;
      });
    }
    await this.sessionRepository.save(this.uni, this.senderId, this.session, this.expireInMs);
  }

  public getSessionId(): string {
    return this.session.id;
  }

  public addMemory(intent: Intent, features: Map<string, string>) {
    let expire = defaultTo(intent.sessionExpire, -1);
    expire = expire + 1;
    this.session.memories.push({
      expire,
      features: features.toObject(),
      intent,
    });
  }

  public getMemoriesFeatures(): Map<string, string> {
    return this.session.memories.reduce(
      (features, memory) => features.merge(Map(memory.features)),
      Map<string, string>(),
    );
  }

  public getIntentMemoryFeatures() {
    return List(
      this.session.memories.map(memory => ({
        command: memory.intent.command,
        features: memory.features,
      })),
    );
  }

  public startConversation(intent: Intent, features: Map<string, string>): void {
    if (this.hasConversation()) {
      throw new Error('Already in conversation');
    }
    this.session.conversation = {
      features: features.toObject(),
      intent,
    };
  }

  public hasConversation(): boolean {
    return !isNil(this.session.conversation);
  }

  public getConversationIntent(): Intent {
    if (isNil(this.session.conversation)) {
      throw new Error('No conversation');
    }
    return this.session.conversation.intent;
  }

  public getConversationFeatures(): Map<string, string> {
    if (isNil(this.session.conversation)) {
      throw new Error('No conversation');
    }
    return Map(this.session.conversation.features);
  }

  public updateConversationFeatures(features: Map<string, string>): void {
    if (isNil(this.session.conversation)) {
      throw new Error('No conversation');
    }
    this.session.conversation.features = features.toObject();
  }

  public endConversation(): void {
    delete this.session.conversation;
  }

  public setOptions(options: SessionOption[]): void {
    this.session.lastOptions = options;
  }

  public hasOptions(): boolean {
    return !isNil(this.session.lastOptions);
  }

  public getOptions(): SessionOption[] {
    if (isNil(this.session.lastOptions)) {
      throw new Error('No options');
    }
    return this.session.lastOptions;
  }

  public removeOptions(): void {
    delete this.session.lastOptions;
  }

  protected async findOrCreate(): Promise<void> {
    this.session = await this.sessionRepository.findByUniAndSenderId(this.uni, this.senderId);
    if (isNil(this.session)) {
      this.session = {
        id: uuid.v4(),
        memories: [],
      };
    }
  }
}

export default DefaultSessionService;
