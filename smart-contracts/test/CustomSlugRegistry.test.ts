import { expect } from "chai";
import { ethers } from "hardhat";

describe("CustomSlugRegistry", function () {
    let registry: any;
    let owner: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        const CustomSlugRegistry = await ethers.getContractFactory("CustomSlugRegistry");
        registry = await CustomSlugRegistry.deploy();
    });

    describe("Validation", function () {
        it("Should revert if slug is too short", async function () {
            await expect(registry.claim("ab")).to.be.revertedWithCustomError(registry, "InvalidSlugFormat");
        });

        it("Should revert if slug is too long", async function () {
            await expect(registry.claim("a".repeat(21))).to.be.revertedWithCustomError(registry, "InvalidSlugFormat");
        });

        it("Should revert if slug contains invalid characters", async function () {
            await expect(registry.claim("Test")).to.be.revertedWithCustomError(registry, "InvalidSlugFormat"); // Uppercase
            await expect(registry.claim("test!")).to.be.revertedWithCustomError(registry, "InvalidSlugFormat"); // Symbol
            await expect(registry.claim("test space")).to.be.revertedWithCustomError(registry, "InvalidSlugFormat"); // Space
        });

        it("Should revert if slug starts or ends with hyphen", async function () {
            await expect(registry.claim("-test")).to.be.revertedWithCustomError(registry, "InvalidSlugFormat");
            await expect(registry.claim("test-")).to.be.revertedWithCustomError(registry, "InvalidSlugFormat");
        });

        it("Should revert if slug has consecutive hyphens", async function () {
            await expect(registry.claim("te--st")).to.be.revertedWithCustomError(registry, "InvalidSlugFormat");
        });

        it("Should revert if slug is reserved", async function () {
            await expect(registry.claim("admin")).to.be.revertedWithCustomError(registry, "SlugReserved");
            await expect(registry.claim("api")).to.be.revertedWithCustomError(registry, "SlugReserved");
        });
    });

    describe("Claiming", function () {
        it("Should allow claiming a valid slug", async function () {
            const slug = "brokkr";
            const slugHash = ethers.keccak256(ethers.toUtf8Bytes(slug));

            await expect(registry.connect(user1).claim(slug))
                .to.emit(registry, "SlugClaimed")
                .withArgs(slugHash, user1.address, (await ethers.provider.getBlock("latest"))!.timestamp + 1)
                .to.emit(registry, "ActiveSlugSet")
                .withArgs(user1.address, slugHash);

            expect(await registry.resolveSlug(slugHash)).to.equal(user1.address);
            expect(await registry.getActiveSlug(user1.address)).to.equal(slugHash);
        });

        it("Should revert if user already has an active slug", async function () {
            await registry.connect(user1).claim("slug1");
            await expect(registry.connect(user1).claim("slug2")).to.be.revertedWithCustomError(registry, "MaxOneActiveSlug");
        });

        it("Should revert if slug is already taken", async function () {
            await registry.connect(user1).claim("taken");
            await expect(registry.connect(user2).claim("taken")).to.be.revertedWithCustomError(registry, "SlugAlreadyTaken");
        });
    });

    describe("Releasing and Cooldown", function () {
        it("Should allow releasing an active slug", async function () {
            await registry.connect(user1).claim("torelease");
            const slugHash = ethers.keccak256(ethers.toUtf8Bytes("torelease"));

            await expect(registry.connect(user1).release())
                .to.emit(registry, "SlugReleased");

            expect(await registry.resolveSlug(slugHash)).to.equal(ethers.ZeroAddress);
            expect(await registry.getActiveSlug(user1.address)).to.equal(ethers.ZeroHash);
        });

        it("Should revert release if no active slug", async function () {
            await expect(registry.connect(user1).release()).to.be.revertedWithCustomError(registry, "NoActiveSlug");
        });

        it("Should not allow claiming during cooldown", async function () {
            await registry.connect(user1).claim("cooldown");
            await registry.connect(user1).release();

            const slugHash = ethers.keccak256(ethers.toUtf8Bytes("cooldown"));

            // Try to claim immediately
            await expect(registry.connect(user2).claim("cooldown")).to.be.revertedWithCustomError(registry, "SlugInCooldown");
            // Original owner also blocked
            await expect(registry.connect(user1).claim("cooldown")).to.be.revertedWithCustomError(registry, "SlugInCooldown");
        });

        it("Should allow claiming after cooldown", async function () {
            await registry.connect(user1).claim("cooldown");
            await registry.connect(user1).release();

            // Fast forward 7 days + 1 second
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]);
            await ethers.provider.send("evm_mine", []);

            // User 2 claims
            await expect(registry.connect(user2).claim("cooldown")).to.emit(registry, "SlugClaimed");
        });

        it("Should allow user to claim new slug after releasing", async function () {
            await registry.connect(user1).claim("slug1");
            await registry.connect(user1).release();

            // Claim slug2
            await expect(registry.connect(user1).claim("slug2")).to.emit(registry, "SlugClaimed");
        });
    });
});
