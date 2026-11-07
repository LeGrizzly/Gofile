import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface VerifyTagOptions {
	gitTag?: string | null;
	publishVersion?: string;
	pkgName?: string;
	registry?: string;
	checkGit?: boolean;
	checkRegistry?: boolean;
	allowExisting?: boolean;
	execGit?: (command: string) => string;
	execNpm?: (command: string) => string;
}

export interface VerifyTagResult {
	gitTag: string | null;
	gitTagExists: boolean;
	publishVersion: string;
	pkgName: string;
	registryVersionExists: boolean;
	valid: boolean;
	message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function defaultExecGit(command: string): string {
	return execSync(command, {
		encoding: "utf-8",
		stdio: ["ignore", "pipe", "ignore"],
	}).trim();
}

export function defaultExecNpm(command: string): string {
	return execSync(command, {
		encoding: "utf-8",
		stdio: ["ignore", "pipe", "ignore"],
	}).trim();
}

export function checkGitTagExists(
	tag: string,
	execGit: (command: string) => string = defaultExecGit
): boolean {
	const trimmed = tag.trim();
	if (!trimmed) {
		return false;
	}

	// 1. Vérification locale des tags
	try {
		const localSha = execGit(`git rev-parse -q --verify "refs/tags/${trimmed}"`);
		if (localSha.length > 0) {
			return true;
		}
	} catch {
		// Pas de tag local trouvé
	}

	// 2. Vérification sur le remote origin
	try {
		const remoteOutput = execGit(`git ls-remote --tags origin "refs/tags/${trimmed}"`);
		if (remoteOutput.length > 0) {
			return true;
		}
	} catch {
		// Impossible d'interroger le remote ou tag non présent
	}

	return false;
}

export function checkRegistryVersionExists(
	pkgName: string,
	version: string,
	registry = "https://npm.pkg.github.com",
	execNpm: (command: string) => string = defaultExecNpm
): boolean {
	const trimmedPkg = pkgName.trim();
	const trimmedVersion = version.trim();
	if (!trimmedPkg || !trimmedVersion) {
		return false;
	}

	try {
		const output = execNpm(
			`npm view "${trimmedPkg}@${trimmedVersion}" version --registry "${registry}"`
		);
		return output === trimmedVersion;
	} catch {
		return false;
	}
}

export function verifyTagAndVersion(options: VerifyTagOptions = {}): VerifyTagResult {
	let pkgName = options.pkgName;
	let publishVersion = options.publishVersion;

	if (!pkgName || !publishVersion) {
		const pkgPath = resolve(process.cwd(), "package.json");
		const content = readFileSync(pkgPath, "utf-8");
		const parsed: unknown = JSON.parse(content);
		if (!isRecord(parsed)) {
			throw new Error(`Structure package.json invalide dans ${pkgPath}`);
		}
		if (!pkgName && typeof parsed.name === "string") {
			pkgName = parsed.name;
		}
		if (!publishVersion && typeof parsed.version === "string") {
			publishVersion = parsed.version;
		}
	}

	const resolvedPkgName = pkgName ? pkgName.trim() : "";
	const resolvedVersion = publishVersion ? publishVersion.trim() : "";

	let resolvedGitTag: string | null = null;
	if (options.gitTag !== undefined) {
		resolvedGitTag = options.gitTag ? options.gitTag.trim() : null;
	} else if (resolvedVersion) {
		resolvedGitTag = `v${resolvedVersion}`;
	}

	const checkGit = options.checkGit ?? (resolvedGitTag !== null && resolvedGitTag.length > 0);
	const checkRegistry = options.checkRegistry ?? true;
	const allowExisting = options.allowExisting ?? false;

	const gitTagExists =
		checkGit && resolvedGitTag
			? checkGitTagExists(resolvedGitTag, options.execGit ?? defaultExecGit)
			: false;

	const registryVersionExists =
		checkRegistry && resolvedPkgName && resolvedVersion
			? checkRegistryVersionExists(
					resolvedPkgName,
					resolvedVersion,
					options.registry ?? "https://npm.pkg.github.com",
					options.execNpm ?? defaultExecNpm
				)
			: false;

	let valid = true;
	const errors: string[] = [];

	if (gitTagExists && resolvedGitTag) {
		valid = false;
		errors.push(`Le tag Git '${resolvedGitTag}' existe déjà sur origin ou localement.`);
	}

	if (registryVersionExists) {
		valid = false;
		errors.push(
			`La version '${resolvedPkgName}@${resolvedVersion}' est déjà publiée sur le registre.`
		);
	}

	const finalValid = allowExisting ? true : valid;

	let message: string;
	if (finalValid) {
		message = `✅ Vérification validée : le tag '${resolvedGitTag ?? "aucun"}' et la version '${resolvedPkgName}@${resolvedVersion}' n'existent pas encore.`;
	} else {
		message = `❌ Conflit détecté avant build et publication : ${errors.join(" ")}`;
	}

	return {
		gitTag: resolvedGitTag,
		gitTagExists,
		publishVersion: resolvedVersion,
		pkgName: resolvedPkgName,
		registryVersionExists,
		valid: finalValid,
		message,
	};
}

const isDirectRun =
	process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
	const rawGitTag = process.env.GIT_TAG;
	const rawPublishVersion = process.env.PUBLISH_VERSION;
	const rawPkgName = process.env.PKG_NAME;
	const forcePublish = process.env.FORCE_PUBLISH === "true";
	const ref = process.env.GITHUB_REF || "";

	// Détermine si le contrôle du tag Git doit s'exécuter :
	// Exécuté si GIT_TAG est fourni, ou si nous sommes sur main / tag de release.
	const isReleaseRef =
		ref === "refs/heads/main" ||
		ref.startsWith("refs/tags/v") ||
		Boolean(rawGitTag && rawGitTag.length > 0);

	const result = verifyTagAndVersion({
		gitTag: rawGitTag,
		publishVersion: rawPublishVersion,
		pkgName: rawPkgName,
		checkGit: isReleaseRef,
		checkRegistry: true,
		allowExisting: forcePublish,
	});

	if (!result.valid) {
		console.error(`::error::${result.message}`);
		console.error(
			"❌ Interruption immédiate du pipeline pour éviter de compiler ou publier une version en conflit."
		);
		process.exit(1);
	}

	console.log(result.message);
}
