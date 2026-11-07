import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	checkGitTagExists,
	checkRegistryVersionExists,
	verifyTagAndVersion,
} from "./verify-tag.ts";

describe("checkGitTagExists", () => {
	it("returns false when tag string is empty or whitespace", () => {
		assert.equal(checkGitTagExists(""), false);
		assert.equal(checkGitTagExists("   "), false);
	});

	it("returns true when git rev-parse finds a local tag sha", () => {
		const mockExecGit = (cmd: string) => {
			if (cmd.includes("rev-parse")) {
				return "d74fbf45961d5837b406c095355d83953ea559f3";
			}
			return "";
		};

		assert.equal(checkGitTagExists("v1.0.13", mockExecGit), true);
	});

	it("returns true when remote origin has the tag even if local throws", () => {
		const mockExecGit = (cmd: string) => {
			if (cmd.includes("rev-parse")) {
				throw new Error("fatal: ambiguous argument");
			}
			if (cmd.includes("ls-remote")) {
				return "d74fbf45961d5837b406c095355d83953ea559f3\trefs/tags/v1.0.13";
			}
			return "";
		};

		assert.equal(checkGitTagExists("v1.0.13", mockExecGit), true);
	});

	it("returns false when neither local nor remote finds the tag", () => {
		const mockExecGit = () => {
			throw new Error("not found");
		};

		assert.equal(checkGitTagExists("v99.99.99", mockExecGit), false);
	});
});

describe("checkRegistryVersionExists", () => {
	it("returns false when pkgName or version is empty", () => {
		assert.equal(checkRegistryVersionExists("", "1.0.0"), false);
		assert.equal(checkRegistryVersionExists("@scope/pkg", ""), false);
	});

	it("returns true when npm view returns matching version", () => {
		const mockExecNpm = () => "1.0.13";
		assert.equal(
			checkRegistryVersionExists("@LeGrizzly/gofile", "1.0.13", undefined, mockExecNpm),
			true
		);
	});

	it("returns false when npm view throws (e.g. 404 E404 not found)", () => {
		const mockExecNpm = () => {
			throw new Error("npm error code E404");
		};
		assert.equal(
			checkRegistryVersionExists("@LeGrizzly/gofile", "99.99.99", undefined, mockExecNpm),
			false
		);
	});
});

describe("verifyTagAndVersion", () => {
	it("validates successfully when tag and registry version do not exist", () => {
		const mockExecGit = () => "";
		const mockExecNpm = () => {
			throw new Error("E404");
		};

		const result = verifyTagAndVersion({
			gitTag: "v1.0.99",
			publishVersion: "1.0.99",
			pkgName: "@LeGrizzly/gofile",
			execGit: mockExecGit,
			execNpm: mockExecNpm,
		});

		assert.equal(result.valid, true);
		assert.equal(result.gitTagExists, false);
		assert.equal(result.registryVersionExists, false);
		assert.match(result.message, /Vérification validée/);
	});

	it("fails when git tag already exists", () => {
		const mockExecGit = () => "d74fbf45961d5837b406c095355d83953ea559f3";
		const mockExecNpm = () => {
			throw new Error("E404");
		};

		const result = verifyTagAndVersion({
			gitTag: "v1.0.13",
			publishVersion: "1.0.13",
			pkgName: "@LeGrizzly/gofile",
			execGit: mockExecGit,
			execNpm: mockExecNpm,
		});

		assert.equal(result.valid, false);
		assert.equal(result.gitTagExists, true);
		assert.match(result.message, /Le tag Git 'v1.0.13' existe déjà/);
	});

	it("fails when registry version already exists", () => {
		const mockExecGit = () => "";
		const mockExecNpm = () => "1.0.13-dev.1";

		const result = verifyTagAndVersion({
			gitTag: null,
			checkGit: false,
			publishVersion: "1.0.13-dev.1",
			pkgName: "@LeGrizzly/gofile",
			execGit: mockExecGit,
			execNpm: mockExecNpm,
		});

		assert.equal(result.valid, false);
		assert.equal(result.registryVersionExists, true);
		assert.match(result.message, /est déjà publiée sur le registre/);
	});

	it("allows existing when allowExisting is true", () => {
		const mockExecGit = () => "d74fbf45961d5837b406c095355d83953ea559f3";
		const mockExecNpm = () => "1.0.13";

		const result = verifyTagAndVersion({
			gitTag: "v1.0.13",
			publishVersion: "1.0.13",
			pkgName: "@LeGrizzly/gofile",
			allowExisting: true,
			execGit: mockExecGit,
			execNpm: mockExecNpm,
		});

		assert.equal(result.valid, true);
		assert.equal(result.gitTagExists, true);
		assert.equal(result.registryVersionExists, true);
	});
});
