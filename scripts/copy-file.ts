import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TARGET_PROJECTS = ["LeakRapBotDiscord"] as const;

export interface CopyOptions {
	sourceDir?: string;
	monorepoRoot?: string;
	targetProjects?: readonly string[];
}

export interface ProjectSyncResult {
	project: string;
	status: "synced" | "skipped" | "failed";
	error?: string;
}

export interface SyncSummary {
	successCount: number;
	total: number;
	results: ProjectSyncResult[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_GOFILE_ROOT = path.resolve(__dirname, "..");
const DEFAULT_MONOREPO_ROOT = path.resolve(DEFAULT_GOFILE_ROOT, "..");

export function copyGofilePackage(options: CopyOptions = {}): SyncSummary {
	const gofileRoot = options.sourceDir ?? DEFAULT_GOFILE_ROOT;
	const monorepoRoot = options.monorepoRoot ?? DEFAULT_MONOREPO_ROOT;
	const targetProjects = options.targetProjects ?? TARGET_PROJECTS;

	const sourceDistDir = path.join(gofileRoot, "dist");
	const sourcePackageJson = path.join(gofileRoot, "package.json");

	if (!fs.existsSync(sourceDistDir)) {
		throw new Error(
			'Build output directory ("dist") does not exist. Run "npm run build" first.'
		);
	}

	if (!fs.existsSync(sourcePackageJson)) {
		throw new Error('Source "package.json" not found in Gofile directory.');
	}

	let packageData: Record<string, unknown> = {};
	try {
		packageData = JSON.parse(fs.readFileSync(sourcePackageJson, "utf-8")) as Record<
			string,
			unknown
		>;
	} catch (e) {
		throw new Error(`Failed to parse source "package.json": ${e}`);
	}

	// Always ensure standard @LeGrizzly scope on the synchronized package
	packageData.name = "@LeGrizzly/gofile";
	const targetPackageJsonContent = JSON.stringify(packageData, null, 2);

	const results: ProjectSyncResult[] = [];
	let successCount = 0;

	for (const project of targetProjects) {
		const projectRoot = path.join(monorepoRoot, project);

		if (!fs.existsSync(projectRoot)) {
			results.push({
				project,
				status: "skipped",
				error: `Target project directory not found at ${projectRoot}`,
			});
			continue;
		}

		const targetScopeDir = path.join(projectRoot, "node_modules", "@LeGrizzly");
		const targetPkgDir = path.join(targetScopeDir, "gofile");
		const targetDistDir = path.join(targetPkgDir, "dist");
		const targetPackageJson = path.join(targetPkgDir, "package.json");

		try {
			if (fs.existsSync(targetPkgDir)) {
				fs.rmSync(targetPkgDir, { recursive: true, force: true });
			}

			fs.mkdirSync(targetPkgDir, { recursive: true });
			fs.cpSync(sourceDistDir, targetDistDir, { recursive: true, force: true });
			fs.writeFileSync(targetPackageJson, targetPackageJsonContent, "utf-8");

			results.push({ project, status: "synced" });
			successCount++;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			results.push({ project, status: "failed", error: errorMessage });
		}
	}

	return {
		successCount,
		total: targetProjects.length,
		results,
	};
}

const isDirectRun =
	process.argv[1] !== undefined &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
	try {
		const summary = copyGofilePackage();

		for (const res of summary.results) {
			if (res.status === "synced") {
				console.log(
					`✅ Synced @LeGrizzly/gofile -> ${res.project}/node_modules/@LeGrizzly/gofile`
				);
			} else if (res.status === "skipped") {
				console.warn(`⚠️ Target project directory "${res.project}" skipped: ${res.error}`);
			} else {
				console.error(
					`❌ Failed to sync @LeGrizzly/gofile to ${res.project}: ${res.error}`
				);
			}
		}

		console.log(
			`\n🎉 Synchronization complete (${summary.successCount}/${summary.total} targets synced).`
		);

		if (summary.successCount === 0 && summary.total > 0) {
			process.exit(1);
		}
	} catch (err) {
		console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
		process.exit(1);
	}
}
