import type { IGofileRepository } from "../interfaces/IGofileRepository.js";
import type {
	AccountResponse,
	CreateFolderRequest,
	CreateFolderResponse,
	GofileConfig,
	GofileServersResponse,
	UpdateContentBody,
	UpdateContentRequest,
	UpdateContentResponse,
	UploadFileRequest,
	UploadFileResponse,
} from "../types/index.js";
import { toBlob, toError } from "../utils/TypeGuards.js";

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

	private static cachedBestServer: { name: string; expiresAt: number } | null = null;

	private async getBestServer(): Promise<string> {
		if (
			GofileRepository.cachedBestServer &&
			Date.now() < GofileRepository.cachedBestServer.expiresAt
		) {
			return GofileRepository.cachedBestServer.name;
		}

		try {
			const response = await fetch(`${this.config.baseUrl}/servers`, {
				signal: AbortSignal.timeout(4000),
			});
			if (response.ok) {
				const result = (await response.json()) as GofileServersResponse;
				if (
					result.status === "ok" &&
					Array.isArray(result.data?.servers) &&
					result.data.servers.length > 0
				) {
					const best = result.data.servers[0].name;
					GofileRepository.cachedBestServer = {
						name: best,
						expiresAt: Date.now() + 10 * 60 * 1000,
					};
					return best;
				}
			}
		} catch (error) {
			console.warn(
				"[GofileRepository] Failed to query optimal server from /servers API, using fallback",
				error
			);
		}

		return "";
	}

	async uploadFile(request: UploadFileRequest): Promise<UploadFileResponse> {
		let uploadBase = this.config.uploadUrl;
		if (uploadBase === "https://upload.gofile.io") {
			const best = await this.getBestServer();
			if (best) {
				uploadBase = `https://${best}.gofile.io/contents`;
			}
		}
		const url = `${uploadBase}/uploadfile`;
		const maxRetries = 3;
		let lastError: unknown = new Error("Upload failed with unknown error");

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const formData = new FormData();
				formData.append("token", request.token);
				formData.append("folderId", request.folderId);

				const blob = await toBlob(request.file);
				formData.append("file", blob, request.fileName);

				const response = await fetch(url, {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					throw new Error(
						`Failed to upload file: ${response.status} ${response.statusText}`
					);
				}

				const result = (await response.json()) as UploadFileResponse;

				if (result.status !== "ok") {
					throw new Error(`API error: ${result.status}`);
				}

				return result;
			} catch (error) {
				lastError = error;
				if (attempt < maxRetries) {
					const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
					console.warn(
						`[GofileRepository] Upload failed for ${request.fileName} (attempt ${attempt}/${maxRetries}): ${error instanceof Error ? error.message : String(error)}. Retrying in ${delay}ms...`
					);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		throw toError(lastError);
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

		const body: UpdateContentBody = {
			attribute: request.attribute,
			attributeValue: request.attributeValue,
			...(request.recursive !== undefined ? { recursive: request.recursive } : {}),
		};

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
