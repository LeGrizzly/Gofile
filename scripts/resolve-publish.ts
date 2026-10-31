import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface VersionResolution {
	name: string;
	baseVersion: string;
	buildNumber: string;
	publishVersion: string;
	npmTag: string;
	branch: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function computePublishMetadata(
	name: string,
	version: string,
	build: string,
	rawBranch: string
): VersionResolution {
	const trimmedName = name.trim();
	const trimmedVersion = version.trim();
	const trimmedBuild = build.trim();

	if (!trimmedName) {
		throw new Error("Field 'name' is required in package.json");
	}
	if (!trimmedVersion) {
		throw new Error("Field 'version' is required in package.json");
	}
	if (!trimmedBuild || !/^\d+$/.test(trimmedBuild)) {
		throw new Error("Field 'build' must be a positive integer string in package.json");
	}

	const branch = rawBranch.replace(/^refs\/(heads|tags)\//, "").trim();
	const baseVersion = trimmedVersion.replace(/-.*$/, "").trim();

	if (branch === "main" || branch.startsWith("v")) {
		return {
			name: trimmedName,
			baseVersion,
			buildNumber: trimmedBuild,
			publishVersion: baseVersion,
			npmTag: "latest",
			branch,
		};
	}

	if (branch === "develop") {
		return {
			name: trimmedName,
			baseVersion,
			buildNumber: trimmedBuild,
			publishVersion: `${baseVersion}-dev.${trimmedBuild}`,
			npmTag: "dev",
			branch,
		};
	}

	const sanitizedSlug =
		branch
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 30) || "preview";

	return {
		name: trimmedName,
		baseVersion,
		buildNumber: trimmedBuild,
		publishVersion: `${baseVersion}-${sanitizedSlug}.${trimmedBuild}`,
		npmTag: sanitizedSlug,
		branch,
	};
}

const isDirectRun =
	process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
	const pkgPath = resolve(process.cwd(), "package.json");
	const parsed: unknown = JSON.parse(readFileSync(pkgPath, "utf-8"));

	if (!isRecord(parsed)) {
		throw new Error("Invalid package.json structure");
	}

	const pkgName = typeof parsed.name === "string" ? parsed.name : "";
	const pkgVersion = typeof parsed.version === "string" ? parsed.version : "";
	const pkgBuild =
		typeof parsed.build === "string" || typeof parsed.build === "number"
			? String(parsed.build)
			: "1";
	const branch = process.env.GITHUB_REF_NAME || process.argv[2] || "develop";

	const result = computePublishMetadata(pkgName, pkgVersion, pkgBuild, branch);

	parsed.version = result.publishVersion;
	writeFileSync(pkgPath, `${JSON.stringify(parsed, null, "\t")}\n`);

	const githubOutput = process.env.GITHUB_OUTPUT;
	if (githubOutput) {
		appendFileSync(githubOutput, `pkg_name=${result.name}\n`);
		appendFileSync(githubOutput, `pkg_version=${result.baseVersion}\n`);
		appendFileSync(githubOutput, `pkg_build=${result.buildNumber}\n`);
		appendFileSync(githubOutput, `publish_version=${result.publishVersion}\n`);
		appendFileSync(githubOutput, `npm_tag=${result.npmTag}\n`);
	}

	console.log("Package publish configuration resolved:");
	console.log(`  - Package : ${result.name}`);
	console.log(`  - Version : ${result.publishVersion}`);
	console.log(`  - npm tag : ${result.npmTag}`);
	console.log(`  - Branch  : ${result.branch}`);
}
