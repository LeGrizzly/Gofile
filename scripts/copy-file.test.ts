import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { copyGofilePackage } from "./copy-file.ts";

describe("copyGofilePackage", () => {
	let tempDir: string;
	let fakeGofileDir: string;
	let fakeMonorepoRoot: string;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gofile-copy-test-"));
		fakeGofileDir = path.join(tempDir, "Gofile");
		fakeMonorepoRoot = tempDir;

		fs.mkdirSync(fakeGofileDir, { recursive: true });
	});

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("throws when dist directory does not exist", () => {
		fs.writeFileSync(path.join(fakeGofileDir, "package.json"), "{}");

		assert.throws(
			() =>
				copyGofilePackage({
					sourceDir: fakeGofileDir,
					monorepoRoot: fakeMonorepoRoot,
					targetProjects: ["TestApp"],
				}),
			/Build output directory \("dist"\) does not exist/
		);
	});

	it("throws when package.json does not exist in source", () => {
		fs.mkdirSync(path.join(fakeGofileDir, "dist"), { recursive: true });

		assert.throws(
			() =>
				copyGofilePackage({
					sourceDir: fakeGofileDir,
					monorepoRoot: fakeMonorepoRoot,
					targetProjects: ["TestApp"],
				}),
			/Source "package.json" not found/
		);
	});

	it("marks nonexistent target projects as skipped", () => {
		fs.mkdirSync(path.join(fakeGofileDir, "dist"), { recursive: true });
		fs.writeFileSync(path.join(fakeGofileDir, "package.json"), '{"name":"gofile"}');

		const summary = copyGofilePackage({
			sourceDir: fakeGofileDir,
			monorepoRoot: fakeMonorepoRoot,
			targetProjects: ["NonExistentApp"],
		});

		assert.equal(summary.successCount, 0);
		assert.equal(summary.total, 1);
		assert.equal(summary.results[0]?.status, "skipped");
	});

	it("successfully copies dist and package.json to existing target projects with scoped package name", () => {
		const distDir = path.join(fakeGofileDir, "dist");
		fs.mkdirSync(distDir, { recursive: true });
		fs.writeFileSync(path.join(distDir, "index.js"), 'console.log("gofile");');
		fs.writeFileSync(
			path.join(fakeGofileDir, "package.json"),
			'{"name":"gofile","version":"1.0.11"}'
		);

		const targetProject = path.join(fakeMonorepoRoot, "LeakRapBotDiscord");
		fs.mkdirSync(targetProject, { recursive: true });

		const summary = copyGofilePackage({
			sourceDir: fakeGofileDir,
			monorepoRoot: fakeMonorepoRoot,
			targetProjects: ["LeakRapBotDiscord"],
		});

		assert.equal(summary.successCount, 1);
		assert.equal(summary.total, 1);
		assert.equal(summary.results[0]?.status, "synced");

		const targetPkgDir = path.join(targetProject, "node_modules", "@LeGrizzly", "gofile");
		assert.ok(fs.existsSync(path.join(targetPkgDir, "dist", "index.js")));
		assert.ok(fs.existsSync(path.join(targetPkgDir, "package.json")));

		const copiedPkgContent = fs.readFileSync(path.join(targetPkgDir, "package.json"), "utf-8");
		const parsed = JSON.parse(copiedPkgContent) as { name: string; version: string };
		assert.equal(parsed.name, "@LeGrizzly/gofile");
		assert.equal(parsed.version, "1.0.11");
	});
});
