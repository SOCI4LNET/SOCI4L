import { ethers } from "hardhat";

async function main() {
    const premiumAddress = "0x9bA02537447E6DcdeF72D0e98a4C82E6B73E3cCC";
    console.log("Checking PremiumPayment at:", premiumAddress);

    const PremiumPayment = await ethers.getContractFactory("PremiumPayment");
    const premium = PremiumPayment.attach(premiumAddress);

    try {
        const price = await premium.PREMIUM_PRICE();
        console.log("Price:", ethers.formatEther(price), "AVAX");

        const treasury = await premium.treasury();
        console.log("Treasury:", treasury);

        // Check if treasury is a contract
        const code = await ethers.provider.getCode(treasury);
        if (code === "0x") {
            console.log("Treasury is an EOA (Wallet)");
        } else {
            console.log("Treasury is a Contract");
        }

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
