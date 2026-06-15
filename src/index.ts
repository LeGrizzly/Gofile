import { GofileRepository } from "./repositories/GofileRepository.js";
import { FileUploadService } from "./services/FileUploadService.js";
import { ContentService } from "./services/ContentService.js";
import { GofileAuth } from "./GofileAuth.js";
import type {
	GofileConfig,
	UploadResult,
	FileToUpload,
	MultipleUploadResult,
	AuthenticatedConfig,
	UploadProgressResult,
} from "./types/index.js";

/**
 * Main API client for Gofile file uploads.
 * Requires injected account information.
 * Follows clean architecture principles with dependency injection.
 */
export class GofileAPI {
	private readonly fileUploadService: FileUploadService;
	private readonly contentService: ContentService;
	private readonly account: AuthenticatedConfig;
	private readonly config: GofileConfig;

	/**
	 * Initialize GofileAPI with an injected account
	 * @param account The account credentials (token, rootFolder)
	 * @param config Optional configuration like createSubfolder
	 */
	constructor(account: AuthenticatedConfig, config: GofileConfig = {}) {
		this.account = account;
		this.config = config;
		const repository = new GofileRepository(config);
		this.fileUploadService = new FileUploadService(repository);
		this.contentService = new ContentService(repository);
	}

	/**
	 * Upload a file
	 * @param file - File content as Buffer
	 * @param fileName - Name of the file
	 * @param isPublic - Whether the folder should be public (default: true)
	 * @returns Upload result with download page URL or error
	 */
	async uploadFile(
		file: Buffer,
		fileName: string,
		isPublic: boolean = true
	): Promise<UploadResult> {
		const createSubfolder = this.config.createSubfolder ?? true;

		return this.fileUploadService.uploadFile(
			file,
			fileName,
			this.account.token,
			this.account.rootFolder,
			isPublic,
			createSubfolder
		);
	}

	/**
	 * Upload multiple files
	 * @param files - Array of files to upload with their names
	 * @param isPublic - Whether the folder should be public (default: true)
	 * @returns Multiple upload result with individual results
	 */
	async uploadMultipleFiles(
		files: FileToUpload[],
		isPublic: boolean = true
	): Promise<MultipleUploadResult> {
		const createSubfolder = this.config.createSubfolder ?? true;

		return this.fileUploadService.uploadMultipleFiles(
			files,
			this.account.token,
			this.account.rootFolder,
			isPublic,
			createSubfolder
		);
	}

	/**
	 * Upload files with progress events
	 * @param files - Array of files to upload with their names
	 * @param isPublic - Whether the folder should be public (default: true)
	 * @returns Upload progress handler with events
	 */
	async uploadFiles(
		files: FileToUpload[],
		isPublic: boolean = true
	): Promise<UploadProgressResult> {
		const createSubfolder = this.config.createSubfolder ?? true;

		return this.fileUploadService.uploadFiles(
			files,
			this.account.token,
			this.account.rootFolder,
			isPublic,
			createSubfolder
		);
	}

	/**
	 * Set content public or private
	 * @param contentId Content ID (folder or file)
	 * @param isPublic true for public, false for private
	 * @param recursive apply to all children
	 */
	async setPublic(contentId: string, isPublic: boolean, recursive: boolean = true): Promise<boolean> {
		return this.contentService.setPublic(this.account.token, contentId, isPublic, recursive);
	}

	/**
	 * Set content description (markdown supported)
	 * @param contentId Content ID
	 * @param description Markdown description
	 */
	async setDescription(contentId: string, description: string): Promise<boolean> {
		return this.contentService.setDescription(this.account.token, contentId, description);
	}

	/**
	 * Set content expiry
	 * @param contentId Content ID
	 * @param expiry Timestamp in seconds, or null for no expiry
	 */
	async setExpiry(contentId: string, expiry: number | null): Promise<boolean> {
		return this.contentService.setExpiry(this.account.token, contentId, expiry);
	}

	/**
	 * Set content tags
	 * @param contentId Content ID
	 * @param tags Array of tags
	 */
	async setTags(contentId: string, tags: string[]): Promise<boolean> {
		return this.contentService.setTags(this.account.token, contentId, tags);
	}

}

export { GofileAuth };

export type {
	GofileConfig,
	UploadResult,
	FileToUpload,
	MultipleUploadResult,
	AuthenticatedConfig,
	UploadProgressResult,
} from "./types/index.js";
