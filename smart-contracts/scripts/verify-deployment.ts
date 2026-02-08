import { ethers } from "hardhat";

async function main() {
    const CONTRACT_ADDRESS = "0x9bA02537447E6DcdeF72D0e98a4C82E6B73E3cCC";

    console.log("Reading contract state at:", CONTRACT_ADDRESS);

    const PremiumPayment = await ethers.getContractFactory("PremiumPayment");
    const contract = PremiumPayment.attach(CONTRACT_ADDRESS);

    try {
        const treasury = await contract.treasury();
        console.log("Treasury Address:", treasury);

        const price = await contract.PREMIUM_PRICE();
        console.log("Premium Price:", ethers.formatEther(price), "AVAX");

        const duration = await contract.PREMIUM_DURATION();
        console.log("Duration:", duration.toString(), "seconds");

    } catch (error) {
        console.error("Error reading contract:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
