import { GofileAPI } from "../index.js";

export async function testDescription(api: GofileAPI, contentId: string) {
    console.log("\n--- Testing Content Update: Description ---");
    
    const description = "**LeakRap Description**\nThis is an automated test folder.";
    const success = await api.setDescription(contentId, description);
    
    if (success) {
        console.log(`   ✅ Successfully updated description for content \${contentId}`);
    } else {
        throw new Error(`Failed to update description for content \${contentId}`);
    }
}
