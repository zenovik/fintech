import { AiChatMessage } from '../providers/ai-provider.interface';

const sessionHistory = new Map<number, AiChatMessage[]>();

export class AiSessionStore {
  getHistory(sessionId: number): AiChatMessage[] {
    return sessionHistory.get(sessionId) ?? [];
  }

  append(sessionId: number, message: AiChatMessage): void {
    const history = this.getHistory(sessionId);
    history.push(message);
    sessionHistory.set(sessionId, history);
  }

  popLast(sessionId: number): void {
    const history = this.getHistory(sessionId);
    if (history.length) history.pop();
    sessionHistory.set(sessionId, history);
  }

  clear(sessionId: number): void {
    sessionHistory.delete(sessionId);
  }
}

export const aiSessionStore = new AiSessionStore();
