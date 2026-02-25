/**
 * Utility to convert complex blockchain/viem errors into user-friendly messages.
 */
export function getFriendlyErrorMessage(error: any, fallback?: string): string {
    if (!error) return fallback || 'An unknown error occurred';

    const message = error.message || String(error);
    const name = error.name || '';

    // 1. Handle User Rejection (most common request)
    if (
        message.includes('User rejected the request') ||
        message.includes('UserRejectedRequestError') ||
        name === 'UserRejectedRequestError' ||
        message.includes('User denied message signature')
    ) {
        return 'Transaction rejected by user';
    }

    // 2. Handle Insufficient Funds
    if (message.toLowerCase().includes('insufficient funds')) {
        return 'Insufficient funds for this transaction';
    }

    // 3. Handle Network/RPC issues
    if (message.includes('network') || message.includes('rpc') || message.includes('fetch')) {
        return 'Network error. Please check your connection.';
    }

    // 4. Handle Specific Contract Errors (customized as needed)
    if (message.includes('BelowMinimumDonation')) {
        return 'Amount too small (minimum 0.01 AVAX)';
    }

    // 5. Smart Fallback: Extract the first meaningful line of a viem error
    // Viem error messages are often multiline and very verbose.
    const lines = message.split('\n');
    const firstLine = lines[0].trim();

    // If the first line is short and doesn't look like generic technical junk, use it
    if (firstLine && firstLine.length < 120 && !firstLine.includes('Details:')) {
        return firstLine;
    }

    return fallback || 'An error occurred. Please try again.';
}
