// Check the routes exposed by the actual running backend, not a mocked API.
// No credentials, data reads, or mutations: management endpoints must reject anonymous requests.
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
(async () => {
    const results = [];
    for (const path of ['', '/inbox-counts', '/handlers']) {
        const url = new URL('/umbraco/management/api/v1/antc/questions' + path, base);
        const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(8000) });
        results.push({ path: url.pathname, status: response.status });
        assert([401, 403].includes(response.status),
            `${url.pathname}: expected protected route (401/403), received ${response.status}. Rebuild and restart the backend if it returns 404.`);
    }
    console.log(JSON.stringify({ passed: true, results }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
