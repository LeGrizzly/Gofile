import { GofileAPI } from "../index.js";
import type { AuthenticatedConfig } from "../types/index.js";

export async function testMultipart(account: AuthenticatedConfig) {
	console.log("\n--- Testing Multipart Upload Simulation (api1 -> api2) ---");

	const api1 = new GofileAPI(account, { createSubfolder: true });

	const part1Files = [{ file: Buffer.from("Part 1 content"), fileName: "part1.zip" }];

	const handler1 = await api1.uploadFiles(part1Files);
	const result1 = await new Promise<any>((resolve) => handler1.on("done", resolve));

	console.log("   ✅ Part 1 uploaded to folder ID:", result1.folderId);

	const account2: AuthenticatedConfig = {
		token: account.token,
		rootFolder: result1.folderId,
		userId: account.userId,
		tier: account.tier,
	};

	const api2 = new GofileAPI(account2, { createSubfolder: false });
	const part2Files = [{ file: Buffer.from("Part 2 content"), fileName: "part2.zip" }];

	const handler2 = await api2.uploadFiles(part2Files);
	const result2 = await new Promise<any>((resolve) => handler2.on("done", resolve));

	console.log("   ✅ Part 2 uploaded to folder ID:", result2.folderId);

	if (result1.folderId !== result2.folderId) {
		throw new Error("FAILED: Part 1 and Part 2 are in different folders!");
	}

	console.log("   🎉 SUCCESS: Part 1 and Part 2 are in the EXACT same folder!");
}
