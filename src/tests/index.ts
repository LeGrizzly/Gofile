import { GofileAPI, GofileAuth } from "../index.js";
import type { AuthenticatedConfig } from "../types/index.js";
import { testDescription } from "./description.test.js";
import { testExpiry } from "./expiry.test.js";
import { testMultipart } from "./multipart.test.js";
import { testPublic } from "./public.test.js";
import { testTags } from "./tags.test.js";
// Import tests
import { testUpload } from "./upload.test.js";

async function runTests() {
	console.log("=== Starting GofileAPI Tests ===");

	try {
		console.log("\n[SETUP] Creating Account (GofileAuth)");
		const account: AuthenticatedConfig = await GofileAuth.createAccount();
		console.log("✅ Account created successfully!");
		console.log("   Token:", `${account.token.slice(0, 10)}...`);
		console.log("   Root Folder:", account.rootFolder);

		const api = new GofileAPI(account, { createSubfolder: true });

		console.log("\n=== RUNNING TESTS ===");

		// Let's upload a file and use the generated subfolder for content modification tests
		const uploadResult = await testUpload(api);
		const testFolderId = uploadResult?.folderId;

		if (!testFolderId) {
			throw new Error(
				"Initial upload failed, cannot get folder ID for content modification tests."
			);
		}

		await testMultipart(account);

		// Content tests on the generated folder
		await testTags(api, testFolderId);
		await testDescription(api, testFolderId);
		await testExpiry(api, testFolderId);
		await testPublic(api, testFolderId);

		console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
	} catch (e) {
		console.error("\n❌ Test Suite Failed:", e);
		process.exit(1);
	}
}

runTests();
