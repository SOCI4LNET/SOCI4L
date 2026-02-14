import { ethers } from "hardhat";

async function main() {
    const CONTRACT_ADDRESS = "0x863deaF39D816fBA5D10E3e846a2D953Aa9aEca5";

    console.log("Checking DonatePayment at:", CONTRACT_ADDRESS);

    const contract = await ethers.getContractAt("DonatePayment", CONTRACT_ADDRESS);

    try {
        const treasury = await contract.treasury();
        console.log("Treasury Address:", treasury);

        const feePercent = await contract.PLATFORM_FEE_PERCENT();
        console.log("Platform Fee:", feePercent.toString(), "%");

        const minDonation = await contract.MINIMUM_DONATION();
        console.log("Minimum Donation:", ethers.formatEther(minDonation), "AVAX");

        // Test preview
        const testAmount = ethers.parseEther("1.0");
        const [recipientAmount, platformFee] = await contract.previewDonation(testAmount);
        console.log("\nPreview for 1.0 AVAX donation:");
        console.log("  Recipient gets:", ethers.formatEther(recipientAmount), "AVAX");
        console.log("  Platform fee:", ethers.formatEther(platformFee), "AVAX");

    } catch (error) {
        console.error("Error reading contract:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
