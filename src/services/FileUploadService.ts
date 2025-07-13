import type { IGofileRepository } from "../interfaces/IGofileRepository.js";
import type {
	UploadResult,
	FileToUpload,
	MultipleUploadResult,
	UploadProgressResult,
} from "../types/index.js";
import { UploadProgressHandler } from "./UploadProgressHandler.js";

export class FileUploadService {
	constructor(private readonly repository: IGofileRepository) {}

	async uploadFile(
		file: Buffer,
		fileName: string,
		token: string,
		parentFolderId: string,
		isPublic: boolean = true
	): Promise<UploadResult> {
		try {
			const folderResponse = await this.repository.createFolder({
				token,
				parentFolderId: parentFolderId,
				public: isPublic,
			});
			const folderId = folderResponse.data.id;

			const uploadResponse = await this.repository.uploadFile({
				token,
				folderId,
				file,
				fileName,
			});

			return {
				success: true,
				downloadPage: uploadResponse.data.downloadPage,
				fileId: uploadResponse.data.id,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	}

	/**
	 * Upload multiple files to a new folder with authentication
	 */
	async uploadMultipleFiles(
		files: FileToUpload[],
		token: string,
		parentFolderId: string,
		isPublic: boolean = true
	): Promise<MultipleUploadResult> {
		try {
			const folderResponse = await this.repository.createFolder({
				token,
				parentFolderId: parentFolderId,
				public: isPublic,
			});
			const folderId = folderResponse.data.id;

			const results: UploadResult[] = [];

			for (const fileToUpload of files) {
				try {
					const uploadResponse = await this.repository.uploadFile({
						token,
						folderId,
						file: fileToUpload.file,
						fileName: fileToUpload.fileName,
					});

					results.push({
						success: true,
						downloadPage: uploadResponse.data.downloadPage,
						fileId: uploadResponse.data.id,
					});
				} catch (error) {
					results.push({
						success: false,
						error: error instanceof Error ? error.message : "Unknown error occurred",
					});
				}
			}

			const successCount = results.filter((r) => r.success).length;
			const allSuccess = successCount === files.length;

			return {
				success: allSuccess,
				results,
				folderId,
				downloadPage: folderResponse.data.code
					? `https://gofile.io/d/${folderResponse.data.code}`
					: undefined,
				error: allSuccess
					? undefined
					: `${successCount}/${files.length} files uploaded successfully`,
			};
		} catch (error) {
			return {
				success: false,
				results: [],
				error: error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	}

	/**
	 * Upload files with progress events (replaces uploadMultipleFiles)
	 */
	uploadFiles(
		files: FileToUpload[],
		token: string,
		parentFolderId: string,
		isPublic: boolean = true
	): UploadProgressResult {
		return new UploadProgressHandler(this.repository, files, token, parentFolderId, isPublic);
	}
}
