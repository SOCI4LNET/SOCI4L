import { expect } from "chai";
import { ethers } from "hardhat";
import { DonatePayment } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DonatePayment", function () {
    let donatePayment: DonatePayment;
    let treasury: SignerWithAddress;
    let donor: SignerWithAddress;
    let recipient: SignerWithAddress;

    before(async function () {
        [treasury, donor, recipient] = await ethers.getSigners();
    });

    beforeEach(async function () {
        const DonatePayment = await ethers.getContractFactory("DonatePayment");
        donatePayment = await DonatePayment.deploy(treasury.address);
        await donatePayment.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct treasury address", async function () {
            expect(await donatePayment.treasury()).to.equal(treasury.address);
        });

        it("Should set correct constants", async function () {
            expect(await donatePayment.PLATFORM_FEE_PERCENT()).to.equal(3);
            expect(await donatePayment.FEE_DENOMINATOR()).to.equal(100);
            expect(await donatePayment.MINIMUM_DONATION()).to.equal(ethers.parseEther("0.01"));
        });

        it("Should reject zero address as treasury", async function () {
            const DonatePayment = await ethers.getContractFactory("DonatePayment");
            await expect(
                DonatePayment.deploy(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(DonatePayment, "InvalidTreasury");
        });
    });

    describe("Donation", function () {
        const donationAmount = ethers.parseEther("1.0"); // 1 AVAX

        it("Should successfully donate with correct fee split", async function () {
            const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);

            const expectedFee = (donationAmount * 3n) / 100n; // 3%
            const expectedRecipientAmount = donationAmount - expectedFee; // 97%

            await expect(
                donatePayment.connect(donor).donate(recipient.address, "Keep building! 🚀", {
                    value: donationAmount
                })
            ).to.emit(donatePayment, "DonationSent")
                .withArgs(
                    donor.address,
                    recipient.address,
                    donationAmount,
                    expectedRecipientAmount,
                    expectedFee,
                    "Keep building! 🚀",
                    await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1)
                );

            const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);

            expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee);
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(expectedRecipientAmount);
        });

        it("Should work with empty message", async function () {
            await expect(
                donatePayment.connect(donor).donate(recipient.address, "", {
                    value: donationAmount
                })
            ).to.emit(donatePayment, "DonationSent");
        });

        it("Should reject donation below minimum", async function () {
            const tooSmall = ethers.parseEther("0.005"); // 0.005 AVAX
            await expect(
                donatePayment.connect(donor).donate(recipient.address, "", {
                    value: tooSmall
                })
            ).to.be.revertedWithCustomError(donatePayment, "BelowMinimumDonation");
        });

        it("Should reject zero address as recipient", async function () {
            await expect(
                donatePayment.connect(donor).donate(ethers.ZeroAddress, "", {
                    value: donationAmount
                })
            ).to.be.revertedWithCustomError(donatePayment, "InvalidRecipient");
        });

        it("Should calculate exact 3% fee", async function () {
            const amounts = [
                ethers.parseEther("0.1"),
                ethers.parseEther("0.5"),
                ethers.parseEther("1.0"),
                ethers.parseEther("10.0"),
            ];

            for (const amount of amounts) {
                const [recipientAmount, platformFee] = await donatePayment.previewDonation(amount);
                expect(platformFee).to.equal((amount * 3n) / 100n);
                expect(recipientAmount).to.equal(amount - platformFee);
                expect(recipientAmount + platformFee).to.equal(amount);
            }
        });

        it("Should handle multiple donations correctly", async function () {
            const donate1 = ethers.parseEther("0.5");
            const donate2 = ethers.parseEther("1.0");

            const treasuryBefore = await ethers.provider.getBalance(treasury.address);

            await donatePayment.connect(donor).donate(recipient.address, "First", { value: donate1 });
            await donatePayment.connect(donor).donate(recipient.address, "Second", { value: donate2 });

            const treasuryAfter = await ethers.provider.getBalance(treasury.address);
            const totalFee = (donate1 * 3n) / 100n + (donate2 * 3n) / 100n;

            expect(treasuryAfter - treasuryBefore).to.equal(totalFee);
        });
    });

    describe("Preview Donation", function () {
        it("Should correctly preview donation amounts", async function () {
            const testAmount = ethers.parseEther("1.0");
            const [recipientAmount, platformFee] = await donatePayment.previewDonation(testAmount);

            expect(platformFee).to.equal(ethers.parseEther("0.03")); // 3%
            expect(recipientAmount).to.equal(ethers.parseEther("0.97")); // 97%
        });
    });
});
