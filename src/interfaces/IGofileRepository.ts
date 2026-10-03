import type {
	AccountResponse,
	CreateFolderRequest,
	CreateFolderResponse,
	UpdateContentRequest,
	UpdateContentResponse,
	UploadFileRequest,
	UploadFileResponse,
} from "../types/index.js";

export interface IGofileRepository {
	getAuthenticatedAccount(): Promise<AccountResponse>;
	createFolder(request: CreateFolderRequest): Promise<CreateFolderResponse>;
	uploadFile(request: UploadFileRequest): Promise<UploadFileResponse>;
	updateContent(request: UpdateContentRequest): Promise<UpdateContentResponse>;
}
