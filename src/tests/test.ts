import { GofileAPI, type FileToUpload } from "../index.js";
import { Buffer } from "node:buffer";

async function progressExample() {
	console.log("Gofile Upload with Progress Example");
	console.log("=====================================\n");

	const api = new GofileAPI({});

	try {
		const files: FileToUpload[] = [
			{
				file: Buffer.from("Hello, this is file 1 content"),
				fileName: "progress-test-1.txt",
			},
			{
				file: Buffer.from("Hello, this is file 2 content"),
				fileName: "progress-test-2.txt",
			},
			{
				file: Buffer.from("Hello, this is file 3 content"),
				fileName: "progress-test-3.txt",
			},
			{
				file: Buffer.from("Hello, this is file 4 content"),
				fileName: "progress-test-4.txt",
			},
		];

		console.log(`Uploading ${files.length} files with progress tracking...`);
		console.log("Files to upload:");
		files.forEach((file, index) => {
			console.log(`   ${index + 1}. ${file.fileName} (${file.file.length} bytes)`);
		});
		console.log();

		const uploadHandler = await api.uploadFiles(files);

		uploadHandler.on("uploadProgress", (progress) => {
			if (!progress.completed) {
				console.log(
					`Starting upload: ${progress.fileName} (${progress.currentFile}/${progress.totalFiles})`
				);
			} else {
				if (progress.success) {
					console.log(`Completed: ${progress.fileName} -> ${progress.downloadPage}`);
				} else {
					console.log(`Failed: ${progress.fileName} -> ${progress.error}`);
				}
			}
		});

		uploadHandler.on("done", (results) => {
			console.log("\nUpload process completed!");
			console.log("Final results:", {
				success: results.success,
				totalFiles: files.length,
				successfulUploads: results.results.filter((r) => r.success).length,
				folderId: results.folderId,
				downloadPage: results.downloadPage,
				error: results.error,
			});

			if (results.success) {
				console.log("All files uploaded successfully!");
				console.log("Folder download page:", results.downloadPage);
			} else {
				console.error("Some uploads failed:", results.error);
			}
		});
	} catch (error) {
		console.error("Error:", error);
	}
}

async function multipartSameLinkExample() {
	console.log("\n\nTest: Multipart sur le même lien (uploadMultipleFiles)");
	console.log("========================================================\n");

	const api = new GofileAPI({});

	try {
		const files: FileToUpload[] = [
			{
				file: Buffer.from("Contenu du fichier multipart 1"),
				fileName: "multipart-1.txt",
			},
			{
				file: Buffer.from("Contenu du fichier multipart 2"),
				fileName: "multipart-2.txt",
			},
		];

		console.log(`Uploading ${files.length} files to the same link...`);

		const result = await api.uploadMultipleFiles(files);

		console.log("Final results:", {
			success: result.success,
			totalFiles: files.length,
			successfulUploads: result.results?.filter((r) => r.success).length,
			folderId: result.folderId,
			downloadPage: result.downloadPage,
			error: result.error,
		});

		if (result.success) {
			console.log(
				`\nSuccès ! Les fichiers ont été uploadés sur le même lien : ${result.downloadPage}`
			);
		} else {
			console.error("\nÉchec du test multipart.");
		}
	} catch (error) {
		console.error("Error:", error);
	}
}

async function runAllTests() {
	await progressExample();
	await multipartSameLinkExample();
}

runAllTests().catch(console.error);
