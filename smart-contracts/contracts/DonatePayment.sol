// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DonatePayment
 * @notice A simple, immutable contract for SOCI4L donations with platform fee.
 * @dev Takes 3% platform fee, forwards 97% to recipient, emits proof event.
 */
contract DonatePayment {
    // --- Configuration ---
    
    // Platform fee: 3%
    uint256 public constant PLATFORM_FEE_PERCENT = 3;
    uint256 public constant FEE_DENOMINATOR = 100;
    
    // Minimum donation: 0.01 AVAX (prevents dust/gas waste)
    uint256 public constant MINIMUM_DONATION = 0.01 ether;

    // Immutable treasury address (set once at deployment)
    address public immutable treasury;

    // --- Events ---

    /**
     * @notice Emitted when a user successfully donates.
     * @param sender The address of the donor (msg.sender).
     * @param recipient The address receiving the donation.
     * @param totalAmount The total amount sent by donor.
     * @param recipientAmount The amount received by recipient (97%).
     * @param platformFee The fee sent to treasury (3%).
     * @param message Optional message from donor.
     * @param timestamp The timestamp of the donation.
     */
    event DonationSent(
        address indexed sender,
        address indexed recipient,
        uint256 totalAmount,
        uint256 recipientAmount,
        uint256 platformFee,
        string message,
        uint256 timestamp
    );

    // --- Errors ---

    error InvalidRecipient();
    error InvalidTreasury();
    error BelowMinimumDonation();
    error TransferFailed();

    /**
     * @notice Contract constructor.
     * @param _treasury The address that will receive all platform fees.
     */
    constructor(address _treasury) {
        if (_treasury == address(0)) {
            revert InvalidTreasury();
        }
        treasury = _treasury;
    }

    /**
     * @notice Donate AVAX to a recipient with optional message.
     * @dev 3% goes to treasury, 97% goes to recipient.
     * @param recipient The address to receive the donation.
     * @param message Optional message from the donor.
     */
    function donate(address recipient, string memory message) external payable {
        // Validation
        if (recipient == address(0)) {
            revert InvalidRecipient();
        }
        if (msg.value < MINIMUM_DONATION) {
            revert BelowMinimumDonation();
        }

        // Calculate amounts
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENT) / FEE_DENOMINATOR;
        uint256 recipientAmount = msg.value - platformFee;

        // 1. Send fee to treasury
        (bool treasurySuccess, ) = treasury.call{value: platformFee}("");
        if (!treasurySuccess) {
            revert TransferFailed();
        }

        // 2. Send donation to recipient
        (bool recipientSuccess, ) = recipient.call{value: recipientAmount}("");
        if (!recipientSuccess) {
            revert TransferFailed();
        }

        // 3. Emit event
        emit DonationSent(
            msg.sender,
            recipient,
            msg.value,
            recipientAmount,
            platformFee,
            message,
            block.timestamp
        );
    }

    /**
     * @notice View function to preview fee calculation.
     * @param amount The donation amount to preview.
     * @return recipientAmount Amount that will go to recipient.
     * @return platformFee Amount that will go to platform.
     */
    function previewDonation(uint256 amount) external pure returns (uint256 recipientAmount, uint256 platformFee) {
        platformFee = (amount * PLATFORM_FEE_PERCENT) / FEE_DENOMINATOR;
        recipientAmount = amount - platformFee;
    }
}
