export type EventMap = Record<string, unknown>;

export class UploadEventEmitter<Events extends EventMap = Record<string, unknown>> {
	private listeners: { [K in keyof Events]?: Array<(data: Events[K]) => void> } = {};

	on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event]!.push(listener);
	}

	emit<K extends keyof Events>(event: K, data: Events[K]): void {
		if (this.listeners[event]) {
			this.listeners[event]!.forEach((listener) => listener(data));
		}
	}
}
