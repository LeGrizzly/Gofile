// Domain types for Gofile API

export interface CreateFolderRequest {
	token: string;
	parentFolderId: string;
	public: boolean;
}

export interface CreateFolderResponse {
	status: string;
	data: {
		id: string;
		owner: string;
		type: string;
		name: string;
		parentFolder: string;
		createTime: number;
		modTime: number;
		code: string;
	};
}

export interface UploadFileRequest {
	token: string;
	folderId: string;
	file: Buffer;
	fileName: string;
}

export interface UploadFileResponse {
	status: string;
	data: {
		createTime: number;
		downloadPage: string;
		guestToken: string;
		id: string;
		md5: string;
		mimetype: string;
		modTime: number;
		name: string;
		parentFolder: string;
		parentFolderCode: string;
		servers: string[];
		size: number;
		type: string;
	};
}

export interface GofileConfig {
	baseUrl?: string;
	uploadUrl?: string;
}

export interface UploadResult {
	success: boolean;
	downloadPage?: string;
	fileId?: string;
	error?: string;
}

export interface FileToUpload {
	file: Buffer;
	fileName: string;
}

export interface UploadProgress {
	currentFile: number;
	totalFiles: number;
	fileName: string;
	completed: boolean;
	success?: boolean;
	downloadPage?: string;
	fileId?: string;
	error?: string;
}

export interface MultipleUploadResult {
	success: boolean;
	results: UploadResult[];
	folderId?: string;
	downloadPage?: string;
	error?: string;
}

export interface UploadProgressResult {
	on(event: "uploadProgress", listener: (progress: UploadProgress) => void): void;
	on(event: "done", listener: (results: MultipleUploadResult) => void): void;
}

export interface AccountResponse {
	status: string;
	data: {
		id: string;
		rootFolder: string;
		tier: string;
		token: string;
	};
}

export interface AuthenticatedConfig {
	token: string;
	rootFolder: string;
	userId: string;
	tier: string;
}
