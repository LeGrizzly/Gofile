import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computePublishMetadata } from "./resolve-publish.ts";

describe("computePublishMetadata (Gofile)", () => {
	const basePkg = {
		name: "@LeGrizzly/gofile",
		version: "1.0.11",
		build: "1",
	};

	it("publishes base version with 'latest' tag on main branch", () => {
		const result = computePublishMetadata(basePkg.name, basePkg.version, basePkg.build, "main");
		assert.equal(result.publishVersion, "1.0.11");
		assert.equal(result.npmTag, "latest");
		assert.equal(result.name, "@LeGrizzly/gofile");
		assert.equal(result.baseVersion, "1.0.11");
		assert.equal(result.buildNumber, "1");
	});

	it("treats v* release tags like main ('latest' tag)", () => {
		const result = computePublishMetadata(
			basePkg.name,
			basePkg.version,
			basePkg.build,
			"refs/tags/v1.0.11"
		);
		assert.equal(result.publishVersion, "1.0.11");
		assert.equal(result.npmTag, "latest");
		assert.equal(result.branch, "v1.0.11");
	});

	it("publishes prerelease version with build number and 'dev' tag on develop branch", () => {
		const result = computePublishMetadata(
			basePkg.name,
			basePkg.version,
			basePkg.build,
			"develop"
		);
		assert.equal(result.publishVersion, "1.0.11-dev.1");
		assert.equal(result.npmTag, "dev");
		assert.equal(result.name, "@LeGrizzly/gofile");
	});

	it("publishes slugged prerelease version and tag on feature branches", () => {
		const result = computePublishMetadata(
			basePkg.name,
			basePkg.version,
			basePkg.build,
			"refs/heads/feature/multipart-upload"
		);
		assert.equal(result.publishVersion, "1.0.11-feature-multipart-upload.1");
		assert.equal(result.npmTag, "feature-multipart-upload");
	});

	it("sanitizes special characters and strips refs/heads/ prefix", () => {
		const result = computePublishMetadata(
			basePkg.name,
			basePkg.version,
			basePkg.build,
			"refs/heads/fix/some_weird.branch!"
		);
		assert.equal(result.npmTag, "fix-some-weird-branch");
		assert.equal(result.publishVersion, "1.0.11-fix-some-weird-branch.1");
	});

	it("extracts baseVersion idempotently when input version already has a suffix", () => {
		const result = computePublishMetadata(basePkg.name, "1.0.11-dev.4", "5", "develop");
		assert.equal(result.baseVersion, "1.0.11");
		assert.equal(result.publishVersion, "1.0.11-dev.5");
		assert.equal(result.npmTag, "dev");
	});

	it("throws when name, version, or build is missing or invalid", () => {
		assert.throws(
			() => computePublishMetadata("", "1.0.11", "1", "main"),
			/Field 'name' is required/
		);
		assert.throws(
			() => computePublishMetadata("@LeGrizzly/gofile", "", "1", "main"),
			/Field 'version' is required/
		);
		assert.throws(
			() => computePublishMetadata("@LeGrizzly/gofile", "1.0.11", "", "develop"),
			/Field 'build' must be a positive integer/
		);
		assert.throws(
			() => computePublishMetadata("@LeGrizzly/gofile", "1.0.11", "abc", "develop"),
			/Field 'build' must be a positive integer/
		);
	});
});
