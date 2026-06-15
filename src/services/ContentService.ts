import type { IGofileRepository } from "../interfaces/IGofileRepository.js";

export class ContentService {
	constructor(private readonly repository: IGofileRepository) {}

	/**
	 * Update content attribute (public/private)
	 */
	async setPublic(token: string, contentId: string, isPublic: boolean, recursive: boolean = true): Promise<boolean> {
		const response = await this.repository.updateContent({
			token,
			contentId,
			attribute: "public",
			attributeValue: isPublic,
			recursive
		});
		return response.status === "ok";
	}

	/**
	 * Set content description (markdown supported)
	 */
	async setDescription(token: string, contentId: string, description: string): Promise<boolean> {
		const response = await this.repository.updateContent({
			token,
			contentId,
			attribute: "description",
			attributeValue: description
		});
		return response.status === "ok";
	}

	/**
	 * Set content expiry
	 * @param expiry Timestamp in seconds, or null for no expiry
	 */
	async setExpiry(token: string, contentId: string, expiry: number | null): Promise<boolean> {
		const response = await this.repository.updateContent({
			token,
			contentId,
			attribute: "expiry",
			attributeValue: expiry
		});
		return response.status === "ok";
	}

	/**
	 * Set content tags
	 * @param tags Array of tags (no spaces allowed)
	 */
	async setTags(token: string, contentId: string, tags: string[]): Promise<boolean> {
		const validTags = tags.map(t => t.replace(/\s+/g, ""));
		const response = await this.repository.updateContent({
			token,
			contentId,
			attribute: "tags",
			attributeValue: validTags.join(",")
		});
		return response.status === "ok";
	}
}
