// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PremiumPayment
 * @notice A simple, immutable contract for SOCI4L premium payments.
 * @dev Enforces 0.5 AVAX payment, forwards funds to treasury, emits proof event.
 */
contract PremiumPayment {
    // --- Configuration ---
    
    // Fixed price: 0.5 AVAX
    uint256 public constant PREMIUM_PRICE = 0.5 ether;
    
    // Fixed duration: 365 days
    uint256 public constant PREMIUM_DURATION = 365 days;

    // Immutable treasury address (set once at deployment)
    address public immutable treasury;

    // --- Events ---

    /**
     * @notice Emitted when a user successfully pays for premium.
     * @param user The address of the user who paid (msg.sender).
     * @param paidAt The timestamp of the payment.
     * @param expiresAt The calculated expiration timestamp (paidAt + 365 days).
     * @param amount The amount paid (always 0.5 AVAX).
     */
    event PremiumPurchased(
        address indexed user,
        uint256 paidAt,
        uint256 expiresAt,
        uint256 amount
    );

    // --- Errors ---

    error IncorrectPaymentAmount();
    error TransferFailed();
    error InvalidTreasury();

    /**
     * @notice Contract constructor.
     * @param _treasury The address that will receive all premium payments.
     */
    constructor(address _treasury) {
        if (_treasury == address(0)) {
            revert InvalidTreasury();
        }
        treasury = _treasury;
    }

    /**
     * @notice Pay 0.5 AVAX to unlock premium features for 1 year.
     * @dev Funds are immediately forwarded to the treasury.
     *      Indexing relies on the PremiumPurchased event.
     */
    function payPremium() external payable {
        if (msg.value != PREMIUM_PRICE) {
            revert IncorrectPaymentAmount();
        }

        // 1. Calculate expiration
        uint256 paidAt = block.timestamp;
        uint256 expiresAt = paidAt + PREMIUM_DURATION;

        // 2. Forward Funds to Treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        if (!success) {
            revert TransferFailed();
        }

        // 3. Emit Proof Event
        emit PremiumPurchased(msg.sender, paidAt, expiresAt, msg.value);
    }
}
