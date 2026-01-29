
async function testAnalytics() {
    const profileId = '0x1234567890123456789012345678901234567890';
    console.log('Testing Analytics Event Creation...');

    try {
        const response = await fetch('http://localhost:3000/api/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'profile_view',
                profileId: profileId,
                source: 'test'
            })
        });

        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response body:', text);
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

testAnalytics();
