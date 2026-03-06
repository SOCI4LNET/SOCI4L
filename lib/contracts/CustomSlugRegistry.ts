import { activeSlugRegistry } from '../chain-config'

export const CUSTOM_SLUG_REGISTRY_ADDRESS = activeSlugRegistry;

export const CUSTOM_SLUG_REGISTRY_ABI = [
    "function claim(string calldata _slug) external",
    "function release() external",
    "function resolveSlug(bytes32 slugHash) external view returns (address)",
    "function getSlugStatus(bytes32 slugHash) external view returns (address owner, uint256 releasedAt, uint256 cooldownEndsAt)",
    "function getActiveSlug(address user) external view returns (bytes32)",
    "event SlugClaimed(bytes32 indexed slugHash, address indexed owner, uint256 timestamp)",
    "event SlugReleased(bytes32 indexed slugHash, address indexed previousOwner, uint256 releasedAt, uint256 cooldownEndsAt)",
    "event ActiveSlugSet(address indexed owner, bytes32 indexed slugHash)",
    "function isReserved(string calldata _slug) external pure returns (bool)"
];
