import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const CustomSlugRegistry = await ethers.getContractFactory("CustomSlugRegistry");
    const registry = await CustomSlugRegistry.deploy();

    await registry.waitForDeployment();

    const address = await registry.getAddress();

    console.log("CustomSlugRegistry deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
