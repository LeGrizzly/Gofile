import type { IGofileRepository } from "../interfaces/IGofileRepository.js";
import type {
	AccountResponse,
	CreateFolderRequest,
	CreateFolderResponse,
	GofileConfig,
	UpdateContentRequest,
	UpdateContentResponse,
	UploadFileRequest,
	UploadFileResponse,
} from "../types/index.js";

export class GofileRepository implements IGofileRepository {
	private readonly config: GofileConfig & { baseUrl: string; uploadUrl: string };

	constructor(config: GofileConfig) {
		this.config = {
			...config,
			baseUrl: config.baseUrl ?? "https://api.gofile.io",
			uploadUrl: config.uploadUrl ?? "https://upload.gofile.io",
		};
	}

	async createFolder(request: CreateFolderRequest): Promise<CreateFolderResponse> {
		console.log("Creating folder with request:", {
			parentFolderId: request.parentFolderId,
			public: request.public,
			token: request.token,
		});

		const url = `${this.config.baseUrl}/contents/createfolder`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${request.token}`,
			},
			body: JSON.stringify({
				parentFolderId: request.parentFolderId,
				public: request.public,
			}),
			signal: AbortSignal.timeout(15000),
		});

		console.log("Create folder response status:", response.status);

		if (!response.ok) {
			throw new Error(`Failed to create folder: ${response.status} ${response.statusText}`);
		}

		const result = (await response.json()) as CreateFolderResponse;

		if (result.status !== "ok") {
			throw new Error(`API error: ${result.status}`);
		}

		return result;
	}

	async uploadFile(request: UploadFileRequest): Promise<UploadFileResponse> {
		const url = `${this.config.uploadUrl}/uploadfile`;

		const formData = new FormData();
		formData.append("token", request.token);
		formData.append("folderId", request.folderId);

		let arrayBuffer: ArrayBuffer | undefined;
		if (request.file.buffer instanceof ArrayBuffer) {
			arrayBuffer = request.file.buffer;
		} else if (
			typeof SharedArrayBuffer !== "undefined" &&
			request.file.buffer instanceof SharedArrayBuffer
		) {
			// Convert SharedArrayBuffer to ArrayBuffer
			const shared = new Uint8Array(request.file.buffer);
			arrayBuffer = new Uint8Array(shared).buffer.slice(0);
		} else {
			arrayBuffer = undefined;
		}
		if (!arrayBuffer) {
			throw new Error("Unsupported buffer type for file upload.");
		}
		const blob = new Blob([new Uint8Array(arrayBuffer)]);
		formData.append("file", blob, request.fileName);

		const response = await fetch(url, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
		}

		const result = (await response.json()) as UploadFileResponse;

		if (result.status !== "ok") {
			throw new Error(`API error: ${result.status}`);
		}

		return result;
	}

	async getAuthenticatedAccount(): Promise<AccountResponse> {
		const url = `${this.config.baseUrl}/accounts`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			signal: AbortSignal.timeout(15000),
		});

		console.log("Account authentication response status:", response.status);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Authentication error response:", errorText);
			throw new Error(
				`Failed to authenticate: ${response.status} ${response.statusText} - ${errorText}`
			);
		}

		const result = (await response.json()) as AccountResponse;

		if (result.status !== "ok") {
			throw new Error(`Authentication API error: ${result.status}`);
		}

		return result;
	}
	async updateContent(request: UpdateContentRequest): Promise<UpdateContentResponse> {
		const baseUrl = this.config.baseUrl || "https://api.gofile.io";
		const url = `${baseUrl}/contents/${request.contentId}/update`;

		const body: any = {
			attribute: request.attribute,
			attributeValue: request.attributeValue,
		};

		if (request.recursive !== undefined) {
			body.recursive = request.recursive;
		}

		const response = await fetch(url, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${request.token}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(body),
		});

		const data = (await response.json()) as UpdateContentResponse;
		if (data.status !== "ok") {
			throw new Error(`Gofile API Error: ${data.status}`);
		}

		return data;
	}
}
