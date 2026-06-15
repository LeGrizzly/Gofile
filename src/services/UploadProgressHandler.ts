import { UploadEventEmitter } from "../utils/EventEmitter.js";
import type {
	UploadProgress,
	MultipleUploadResult,
	FileToUpload,
	UploadResult,
	UploadProgressResult,
} from "../types/index.js";
import type { IGofileRepository } from "../interfaces/IGofileRepository.js";

type UploadProgressEvents = {
	uploadProgress: UploadProgress;
	done: MultipleUploadResult;
};

export class UploadProgressHandler
	extends UploadEventEmitter<UploadProgressEvents>
	implements UploadProgressResult
{
	private repository: IGofileRepository;
	private files: FileToUpload[];
	private token: string;
	private parentFolderId: string;
	private isPublic: boolean;
	private createSubfolder: boolean;

	on<K extends keyof UploadProgressEvents>(
		event: K,
		listener: (data: UploadProgressEvents[K]) => void
	): void {
		super.on(event, listener);
	}

	constructor(
		repository: IGofileRepository,
		files: FileToUpload[],
		token: string,
		parentFolderId: string,
		isPublic: boolean = true,
		createSubfolder: boolean = true
	) {
		super();
		this.repository = repository;
		this.files = files;
		this.token = token;
		this.parentFolderId = parentFolderId;
		this.isPublic = isPublic;
		this.createSubfolder = createSubfolder;

		this.startUpload();
	}

	private async startUpload(): Promise<void> {
		try {
			let folderId = this.parentFolderId;
			let folderCode: string | undefined;

			if (this.createSubfolder) {
				const folderResponse = await this.repository.createFolder({
					token: this.token,
					parentFolderId: this.parentFolderId,
					public: this.isPublic,
				});
				folderId = folderResponse.data.id;
				folderCode = folderResponse.data.code;
			}

			const results: UploadResult[] = [];

			for (let i = 0; i < this.files.length; i++) {
				const fileToUpload = this.files[i];

				this.emit("uploadProgress", {
					currentFile: i + 1,
					totalFiles: this.files.length,
					fileName: fileToUpload.fileName,
					completed: false,
				} as UploadProgress);

				try {
					const uploadResponse = await this.repository.uploadFile({
						token: this.token,
						folderId,
						file: fileToUpload.file,
						fileName: fileToUpload.fileName,
					});

					if (!folderCode && !this.createSubfolder) {
						folderCode = uploadResponse.data.parentFolderCode;
					}

					const result: UploadResult = {
						success: true,
						downloadPage: uploadResponse.data.downloadPage,
						fileId: uploadResponse.data.id,
					};

					results.push(result);

					this.emit("uploadProgress", {
						currentFile: i + 1,
						totalFiles: this.files.length,
						fileName: fileToUpload.fileName,
						completed: true,
						success: true,
						downloadPage: result.downloadPage,
						fileId: result.fileId,
					} as UploadProgress);
				} catch (error) {
					const result: UploadResult = {
						success: false,
						error: error instanceof Error ? error.message : "Unknown error occurred",
					};

					results.push(result);

					this.emit("uploadProgress", {
						currentFile: i + 1,
						totalFiles: this.files.length,
						fileName: fileToUpload.fileName,
						completed: true,
						success: false,
						error: result.error,
					} as UploadProgress);
				}
			}

			const successCount = results.filter((r) => r.success).length;
			const allSuccess = successCount === this.files.length;

			const finalResult: MultipleUploadResult = {
				success: allSuccess,
				results,
				folderId,
				downloadPage: folderCode ? `https://gofile.io/d/${folderCode}` : undefined,
				error: allSuccess
					? undefined
					: `${successCount}/${this.files.length} files uploaded successfully`,
			};

			this.emit("done", finalResult);
		} catch (error) {
			const finalResult: MultipleUploadResult = {
				success: false,
				results: [],
				error: error instanceof Error ? error.message : "Unknown error occurred",
			};

			this.emit("done", finalResult);
		}
	}
}
