import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { FileToUpload, GofileAPI } from "../index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function testUpload(api: GofileAPI): Promise<any> {
	console.log("\n--- Testing Single File Upload ---");

	const file: FileToUpload = {
		file: Buffer.from("This is a dummy file for testing Gofile upload functionality."),
		fileName: "dummy_test_file.txt",
	};

	try {
		const result = await api.uploadFile(file.file, file.fileName);
		if (result.success) {
			console.log("✅ Buffer File uploaded successfully!");
			console.log("   Download URL:", result.downloadPage);

			// Test Blob upload
			console.log("--- Testing Blob File Upload ---");
			const blob = new Blob(["This is a dummy blob file for testing streaming uploads."]);
			const blobResult = await api.uploadFile(blob, "dummy_blob_file.txt");
			if (!blobResult.success) {
				throw new Error("Blob file upload failed: " + JSON.stringify(blobResult));
			}
			console.log("✅ Blob File uploaded successfully!");
			console.log("   Download URL:", blobResult.downloadPage);

			// Extract the parent folder ID or the uploaded file's parent to use for content testing
			// Using the root folder configured in API for simplicity since uploadFile puts it there
			const folderId = (api as any).account.rootFolder;
			return { folderId, ...result };
		} else {
			throw new Error("File upload failed: " + JSON.stringify(result));
		}
	} finally {
		if (Buffer.isBuffer(file.file)) {
			file.file = Buffer.alloc(0); // Clear the buffer to free memory
		}
	}
}
