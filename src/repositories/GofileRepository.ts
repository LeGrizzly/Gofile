import type {
	CreateFolderRequest,
	CreateFolderResponse,
	UploadFileRequest,
	UploadFileResponse,
	GofileConfig,
	AccountResponse,
} from "../types/index.js";
import type { IGofileRepository } from "../interfaces/IGofileRepository.js";

export class GofileRepository implements IGofileRepository {
	private readonly config: Required<GofileConfig>;

	constructor(config: GofileConfig) {
		this.config = {
			baseUrl: config.baseUrl ?? "https://api.gofile.io",
			uploadUrl: config.uploadUrl ?? "https://upload.gofile.io",
		};
	}

	async createFolder(request: CreateFolderRequest): Promise<CreateFolderResponse> {
		console.log("Creating folder with request:", {
			parentFolderId: request.parentFolderId,
			public: request.public,
			token: request.token.slice(0, 10) + "...",
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

		const blob = new Blob([request.file]);
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
}
