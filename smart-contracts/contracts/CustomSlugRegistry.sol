// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CustomSlugRegistry {
    // State
    struct SlugData {
        address owner;
        uint256 releasedAt;
    }

    mapping(bytes32 => SlugData) public slugs;
    mapping(address => bytes32) public activeSlugs;

    uint256 public constant COOLDOWN_PERIOD = 7 days;

    // Events
    event SlugClaimed(bytes32 indexed slugHash, address indexed owner, uint256 timestamp);
    event SlugReleased(bytes32 indexed slugHash, address indexed previousOwner, uint256 releasedAt, uint256 cooldownEndsAt);
    event ActiveSlugSet(address indexed owner, bytes32 indexed slugHash);

    // Errors
    error InvalidSlugFormat();
    error SlugReserved();
    error SlugAlreadyTaken();
    error SlugInCooldown();
    error MaxOneActiveSlug();
    error NoActiveSlug();

    /**
     * @notice Claim a custom slug.
     * @param _slug The desired slug string (must be lowercase, trimmed, valid chars).
     */
    function claim(string calldata _slug) external {
        _validateSlugFormat(_slug);
        
        bytes32 slugHash = keccak256(abi.encodePacked(_slug));
        
        if (_isReserved(slugHash)) revert SlugReserved();
        
        SlugData storage data = slugs[slugHash];
        
        if (data.owner != address(0)) revert SlugAlreadyTaken();
        
        // Check cooldown
        if (data.releasedAt != 0) {
            if (block.timestamp < data.releasedAt + COOLDOWN_PERIOD) {
                revert SlugInCooldown();
            }
        }
        
        if (activeSlugs[msg.sender] != bytes32(0)) revert MaxOneActiveSlug();

        data.owner = msg.sender;
        data.releasedAt = 0;
        activeSlugs[msg.sender] = slugHash;

        emit SlugClaimed(slugHash, msg.sender, block.timestamp);
        emit ActiveSlugSet(msg.sender, slugHash);
    }

    /**
     * @notice Release the currently active slug.
     */
    function release() external {
        bytes32 slugHash = activeSlugs[msg.sender];
        if (slugHash == bytes32(0)) revert NoActiveSlug();

        SlugData storage data = slugs[slugHash];
        data.owner = address(0);
        data.releasedAt = block.timestamp;
        
        delete activeSlugs[msg.sender];

        emit SlugReleased(slugHash, msg.sender, block.timestamp, block.timestamp + COOLDOWN_PERIOD);
    }

    // --- View Functions ---

    /**
     * @notice Resolve a slug hash to its owner.
     */
    function resolveSlug(bytes32 slugHash) external view returns (address) {
        return slugs[slugHash].owner;
    }

    /**
     * @notice Get full status of a slug.
     */
    function getSlugStatus(bytes32 slugHash) external view returns (address owner, uint256 releasedAt, uint256 cooldownEndsAt) {
        SlugData memory data = slugs[slugHash];
        uint256 endsAt = data.releasedAt == 0 ? 0 : data.releasedAt + COOLDOWN_PERIOD;
        return (data.owner, data.releasedAt, endsAt);
    }

    /**
     * @notice Get the active slug hash for a user.
     */
    function getActiveSlug(address user) external view returns (bytes32) {
        return activeSlugs[user];
    }

    // --- Internal Logic ---

    function _validateSlugFormat(string memory _slug) internal pure {
        bytes memory b = bytes(_slug);
        if (b.length < 3 || b.length > 20) revert InvalidSlugFormat();
        
        // No leading/trailing hyphen
        if (b[0] == 0x2d || b[b.length - 1] == 0x2d) revert InvalidSlugFormat();

        for (uint i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            // Allowed: 0-9 (0x30-0x39), a-z (0x61-0x7a), - (0x2d)
            bool isDigit = (char >= 0x30 && char <= 0x39);
            bool isLower = (char >= 0x61 && char <= 0x7a);
            bool isHyphen = (char == 0x2d);

            if (!isDigit && !isLower && !isHyphen) {
                revert InvalidSlugFormat();
            }
            
            // Check consecutive hyphens
            if (isHyphen && i > 0 && b[i-1] == 0x2d) {
                revert InvalidSlugFormat();
            }
        }
    }

    function isReserved(string calldata _slug) external pure returns (bool) {
        return _isReserved(keccak256(abi.encodePacked(_slug)));
    }

    function _isReserved(bytes32 slugHash) internal pure returns (bool) {
        if (slugHash == keccak256(abi.encodePacked("admin"))) return true;
        if (slugHash == keccak256(abi.encodePacked("root"))) return true;
        if (slugHash == keccak256(abi.encodePacked("support"))) return true;
        if (slugHash == keccak256(abi.encodePacked("help"))) return true;
        if (slugHash == keccak256(abi.encodePacked("api"))) return true;
        if (slugHash == keccak256(abi.encodePacked("dashboard"))) return true;
        if (slugHash == keccak256(abi.encodePacked("settings"))) return true;
        if (slugHash == keccak256(abi.encodePacked("pricing"))) return true;
        if (slugHash == keccak256(abi.encodePacked("terms"))) return true;
        if (slugHash == keccak256(abi.encodePacked("privacy"))) return true;
        if (slugHash == keccak256(abi.encodePacked("docs"))) return true;
        if (slugHash == keccak256(abi.encodePacked("blog"))) return true;
        if (slugHash == keccak256(abi.encodePacked("www"))) return true;
        
        // New restricted words
        if (slugHash == keccak256(abi.encodePacked("moderator"))) return true;
        if (slugHash == keccak256(abi.encodePacked("mod"))) return true;
        if (slugHash == keccak256(abi.encodePacked("avax"))) return true;
        if (slugHash == keccak256(abi.encodePacked("avalanche"))) return true;
        if (slugHash == keccak256(abi.encodePacked("foundation"))) return true;
        if (slugHash == keccak256(abi.encodePacked("official"))) return true;
        if (slugHash == keccak256(abi.encodePacked("public"))) return true;
        if (slugHash == keccak256(abi.encodePacked("legal"))) return true;
        if (slugHash == keccak256(abi.encodePacked("security"))) return true;
        if (slugHash == keccak256(abi.encodePacked("status"))) return true;
        if (slugHash == keccak256(abi.encodePacked("about"))) return true;
        if (slugHash == keccak256(abi.encodePacked("contact"))) return true;
        if (slugHash == keccak256(abi.encodePacked("login"))) return true;
        if (slugHash == keccak256(abi.encodePacked("register"))) return true;
        if (slugHash == keccak256(abi.encodePacked("auth"))) return true;
        if (slugHash == keccak256(abi.encodePacked("account"))) return true;
        if (slugHash == keccak256(abi.encodePacked("profile"))) return true;
        
        return false;
    }
}
