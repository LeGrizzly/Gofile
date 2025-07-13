import type { IGofileRepository } from "../interfaces/IGofileRepository.js";
import type { AuthenticatedConfig } from "../types/index.js";

export class AuthenticationService {
	constructor(private readonly repository: IGofileRepository) {}

	async authenticate(): Promise<AuthenticatedConfig> {
		try {
			console.log("Authenticating with Gofile...");

			const accountResponse = await this.repository.getAuthenticatedAccount();

			const config: AuthenticatedConfig = {
				token: accountResponse.data.token,
				rootFolder: accountResponse.data.rootFolder,
				userId: accountResponse.data.id,
				tier: accountResponse.data.tier,
			};

			console.log("Authentication successful!");
			console.log(`   User ID: ${config.userId}`);
			console.log(`   Tier: ${config.tier}`);
			console.log(`   Root Folder: ${config.rootFolder}`);
			console.log(`   Token: ${config.token.slice(0, 10)}...`);

			return config;
		} catch (error) {
			console.error("Authentication failed:", error);
			throw error;
		}
	}
}
