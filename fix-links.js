const fs = require('fs');
let code = fs.readFileSync('components/dashboard/links-panel.tsx', 'utf8');

const replacement = `                                }

                                const linkUsername = getUsernameFromUrl(link.url)
                                const privyUsername = normalizeHandle(userData?.username)
                                const isVerified = link.verified
                                const platformHasConnectedAccount = Boolean(userData?.subject)
                                const isConflict = socialConflictByPlatform[config.apiPlatformName as 'twitter' | 'github']
                                const isPendingVerification =
                                  pendingVerification?.linkId === link.id &&
                                  pendingVerification?.platform === config.apiPlatformName
                                const hasUrlMismatch = Boolean(
                                  linkUsername && privyUsername && linkUsername !== privyUsername
                                )

                                // --- DURUM 1: Zaten Doğrulanmış ---`;

// The exact pattern in the file:
// }
// )
//
// // --- DURUM 1: Zaten Doğrulanmış ---

// regex replacement
code = code.replace(/}[ \t]*\n[ \t]*\)[ \t]*\n\n[ \t]*\/\/ --- DURUM 1: Zaten Doğrulanmış ---/, replacement);
fs.writeFileSync('components/dashboard/links-panel.tsx', code);
console.log("Fixed Links Panel!");
