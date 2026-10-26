export type EventMap = Record<string, unknown>;

export class UploadEventEmitter<Events extends EventMap = Record<string, unknown>> {
	private readonly listeners: { [K in keyof Events]?: Array<(data: Events[K]) => void> } = {};

	on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
		const existingListeners = this.listeners[event];
		if (existingListeners) {
			existingListeners.push(listener);
		} else {
			this.listeners[event] = [listener];
		}
	}

	off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
		const existingListeners = this.listeners[event];
		if (!existingListeners) {
			return;
		}
		const index = existingListeners.indexOf(listener);
		if (index !== -1) {
			existingListeners.splice(index, 1);
		}
	}

	emit<K extends keyof Events>(event: K, data: Events[K]): void {
		const existingListeners = this.listeners[event];
		if (existingListeners) {
			for (const listener of existingListeners) {
				listener(data);
			}
		}
	}

	removeAllListeners<K extends keyof Events>(event?: K): void {
		if (event) {
			delete this.listeners[event];
		} else {
			for (const key of Object.keys(this.listeners) as Array<keyof Events>) {
				delete this.listeners[key];
			}
		}
	}
}
