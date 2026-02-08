import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
    solidity: "0.8.24",
    networks: {
        hardhat: {
        },
        truffle: {
            url: "http://localhost:24012/rpc",
            timeout: 300000,
        },
        avalanche: {
            url: "https://api.avax.network/ext/bc/C/rpc",
            chainId: 43114,
        },
        fuji: {
            url: "https://api.avax-test.network/ext/bc/C/rpc",
            chainId: 43113,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        // Snowtrace uses Blockscout, but hardhat-verify plugin supports it via custom chains or standard config if updated.
        // For now, we'll leave basic config.
        apiKey: {
            avalanche: process.env.SNOWTRACE_API_KEY || "",
            avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
        },
    },
};

export default config;
