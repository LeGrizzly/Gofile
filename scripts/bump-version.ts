import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type BumpType = "patch" | "minor" | "major";

export interface BumpVersionOptions {
	bumpType?: BumpType;
	targetVersion?: string;
}

export interface BumpVersionResult {
	previousVersion: string;
	newVersion: string;
	previousBuild: string;
	newBuild: string;
	gitTag: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function detectIndentation(content: string): string {
	const firstIndentedLine = content
		.split("\n")
		.find((line) => line.startsWith("\t") || line.startsWith("  "));
	if (!firstIndentedLine) {
		return "\t";
	}
	return firstIndentedLine.startsWith("\t") ? "\t" : "  ";
}

export function computeBumpedVersion(
	currentVersion: string,
	currentBuild: string | number | undefined,
	options: BumpVersionOptions = {}
): BumpVersionResult {
	const trimmedVersion = currentVersion.trim();
	if (!trimmedVersion) {
		throw new Error("Version cannot be empty in package.json");
	}

	const previousBuild =
		currentBuild !== undefined && currentBuild !== null ? String(currentBuild).trim() : "1";

	if (options.targetVersion) {
		const target = options.targetVersion.trim();
		if (!/^\d+\.\d+\.\d+$/.test(target)) {
			throw new Error(
				`Target version must match SemVer format (x.y.z): "${options.targetVersion}"`
			);
		}
		return {
			previousVersion: trimmedVersion,
			newVersion: target,
			previousBuild,
			newBuild: "1",
			gitTag: `v${target}`,
		};
	}

	// Clean any prerelease suffix (e.g., 1.0.11-dev.4 -> 1.0.11)
	const cleanVersion = trimmedVersion.replace(/-.*$/, "");
	const parts = cleanVersion.split(".").map((part) => parseInt(part, 10));

	if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
		throw new Error(`Invalid semver version in package.json: "${currentVersion}"`);
	}

	const [major, minor, patch] = parts as [number, number, number];
	const bumpType = options.bumpType ?? "patch";

	let newVersion: string;
	switch (bumpType) {
		case "major":
			newVersion = `${major + 1}.0.0`;
			break;
		case "minor":
			newVersion = `${major}.${minor + 1}.0`;
			break;
		case "patch":
			newVersion = `${major}.${minor}.${patch + 1}`;
			break;
		default:
			throw new Error(`Unsupported bump type: "${String(bumpType)}"`);
	}

	return {
		previousVersion: trimmedVersion,
		newVersion,
		previousBuild,
		newBuild: "1",
		gitTag: `v${newVersion}`,
	};
}

export function bumpPackageJson(
	pkgPath: string,
	options: BumpVersionOptions = {}
): BumpVersionResult {
	const content = readFileSync(pkgPath, "utf-8");
	const parsed: unknown = JSON.parse(content);

	if (!isRecord(parsed)) {
		throw new Error(`Invalid package.json structure in ${pkgPath}`);
	}

	const rawVersion = typeof parsed.version === "string" ? parsed.version : "";
	const rawBuild =
		typeof parsed.build === "string" || typeof parsed.build === "number" ? parsed.build : "1";

	const result = computeBumpedVersion(rawVersion, rawBuild, options);

	parsed.version = result.newVersion;
	parsed.build = result.newBuild;

	const indent = detectIndentation(content);
	writeFileSync(pkgPath, `${JSON.stringify(parsed, null, indent)}\n`);

	return result;
}

const isDirectRun =
	process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
	const pkgPath = resolve(process.cwd(), "package.json");
	const rawBumpType = process.env.BUMP_TYPE || process.argv[2] || "patch";
	const validBumpTypes: BumpType[] = ["patch", "minor", "major"];
	const bumpType: BumpType = validBumpTypes.includes(rawBumpType as BumpType)
		? (rawBumpType as BumpType)
		: "patch";

	const result = bumpPackageJson(pkgPath, { bumpType });

	const githubOutput = process.env.GITHUB_OUTPUT;
	if (githubOutput) {
		appendFileSync(githubOutput, `previous_version=${result.previousVersion}\n`);
		appendFileSync(githubOutput, `new_version=${result.newVersion}\n`);
		appendFileSync(githubOutput, `previous_build=${result.previousBuild}\n`);
		appendFileSync(githubOutput, `new_build=${result.newBuild}\n`);
		appendFileSync(githubOutput, `git_tag=${result.gitTag}\n`);
	}

	console.log("Package version bumped and build reset successfully:");
	console.log(`  - Version : ${result.previousVersion} -> ${result.newVersion}`);
	console.log(`  - Build   : ${result.previousBuild} -> ${result.newBuild}`);
	console.log(`  - Git Tag : ${result.gitTag}`);
}
