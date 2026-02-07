// Migration to release test slug
// Run with: truffle migrate --f 4 --to 4 --network dashboard

const CustomSlugRegistry = artifacts.require("CustomSlugRegistry");

module.exports = async function (deployer, network, accounts) {
    console.log("\n🧹 Releasing test slug...");
    console.log("Network:", network);
    console.log("Account:", accounts[0]);

    const registry = await CustomSlugRegistry.at("0xC894a2677C7E619E9692E3bF4AFF58bE53173aA1");

    // Check active slug
    const activeSlug = await registry.getActiveSlug(accounts[0]);
    console.log("Active slug hash:", activeSlug);

    if (activeSlug === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log("✅ No active slug - already clean");
        return;
    }

    // Release slug
    console.log("🧹 Releasing slug...");
    const tx = await registry.release({ from: accounts[0] });
    console.log("✅ Released! Transaction:", tx.tx);
    console.log("Gas used:", tx.receipt.gasUsed);
};
