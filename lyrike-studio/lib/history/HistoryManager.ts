export type HistoryCommand<T> = {
  label: string;
  apply: (state: T) => T;
};

type HistoryEntry<T> = {
  label: string;
  before: T;
  after: T;
};

function cloneState<T>(state: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(state);
  }
  return JSON.parse(JSON.stringify(state)) as T;
}

export class HistoryManager<T> {
  private readonly past: HistoryEntry<T>[] = [];
  private readonly future: HistoryEntry<T>[] = [];

  execute(command: HistoryCommand<T>, current: T): T {
    const before = cloneState(current);
    const after = command.apply(cloneState(current));

    this.past.push({
      label: command.label,
      before,
      after: cloneState(after),
    });
    this.future.length = 0;
    return after;
  }

  undo(current: T): T {
    const entry = this.past.pop();
    if (!entry) {
      return current;
    }

    this.future.push({
      label: entry.label,
      before: cloneState(entry.before),
      after: cloneState(entry.after),
    });
    return cloneState(entry.before);
  }

  redo(current: T): T {
    const entry = this.future.pop();
    if (!entry) {
      return current;
    }

    this.past.push({
      label: entry.label,
      before: cloneState(entry.before),
      after: cloneState(entry.after),
    });
    return cloneState(entry.after);
  }

  clear(): void {
    this.past.length = 0;
    this.future.length = 0;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }
}
