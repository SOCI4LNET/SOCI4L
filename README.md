<div align="center">
  # SOCI4L
  
  **Turn any EVM wallet into a customizable, measurable, and shareable public profile.**

  <p>
    SOCI4L is an Avalanche-native public profile system built for the broader EVM ecosystem. It creates a premium public identity surface for your on-chain and off-chain existence.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Web3-Identity-blue?style=flat" alt="Web3 Identity" />
    <img src="https://img.shields.io/badge/EVM-Compatible-blueviolet?style=flat" alt="EVM Compatible" />
    <img src="https://img.shields.io/badge/Built_for-Avalanche-E84142?style=flat&logo=avalanche&logoColor=white" alt="Built for Avalanche" />
    <img src="https://img.shields.io/badge/Non--Custodial-Secure-success?style=flat" alt="Non-Custodial" />
  </p>

</div>

---

## The Vision

In the current Web3 landscape, wallets hold assets, transaction history, and reputation, yet they are not inherently human-readable or socially usable. Users often resort to sharing raw, complex cryptographic addresses instead of a unified, verifiable identity.

SOCI4L provides a solution by converting an abstract crypto wallet into a premium, public-facing identity surface. Users are equipped with a profile that aggregates their personalized links, automated portfolio value, NFT showcases, social context, and multichain activity. Crucially, all of this is tied securely to the user's wallet without requiring them to give up custody of their underlying assets. 

With SOCI4L, every wallet becomes a distinct public identity.

## Key Features

- **Universal Discoverability**: Create a SOCI4L profile with any EVM-compatible address. Key profile actions, including claims and username registrations (slugs), are recorded securely on the Avalanche C-Chain.
- **Direct On-Chain Tipping (Donate)**: Facilitate direct financial support for creators and builders via their SOCI4L profile using AVAX. Transactions are settled instantly on-chain, managed by custom smart contracts to ensure transparency and trust.
- **Premium Aesthetic Profiles**: Build high-quality, fully customizable profiles. Display your personalized bio, integrated social links, assigned roles (e.g., "Builder", "Trader"), and dynamic layouts tailored to your personal brand.
- **NFT and Asset Showcase**: Feature your prized NFTs directly on your profile through seamless OpenSea integration. Real-time token balances and portfolio valuations are fetched dynamically via SnowTrace and pricing oracles.
- **Comprehensive Dashboard**: Gain complete control over your decentralized identity. The dashboard offers an intuitive interface to manage visibility settings, reorganize external links, view detailed analytics, and track page engagement.
- **Privacy and Moderation Controls**: Maintain a secure social experience using built-in privacy settings, as well as robust blocking and muting features to curate interactions.

## Technology Stack

SOCI4L is built on a modern, performance-oriented stack designed to scale seamlessly across Web2 and Web3 paradigms.

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/) for server-side rendering, routing, and optimized performance.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for robust type safety and improved developer experience.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) paired with [shadcn/ui](https://ui.shadcn.com/) for rapid, accessible, and customizable interface design.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for global client state and [TanStack React Query](https://tanstack.com/query/latest) for efficient data fetching and caching.
- **Web3 Integration**: Engineered with [wagmi](https://wagmi.sh/), [viem](https://viem.sh/), and WalletConnect for secure and versatile wallet interactions and contract reads/writes.
- **Database & ORM**: [Prisma](https://www.prisma.io/) serves as the ORM layer, utilizing PostgreSQL in production and SQLite for streamlined local development.
- **Data Providers**: Integrates SnowTrace API for robust asset indexing, OpenSea API for NFT data, and CoinGecko for accurate price feeds.

## Installation and Setup

### 1. Clone the Repository
Clone the project to your local machine:
```bash
git clone https://github.com/fther/soci4l.git
cd soci4l
```

### 2. Install Dependencies
Install the required packages via npm:
```bash
npm install
```

### 3. Setup Environment Variables
Initialize your local environment configuration by creating a `.env` file in the root directory:
```bash
echo 'DATABASE_URL="file:./dev.db"' > .env
```

*Note: In local development, SQLite is configured by default to ensure ease of setup. The Prisma schema is optimized for PostgreSQL, which must be utilized in Production environments (e.g., when deploying to platforms like Vercel).*

**Optional but Recommended Variables:**
To utilize the full feature set of SOCI4L, you may configure the following API keys:
- `NEXT_PUBLIC_AVALANCHE_RPC`: Specify a custom Avalanche RPC endpoint for optimized blockchain reading.
- `OPENSEA_API_KEY`: Required to fetch comprehensive and consistent NFT meta-data directly from the Avalanche chain.
- `SNOWTRACE_API_KEY`: Upgrades your SnowTrace rate limits. Note that the free tier API functions adequately at up to 2 requests per second.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Enables robust wallet connection modalities via WalletConnect infrastructure.

### 4. Database Initialization
Synchronize the Prisma schema with your local database instance:
```bash
npm run db:push
npm run db:generate
```

### 5. Start Development Server
Boot up the Next.js development server:
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser to view and interact with the application.

## Contributing

Contributions from the open-source community are highly encouraged. If you have an idea for a feature, spot a bug, or wish to improve the documentation, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
