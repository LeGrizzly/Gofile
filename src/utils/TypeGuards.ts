import type { UploadFileInput } from "../types/index.js";

/**
 * Type guard checking if the value is a Blob or Blob-like object.
 */
export function isBlob(value: unknown): value is Blob {
	return (
		value instanceof Blob ||
		(typeof value === "object" &&
			value !== null &&
			"size" in value &&
			typeof (value as { size: unknown }).size === "number" &&
			"stream" in value &&
			typeof (value as { stream: unknown }).stream === "function")
	);
}

/**
 * Type guard checking if the value is a Buffer or Uint8Array.
 */
export function isBufferOrUint8Array(value: unknown): value is Buffer | Uint8Array {
	return Buffer.isBuffer(value) || value instanceof Uint8Array;
}

/**
 * Type guard checking if the value is a ReadableStream.
 */
export function isReadableStream(value: unknown): value is ReadableStream {
	return (
		typeof value === "object" &&
		value !== null &&
		"getReader" in value &&
		typeof (value as { getReader: unknown }).getReader === "function"
	);
}

/**
 * Type guard checking if the value is a Node.js ReadableStream.
 */
export function isNodeReadableStream(value: unknown): value is NodeJS.ReadableStream {
	return (
		typeof value === "object" &&
		value !== null &&
		"pipe" in value &&
		typeof (value as { pipe: unknown }).pipe === "function" &&
		"on" in value &&
		typeof (value as { on: unknown }).on === "function"
	);
}

/**
 * Type guard checking if the value is a valid UploadFileInput.
 */
export function isUploadFileInput(value: unknown): value is UploadFileInput {
	return (
		isBlob(value) ||
		isBufferOrUint8Array(value) ||
		isReadableStream(value) ||
		isNodeReadableStream(value)
	);
}

/**
 * Safely extracts an error message from an unknown error.
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return String(error);
}

/**
 * Normalizes an unknown error into a standard Error instance without casting.
 */
export function toError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}
	return new Error(getErrorMessage(error));
}

/**
 * Asynchronously converts any supported UploadFileInput into a Blob without any 'as any' casts.
 */
export async function toBlob(file: UploadFileInput): Promise<Blob> {
	if (isBlob(file)) {
		return file;
	}
	if (isBufferOrUint8Array(file)) {
		const bufferCopy = new Uint8Array(file);
		return new Blob([bufferCopy]);
	}
	if (isReadableStream(file)) {
		return await new Response(file).blob();
	}
	if (isNodeReadableStream(file)) {
		const chunks: Uint8Array[] = [];
		for await (const chunk of file) {
			chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Uint8Array));
		}
		const combined = Buffer.concat(chunks);
		const copy = new Uint8Array(combined.length);
		copy.set(combined);
		return new Blob([copy.buffer]);
	}
	throw new TypeError(
		"Unsupported file type for upload. Expected Blob, Buffer, Uint8Array, or ReadableStream."
	);
}
