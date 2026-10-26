import { GofileRepository } from "./repositories/GofileRepository.js";
import { AuthenticationService } from "./services/AuthenticationService.js";
import type { AuthenticatedConfig } from "./types/index.js";

export const GofileAuth = {
	/**
	 * Create a new guest account and return the credentials
	 * @returns Authenticated configuration with token and root folder
	 */
	async createAccount(): Promise<AuthenticatedConfig> {
		const repository = new GofileRepository({});
		const authenticationService = new AuthenticationService(repository);
		return await authenticationService.authenticate();
	},
};
