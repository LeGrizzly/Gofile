import type { GofileAPI } from "../index.js";

export async function testPublic(api: GofileAPI, contentId: string) {
	console.log("\n--- Testing Content Update: Public Status ---");

	// Set to private
	const successPrivate = await api.setPublic(contentId, false, true);

	if (successPrivate) {
		console.log(`   ✅ Successfully set content \${contentId} to private (recursive: true)`);
	} else {
		throw new Error(`Failed to set content \${contentId} to private`);
	}

	// Set to public
	const successPublic = await api.setPublic(contentId, true, true);

	if (successPublic) {
		console.log(`   ✅ Successfully set content \${contentId} to public (recursive: true)`);
	} else {
		throw new Error(`Failed to set content \${contentId} to public`);
	}
}
