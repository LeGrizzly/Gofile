import type { IGofileRepository } from "../interfaces/IGofileRepository.js";
import type {
	FileToUpload,
	MultipleUploadResult,
	UploadProgressResult,
	UploadResult,
} from "../types/index.js";
import { UploadProgressHandler } from "./UploadProgressHandler.js";

export class FileUploadService {
	constructor(private readonly repository: IGofileRepository) {}

	async uploadFile(
		file: Buffer,
		fileName: string,
		token: string,
		parentFolderId: string,
		isPublic: boolean = true,
		createSubfolder: boolean = true
	): Promise<UploadResult> {
		try {
			let folderId = parentFolderId;
			if (createSubfolder) {
				const folderResponse = await this.repository.createFolder({
					token,
					parentFolderId: parentFolderId,
					public: isPublic,
				});
				folderId = folderResponse.data.id;
			}

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
		isPublic: boolean = true,
		createSubfolder: boolean = true
	): Promise<MultipleUploadResult> {
		try {
			let folderId = parentFolderId;
			let folderCode: string | undefined;

			if (createSubfolder) {
				const folderResponse = await this.repository.createFolder({
					token,
					parentFolderId: parentFolderId,
					public: isPublic,
				});
				folderId = folderResponse.data.id;
				folderCode = folderResponse.data.code;
			}

			const results: UploadResult[] = [];

			for (const fileToUpload of files) {
				try {
					const uploadResponse = await this.repository.uploadFile({
						token,
						folderId,
						file: fileToUpload.file,
						fileName: fileToUpload.fileName,
					});

					if (!folderCode && !createSubfolder) {
						folderCode = uploadResponse.data.parentFolderCode;
					}

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
				downloadPage: folderCode ? `https://gofile.io/d/${folderCode}` : undefined,
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
		isPublic: boolean = true,
		createSubfolder: boolean = true
	): UploadProgressResult {
		return new UploadProgressHandler(
			this.repository,
			files,
			token,
			parentFolderId,
			isPublic,
			createSubfolder
		);
	}
}
