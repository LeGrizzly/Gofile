import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { bumpPackageJson, computeBumpedVersion } from "./bump-version.ts";

describe("computeBumpedVersion", () => {
	it("increments patch version and resets build to '1' by default", () => {
		const result = computeBumpedVersion("1.0.11", "4");
		assert.equal(result.previousVersion, "1.0.11");
		assert.equal(result.newVersion, "1.0.12");
		assert.equal(result.previousBuild, "4");
		assert.equal(result.newBuild, "1");
		assert.equal(result.gitTag, "v1.0.12");
	});

	it("strips pre-release suffixes prior to bumping patch", () => {
		const result = computeBumpedVersion("1.0.11-dev.3", "3");
		assert.equal(result.previousVersion, "1.0.11-dev.3");
		assert.equal(result.newVersion, "1.0.12");
		assert.equal(result.newBuild, "1");
		assert.equal(result.gitTag, "v1.0.12");
	});

	it("supports minor version increment", () => {
		const result = computeBumpedVersion("1.0.11", "7", { bumpType: "minor" });
		assert.equal(result.newVersion, "1.1.0");
		assert.equal(result.newBuild, "1");
		assert.equal(result.gitTag, "v1.1.0");
	});

	it("supports major version increment", () => {
		const result = computeBumpedVersion("1.0.11", "7", { bumpType: "major" });
		assert.equal(result.newVersion, "2.0.0");
		assert.equal(result.newBuild, "1");
		assert.equal(result.gitTag, "v2.0.0");
	});

	it("supports forced target version", () => {
		const result = computeBumpedVersion("1.0.11", "3", { targetVersion: "2.1.0" });
		assert.equal(result.newVersion, "2.1.0");
		assert.equal(result.newBuild, "1");
		assert.equal(result.gitTag, "v2.1.0");
	});

	it("throws on invalid version format", () => {
		assert.throws(() => computeBumpedVersion("", "1"), /Version cannot be empty/);
		assert.throws(() => computeBumpedVersion("invalid-version", "1"), /Invalid semver version/);
		assert.throws(
			() => computeBumpedVersion("1.0.0", "1", { targetVersion: "invalid" }),
			/Target version must match SemVer format/
		);
	});
});

describe("bumpPackageJson file modification", () => {
	let tempDir: string;
	let pkgPath: string;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bump-test-"));
		pkgPath = path.join(tempDir, "package.json");
	});

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("updates package.json on disk and preserves indentation", () => {
		const initialJson =
			'{\n\t"name": "@LeGrizzly/gofile",\n\t"version": "1.0.11",\n\t"build": "4"\n}\n';
		fs.writeFileSync(pkgPath, initialJson, "utf-8");

		const result = bumpPackageJson(pkgPath, { bumpType: "patch" });
		assert.equal(result.newVersion, "1.0.12");
		assert.equal(result.newBuild, "1");

		const updatedContent = fs.readFileSync(pkgPath, "utf-8");
		const parsed: unknown = JSON.parse(updatedContent);
		assert.ok(typeof parsed === "object" && parsed !== null);
		const pkg = parsed as Record<string, unknown>;

		assert.equal(pkg.version, "1.0.12");
		assert.equal(pkg.build, "1");
		assert.equal(pkg.name, "@LeGrizzly/gofile");
		assert.ok(updatedContent.includes('\t"version": "1.0.12"'));
	});
});
