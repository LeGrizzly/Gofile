import { GofileAPI } from "../index.js";

export async function testExpiry(api: GofileAPI, contentId: string) {
    console.log("\n--- Testing Content Update: Expiry ---");
    
    // Set expiry to 10 days from now
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (10 * 24 * 60 * 60);
    
    const success = await api.setExpiry(contentId, expiryTimestamp);
    
    if (success) {
        console.log(`   ✅ Successfully updated expiry to \${expiryTimestamp} for content \${contentId}`);
    } else {
        throw new Error(`Failed to update expiry for content \${contentId}`);
    }

    // Unset expiry
    const successNull = await api.setExpiry(contentId, null);
    
    if (successNull) {
        console.log(`   ✅ Successfully removed expiry (null) for content \${contentId}`);
    } else {
        throw new Error(`Failed to remove expiry for content \${contentId}`);
    }
}
