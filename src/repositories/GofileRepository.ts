import http from "node:http";
import https from "node:https";
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
import {
	isBlob,
	isBufferOrUint8Array,
	isNodeReadableStream,
	isReadableStream,
	toError,
} from "../utils/TypeGuards.js";

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
			// Requêter en priorité la zone européenne (Paris)
			const response = await fetch(`${this.config.baseUrl}/servers?zone=eu`, {
				signal: AbortSignal.timeout(4000),
			});
			if (response.ok) {
				const result = (await response.json()) as GofileServersResponse;
				if (
					result.status === "ok" &&
					Array.isArray(result.data?.servers) &&
					result.data.servers.length > 0
				) {
					const euServer = result.data.servers.find((s) => s.zone === "eu");
					const best = euServer?.name || result.data.servers[0].name;
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

	/**
	 * Téléverse un fichier en streaming réel multipart/form-data via node:https/http
	 * Permet le suivi en temps réel des octets émis et évite de saturer la RAM.
	 */
	private async streamUpload(
		targetUrl: string,
		request: UploadFileRequest
	): Promise<UploadFileResponse> {
		const urlObj = new URL(targetUrl);
		const boundary = `----LeakRapBoundary${Math.random().toString(36).substring(2)}`;

		let fileSize = request.fileSize;
		if (typeof fileSize !== "number" || fileSize <= 0) {
			if (isBlob(request.file)) {
				fileSize = request.file.size;
			} else if (isBufferOrUint8Array(request.file)) {
				fileSize = request.file.length;
			}
		}

		const prefix = Buffer.from(
			`--${boundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${request.token}\r\n` +
				`--${boundary}\r\nContent-Disposition: form-data; name="folderId"\r\n\r\n${request.folderId}\r\n` +
				`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${request.fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`
		);
		const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);

		return new Promise<UploadFileResponse>((resolve, reject) => {
			const headers: Record<string, string | number> = {
				"Content-Type": `multipart/form-data; boundary=${boundary}`,
			};

			if (typeof fileSize === "number" && fileSize >= 0) {
				headers["Content-Length"] = prefix.length + fileSize + suffix.length;
			}

			const client = urlObj.protocol === "http:" ? http : https;
			const req = client.request(urlObj, {
				method: "POST",
				headers,
			});

			let uploadedBytes = 0;
			const totalBytes = fileSize || 0;

			req.on("error", (err) => {
				reject(err);
			});

			req.on("response", (res) => {
				let responseBody = "";
				res.on("data", (chunk) => {
					responseBody += chunk;
				});

				res.on("end", () => {
					if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
						reject(
							new Error(
								`Failed to upload file: ${res.statusCode} ${res.statusMessage || ""}`
							)
						);
						return;
					}

					try {
						const result = JSON.parse(responseBody) as UploadFileResponse;
						if (result.status !== "ok") {
							reject(new Error(`API error: ${result.status}`));
							return;
						}
						resolve(result);
					} catch (parseErr) {
						reject(new Error(`Failed to parse Gofile response: ${parseErr}`));
					}
				});
			});

			// Écrire les en-têtes multipart
			req.write(prefix);

			const onChunk = (chunk: Uint8Array | Buffer) => {
				uploadedBytes += chunk.length;
				if (request.onProgress && totalBytes > 0) {
					request.onProgress(uploadedBytes, totalBytes);
				}
			};

			if (isNodeReadableStream(request.file)) {
				request.file.on("data", onChunk);
				request.file.on("end", () => {
					req.write(suffix);
					req.end();
				});
				request.file.on("error", (streamErr) => {
					req.destroy(streamErr);
					reject(streamErr);
				});
				request.file.pipe(req, { end: false });
			} else if (isBufferOrUint8Array(request.file)) {
				onChunk(request.file);
				req.write(request.file);
				req.write(suffix);
				req.end();
			} else if (isBlob(request.file)) {
				request.file
					.arrayBuffer()
					.then((buf) => {
						const uint8 = new Uint8Array(buf);
						onChunk(uint8);
						req.write(uint8);
						req.write(suffix);
						req.end();
					})
					.catch((err) => {
						req.destroy(err);
						reject(err);
					});
			} else if (isReadableStream(request.file)) {
				const reader = request.file.getReader();
				const readNext = () => {
					reader
						.read()
						.then(({ done, value }) => {
							if (done) {
								req.write(suffix);
								req.end();
							} else if (value) {
								onChunk(value);
								req.write(value);
								readNext();
							}
						})
						.catch((err) => {
							req.destroy(err);
							reject(err);
						});
				};
				readNext();
			} else {
				req.destroy();
				reject(new Error("Unsupported file input format"));
			}
		});
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
				return await this.streamUpload(url, request);
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
