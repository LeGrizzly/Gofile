import { GofileRepository } from "./repositories/GofileRepository.js";
import { FileUploadService } from "./services/FileUploadService.js";
import { AuthenticationService } from "./services/AuthenticationService.js";
import type {
	GofileConfig,
	UploadResult,
	FileToUpload,
	MultipleUploadResult,
	AuthenticatedConfig,
	UploadProgressResult,
} from "./types/index.js";

/**
 * Main API client for Gofile file uploads with automatic authentication
 * Follows clean architecture principles with dependency injection
 */
export class GofileAPI {
	private readonly fileUploadService: FileUploadService;
	private readonly authenticationService: AuthenticationService;
	private readonly config: GofileConfig;

	constructor(config: GofileConfig) {
		this.config = config;
		const repository = new GofileRepository(config);
		this.fileUploadService = new FileUploadService(repository);
		this.authenticationService = new AuthenticationService(repository);
	}

	/**
	 * Authenticate and get token + root folder automatically
	 * @returns Authenticated configuration with token and root folder
	 */
	async authenticate(): Promise<AuthenticatedConfig> {
		if (this.config.token && this.config.folderId) {
			return {
				token: this.config.token,
				rootFolder: this.config.folderId,
				userId: "provided",
				tier: "provided",
			};
		}
		return await this.authenticationService.authenticate();
	}

	/**
	 * Upload a file with automatic authentication (gets fresh token each time)
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
		console.log("Authenticating for file upload...");
		const authConfig = await this.authenticate();
		const createSubfolder = this.config.createSubfolder ?? true;

		return this.fileUploadService.uploadFile(
			file,
			fileName,
			authConfig.token,
			authConfig.rootFolder,
			isPublic,
			createSubfolder
		);
	}

	/**
	 * Upload multiple files with automatic authentication (gets fresh token each time)
	 * @param files - Array of files to upload with their names
	 * @param isPublic - Whether the folder should be public (default: true)
	 * @returns Multiple upload result with individual results
	 */
	async uploadMultipleFiles(
		files: FileToUpload[],
		isPublic: boolean = true
	): Promise<MultipleUploadResult> {
		console.log("Authenticating for multiple files upload...");
		const authConfig = await this.authenticate();
		const createSubfolder = this.config.createSubfolder ?? true;

		return this.fileUploadService.uploadMultipleFiles(
			files,
			authConfig.token,
			authConfig.rootFolder,
			isPublic,
			createSubfolder
		);
	}

	/**
	 * Upload files with progress events and automatic authentication
	 * @param files - Array of files to upload with their names
	 * @param isPublic - Whether the folder should be public (default: true)
	 * @returns Upload progress handler with events
	 */
	async uploadFiles(
		files: FileToUpload[],
		isPublic: boolean = true
	): Promise<UploadProgressResult> {
		console.log("Authenticating for files upload with progress...");
		const authConfig = await this.authenticate();
		const createSubfolder = this.config.createSubfolder ?? true;

		return this.fileUploadService.uploadFiles(
			files,
			authConfig.token,
			authConfig.rootFolder,
			isPublic,
			createSubfolder
		);
	}
}

export type {
	GofileConfig,
	UploadResult,
	FileToUpload,
	MultipleUploadResult,
	AuthenticatedConfig,
	UploadProgressResult,
} from "./types/index.js";
