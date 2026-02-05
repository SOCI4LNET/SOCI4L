// SOCI4L Connector Content Script

const API_BASE_URL = "https://soci4l.net";
// const API_BASE_URL = "http://localhost:3000";

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
    // X.com uses UserName and User-Name in different places
    userName: '[data-testid="UserName"], [data-testid="User-Name"]',
    userLink: 'a[href*="/"]',
};

/**
 * Extract handle from a User-Name element or URL
 */
function extractHandle(element) {
    // Logic to find @username inside the element
    // On X, the handle is usually in a span starting with @
    const spans = element.querySelectorAll('span');
    for (const span of spans) {
        const text = span.innerText;
        const match = text.match(/@([a-zA-Z0-9_]+)/);
        if (match) return match[1];
    }

    const text = element.innerText;
    const match = text.match(/@([a-zA-Z0-9_]+)/);
    if (match) return match[1];

    // Fallback: check href of parent anchor
    const anchor = element.closest('a');
    if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('/') && !href.includes('/status/')) {
            const handle = href.substring(1);
            if (!['home', 'explore', 'notifications', 'messages', 'i', 'settings'].includes(handle.toLowerCase())) {
                return handle;
            }
        }
    }
    return null;
}

/**
 * Check API for verification status
 */
async function checkVerification(handle) {
    if (processedHandles.has(handle)) return verifiedHandles.get(handle);

    try {
        const response = await fetch(`${API_BASE_URL}/api/social/lookup?platform=twitter&handle=${handle}`);
        if (response.ok) {
            const data = await response.json();
            if (data.isVerified) {
                verifiedHandles.set(handle, data.profile);
                processedHandles.add(handle);
                return data.profile;
            }
        }
    } catch (err) {
        console.error("[SOCI4L] Lookup failed:", err);
    }

    // If not verified, we still add to processed to skip repeated failed requests
    processedHandles.add(handle);
    return null;
}

/**
 * Inject Badge
 */
function injectBadge(element, profile) {
    if (element.querySelector('.soci4l-badge') || element.closest('.soci4l-badge-container')) return; // Already injected

    const badge = document.createElement('span');
    badge.className = 'soci4l-badge';
    badge.title = `SOCI4L Verified Profile: ${profile.displayName || profile.address}`;
    badge.innerHTML = BADGE_ICON + `
    <div class="soci4l-tooltip">
      <div class="soci4l-verified-text">
        <span>✓ SOCI4L Verified</span>
      </div>
      <div class="soci4l-profile-info">${profile.displayName || profile.address.slice(0, 6)}</div>
    </div>
  `;

    badge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`${API_BASE_URL}/p/${profile.slug || profile.address}`, '_blank');
    };

    // We want to insert next to the display name, but after any existing verification badge
    // X's structure: <span>DisplayName</span> <svgBadge />

    // Look for verified badge near the element
    const container = element.parentElement || element;
    const existingBadge = container.querySelector('svg[aria-label*="Verified"], svg[aria-label*="doğrulanmış"], [data-testid="icon-verified"]');

    if (existingBadge) {
        // Find the outermost wrapper of the checkmark to insert next to it
        let badgeWrapper = existingBadge;
        while (badgeWrapper.parentElement &&
            badgeWrapper.parentElement !== container &&
            (badgeWrapper.parentElement.tagName === 'DIV' || badgeWrapper.parentElement.tagName === 'SPAN')) {
            badgeWrapper = badgeWrapper.parentElement;
        }
        badgeWrapper.insertAdjacentElement('afterend', badge);
    } else {
        // Fallback: search deeper if the element itself is just a span
        element.appendChild(badge);
    }
}

/**
 * Main Observer
 */
function scanPage() {
    const userNameElements = document.querySelectorAll(SELECTORS.userName);

    userNameElements.forEach(async (el) => {
        // Avoid re-processing same element too often
        if (el.hasAttribute('data-soci4l-processed')) return;
        el.setAttribute('data-soci4l-processed', 'true');

        const handle = extractHandle(el);
        if (!handle) return;

        const profile = await checkVerification(handle);

        if (profile) {
            // Target the display name specifically
            // It's usually a span inside the first div/a
            const nameWrapper = el.querySelector('span'); // First span is usually display name
            if (nameWrapper) {
                injectBadge(nameWrapper.parentElement || nameWrapper, profile);
            } else {
                injectBadge(el, profile);
            }
        }
    });
}

// Run scanner using MutationObserver with debouncing
let timeout = null;
const observer = new MutationObserver((mutations) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(scanPage, 100);
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial scan
setTimeout(scanPage, 500);
console.log("[SOCI4L] Observer started");
