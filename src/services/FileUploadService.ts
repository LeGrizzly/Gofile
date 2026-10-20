import type { IGofileRepository } from "../interfaces/IGofileRepository.js";
import type {
	FileToUpload,
	MultipleUploadResult,
	UploadFileInput,
	UploadProgressResult,
	UploadResult,
} from "../types/index.js";
import { getErrorMessage } from "../utils/TypeGuards.js";
import { UploadProgressHandler } from "./UploadProgressHandler.js";

export class FileUploadService {
	constructor(private readonly repository: IGofileRepository) {}

	async uploadFile(
		file: UploadFileInput,
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
				fileName,
				downloadPage: uploadResponse.data.downloadPage,
				fileId: uploadResponse.data.id,
				folderId: uploadResponse.data.parentFolder,
				parentFolder: uploadResponse.data.parentFolder,
			};
		} catch (error) {
			return {
				success: false,
				fileName,
				error: getErrorMessage(error),
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
						fileName: fileToUpload.fileName,
						downloadPage: uploadResponse.data.downloadPage,
						fileId: uploadResponse.data.id,
						folderId: uploadResponse.data.parentFolder,
						parentFolder: uploadResponse.data.parentFolder,
					});
				} catch (error) {
					results.push({
						success: false,
						fileName: fileToUpload.fileName,
						error: getErrorMessage(error),
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
				error: getErrorMessage(error),
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
