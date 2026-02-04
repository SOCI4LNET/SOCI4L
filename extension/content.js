// SOCI4L Connector Content Script

const API_BASE_URL = "http://localhost:3000"; // TODO: Switch to production URL in build
// const API_BASE_URL = "https://soci4l.com";

console.log("[SOCI4L] Extension loaded on X.com");

// Icon SVG (Brand Logo or Checkmark)
const BADGE_ICON = `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
</svg>`;

// Cache to prevent repetitive lookups
const processedHandles = new Set();
const verifiedHandles = new Map(); // handle -> profile data

// Config
const SELECTORS = {
    // X.com selectors are tricky and obfuscated. We target robust attributes where possible
    // Targeting the user name in the profile header and tweet headers
    userName: '[data-testid="User-Name"]',
    userLink: 'a[href*="/"]', // simplified
};

/**
 * Extract handle from a User-Name element or URL
 */
function extractHandle(element) {
    // Logic to find @username inside the element
    // On X, the handle is usually in a span starting with @
    const text = element.innerText;
    const match = text.match(/@([a-zA-Z0-9_]+)/);
    if (match) return match[1];

    // Fallback: check href of parent anchor
    const anchor = element.closest('a');
    if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('/') && !href.includes('/status/')) {
            return href.substring(1);
        }
    }
    return null;
}

/**
 * Check API for verification status
 */
async function checkVerification(handle) {
    if (processedHandles.has(handle)) return verifiedHandles.get(handle);

    processedHandles.add(handle);

    try {
        const response = await fetch(`${API_BASE_URL}/api/social/lookup?platform=twitter&handle=${handle}`);
        if (response.ok) {
            const data = await response.json();
            if (data.isVerified) {
                verifiedHandles.set(handle, data.profile);
                return data.profile;
            }
        }
    } catch (err) {
        console.error("[SOCI4L] Lookup failed:", err);
    }
    return null;
}

/**
 * Inject Badge
 */
function injectBadge(element, profile) {
    if (element.querySelector('.soci4l-badge')) return; // Already injected

    const badge = document.createElement('span');
    badge.className = 'soci4l-badge';
    badge.innerHTML = BADGE_ICON + `
    <div class="soci4l-tooltip">
      <div class="soci4l-verified-text">
        <span>✓ SOCI4L Verified</span>
      </div>
      <div>${profile.displayName || profile.address.slice(0, 6)}</div>
    </div>
  `;

    badge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`${API_BASE_URL}/p/${profile.slug || profile.address}`, '_blank');
    };

    // Find where to append. Usually after the name or handle.
    // X structure: Name (flex) -> span -> span
    // We try appending to the flex container key ID
    element.appendChild(badge);
}

/**
 * Main Observer
 */
function scanPage() {
    const userNameElements = document.querySelectorAll(SELECTORS.userName);

    userNameElements.forEach(async (el) => {
        const handle = extractHandle(el);
        if (!handle) return;

        // Check cache or API
        const profile = await checkVerification(handle);

        if (profile) {
            // Inject badge
            // We look for the "Name" part specifically to append next to it, 
            // avoiding the handle (@username) line if possible, or appending to the container

            // X.com DOM is nested. We want to append next to the display name.
            // Usually the first child of User-Name container has the display name.
            const namePart = el.querySelector('div:first-child a span:first-child') || el.firstChild;
            if (namePart) {
                injectBadge(namePart.parentElement || el, profile);
            } else {
                injectBadge(el, profile);
            }
        }
    });
}

// Run scanner using MutationObserver
const observer = new MutationObserver((mutations) => {
    // Debounce or just run? X is heavy, let's throttle slightly if needed
    // For V1, just running scanPage is fine as it's efficient with Set checks
    scanPage();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial scan
setTimeout(scanPage, 1000);
console.log("[SOCI4L] Observer started");
