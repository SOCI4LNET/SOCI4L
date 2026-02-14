import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying DonatePayment with the account:", deployer.address);

    // Get treasury from PremiumPayment contract
    const PREMIUM_PAYMENT_ADDRESS = "0x9bA02537447E6DcdeF72D0e98a4C82E6B73E3cCC";
    const premiumPayment = await ethers.getContractAt("PremiumPayment", PREMIUM_PAYMENT_ADDRESS);
    const treasuryAddress = await premiumPayment.treasury();

    console.log("Treasury address from PremiumPayment:", treasuryAddress);

    const DonatePayment = await ethers.getContractFactory("DonatePayment");
    const donatePayment = await DonatePayment.deploy(treasuryAddress);

    await donatePayment.waitForDeployment();

    const address = await donatePayment.getAddress();

    console.log("DonatePayment deployed to:", address);
    console.log("Treasury set to:", treasuryAddress);
    console.log("Platform fee:", await donatePayment.PLATFORM_FEE_PERCENT(), "%");
    console.log("Minimum donation:", ethers.formatEther(await donatePayment.MINIMUM_DONATION()), "AVAX");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
