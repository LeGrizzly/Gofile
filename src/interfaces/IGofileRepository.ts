import type {
	CreateFolderRequest,
	CreateFolderResponse,
	UploadFileRequest,
	UploadFileResponse,
	AccountResponse,
} from "../types/index.js";

export interface IGofileRepository {
	getAuthenticatedAccount(): Promise<AccountResponse>;
	createFolder(request: CreateFolderRequest): Promise<CreateFolderResponse>;
	uploadFile(request: UploadFileRequest): Promise<UploadFileResponse>;
}
