import { GofileAPI } from "../index.js";

export async function testTags(api: GofileAPI, contentId: string) {
    console.log("\n--- Testing Content Update: Tags ---");
    
    const success = await api.setTags(contentId, ["LeakRap", "TestTag", "Music"]);
    
    if (success) {
        console.log(`   ✅ Successfully updated tags for content \${contentId}`);
    } else {
        throw new Error(`Failed to update tags for content \${contentId}`);
    }
}
