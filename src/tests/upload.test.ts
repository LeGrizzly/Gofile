import type { FileToUpload, GofileAPI, UploadResult } from "../index.js";

export async function testUpload(api: GofileAPI): Promise<UploadResult> {
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
				throw new Error(`Blob file upload failed: ${JSON.stringify(blobResult)}`);
			}
			console.log("✅ Blob File uploaded successfully!");
			console.log("   Download URL:", blobResult.downloadPage);

			return result;
		} else {
			throw new Error(`File upload failed: ${JSON.stringify(result)}`);
		}
	} finally {
		if (Buffer.isBuffer(file.file)) {
			file.file = Buffer.alloc(0); // Clear the buffer to free memory
		}
	}
}
