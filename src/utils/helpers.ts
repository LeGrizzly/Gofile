/**
 * Utility functions for file operations and validation
 */

export function validateFileName(fileName: string): boolean {
	if (!fileName || fileName.trim().length === 0) {
		return false;
	}

	const invalidChars = /[<>:"/\\|?*]/;
	return !invalidChars.test(fileName);
}

export function validateToken(token: string): boolean {
	return !!(token && token.trim().length > 0);
}

export function getFileExtension(fileName: string): string {
	const lastDot = fileName.lastIndexOf(".");
	return lastDot !== -1 ? fileName.slice(lastDot + 1).toLowerCase() : "";
}

export function formatFileSize(bytes: number): string {
	const units = ["B", "KB", "MB", "GB"];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function createFormData(data: Record<string, string | Blob>): FormData {
	const formData = new FormData();

	for (const [key, value] of Object.entries(data)) {
		formData.append(key, value);
	}

	return formData;
}
