import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying PremiumPayment with the account:", deployer.address);

    const PremiumPayment = await ethers.getContractFactory("PremiumPayment");
    // Deploy with the deployer as the Treasury
    const premiumPayment = await PremiumPayment.deploy(deployer.address);

    await premiumPayment.waitForDeployment();

    const address = await premiumPayment.getAddress();

    console.log("PremiumPayment deployed to:", address);
    console.log("Treasury set to:", deployer.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
