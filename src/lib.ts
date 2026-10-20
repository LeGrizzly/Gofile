// Main exports for the Gofile API library
export { GofileAPI, GofileAuth } from "./index.js";
export type { IGofileRepository } from "./interfaces/IGofileRepository.js";
export { GofileRepository } from "./repositories/GofileRepository.js";
export { FileUploadService } from "./services/FileUploadService.js";
export type {
	AuthenticatedConfig,
	BlobLike,
	CreateFolderRequest,
	CreateFolderResponse,
	FileToUpload,
	GofileConfig,
	GofileServerInfo,
	GofileServersResponse,
	MultipleUploadResult,
	UpdateContentBody,
	UpdateContentRequest,
	UpdateContentResponse,
	UploadFileInput,
	UploadFileRequest,
	UploadFileResponse,
	UploadProgress,
	UploadProgressResult,
	UploadResult,
} from "./types/index.js";
export * from "./utils/helpers.js";
export * from "./utils/TypeGuards.js";
