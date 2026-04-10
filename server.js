const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const ADMIN_KEY = String(process.env.ADMIN_KEY || '123456').trim();
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'auth-data.json');

const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            users: [],
            invites: [],
            sessions: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}

function readData() {
    ensureDataFile();
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            invites: Array.isArray(parsed.invites) ? parsed.invites : [],
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
        };
    } catch (error) {
        return {
            users: [],
            invites: [],
            sessions: []
        };
    }
}

function writeData(data) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function now() {
    return Date.now();
}

function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key, X-Admin-Token',
        'Access-Control-Max-Age': '86400'
    };
}

function json(res, statusCode, payload) {
    res.writeHead(statusCode, {
        ...getCorsHeaders(),
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(payload));
}

function sendNoContent(res) {
    res.writeHead(204, getCorsHeaders());
    res.end();
}

function notFound(res) {
    json(res, 404, { message: '接口不存在' });
}

function methodNotAllowed(res) {
    json(res, 405, { message: '请求方法不允许' });
}

function badRequest(res, message) {
    json(res, 400, { message });
}

function unauthorized(res, message) {
    json(res, 401, { message: message || '管理员验证失败' });
}

function randomId(prefix) {
    return `${prefix}_${now()}_${crypto.randomBytes(8).toString('hex')}`;
}

function sha256(value) {
    return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
}

function publicUser(user) {
    if (!user) return null;
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        createdAt: user.createdAt
    };
}

function sanitizeInvite(invite) {
    return {
        code: invite.code,
        used: !!invite.used,
        createdAt: invite.createdAt || null,
        usedAt: invite.usedAt || null,
        usedBy: invite.usedBy || null
    };
}

function cleanupExpiredSessions(data) {
    const current = now();
    data.sessions = data.sessions.filter((item) => Number(item.expiresAt || 0) > current);
}

function getBearerToken(req) {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : '';
}

function getAdminKey(req) {
    return String(
        req.headers['x-admin-key']
        || req.headers['x-admin-token']
        || req.headers.authorization?.replace(/^Admin\s+/i, '')
        || ''
    ).trim();
}

function isAuthorizedAdmin(req) {
    if (!ADMIN_KEY) return true;
    return getAdminKey(req) === ADMIN_KEY;
}

function getUserSession(data, token) {
    if (!token) return null;
    cleanupExpiredSessions(data);
    return data.sessions.find((item) => item.token === token) || null;
}

function createUserSession(data, username) {
    const token = crypto.randomBytes(24).toString('hex');
    const session = {
        token,
        username,
        createdAt: now(),
        expiresAt: now() + SESSION_TTL
    };
    data.sessions = data.sessions.filter((item) => item.username !== username);
    data.sessions.push(session);
    return session;
}

function randomChars(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i += 1) {
        const index = crypto.randomInt(0, chars.length);
        result += chars[index];
    }
    return result;
}

function randomInviteLength() {
    return crypto.randomInt(6, 9);
}

function generateInvites(data, count) {
    const safeCount = Math.max(1, Math.min(200, Number.parseInt(count, 10) || 1));
    const existingCodes = new Set(data.invites.map((item) => String(item.code || '').toUpperCase()));
    const created = [];

    while (created.length < safeCount) {
        const code = randomChars(randomInviteLength()).toUpperCase();
        if (existingCodes.has(code)) continue;
        existingCodes.add(code);

        const invite = {
            code,
            used: false,
            createdAt: now(),
            usedAt: null,
            usedBy: null
        };

        data.invites.unshift(invite);
        created.push(invite);
    }

    return created.map(sanitizeInvite);
}

function getSortedInvites(data) {
    return data.invites
        .slice()
        .sort((a, b) => {
            if (!!a.used !== !!b.used) return a.used ? 1 : -1;
            return (b.createdAt || 0) - (a.createdAt || 0);
        })
        .map(sanitizeInvite);
}

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (chunk) => {
            raw += chunk;
            if (raw.length > 1024 * 1024) {
                reject(new Error('请求体过大'));
                req.destroy();
            }
        });
        req.on('end', () => {
            if (!raw) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(raw));
            } catch (error) {
                reject(new Error('请求体不是合法 JSON'));
            }
        });
        req.on('error', reject);
    });
}

async function handleApi(req, res, url) {
    const pathname = url.pathname;
    const data = readData();
    cleanupExpiredSessions(data);

    if (req.method === 'OPTIONS') {
        return sendNoContent(res);
    }

    if (pathname.startsWith('/api/admin/') && !isAuthorizedAdmin(req)) {
        return unauthorized(res, '管理员口令错误或未提供');
    }

    if (pathname === '/api/register') {
        if (req.method !== 'POST') return methodNotAllowed(res);

        let body;
        try {
            body = await parseRequestBody(req);
        } catch (error) {
            return badRequest(res, error.message);
        }

        const username = String(body.username || '').trim();
        const normalized = normalizeUsername(username);
        const password = String(body.password || '');
        const inviteCode = String(body.inviteCode || '').trim().toUpperCase();

        if (!username) return badRequest(res, '请输入账号');
        if (username.length < 6) return badRequest(res, '账号至少 6 位');
        if (!password) return badRequest(res, '请输入密码');
        if (password.length < 6) return badRequest(res, '密码至少 6 位');
        if (!inviteCode) return badRequest(res, '请输入邀请码');

        if (data.users.some((item) => normalizeUsername(item.username) === normalized)) {
            return badRequest(res, '该账号已存在');
        }

        const invite = data.invites.find((item) => String(item.code || '').toUpperCase() === inviteCode);
        if (!invite) return badRequest(res, '邀请码不存在');
        if (invite.used) return badRequest(res, '邀请码已失效');

        const user = {
            id: randomId('user'),
            username,
            normalizedUsername: normalized,
            displayName: username,
            passwordHash: sha256(password),
            createdAt: now()
        };

        data.users.push(user);
        invite.used = true;
        invite.usedAt = now();
        invite.usedBy = username;

        const session = createUserSession(data, username);
        writeData(data);

        return json(res, 200, {
            user: publicUser(user),
            token: session.token,
            expiresAt: session.expiresAt
        });
    }

    if (pathname === '/api/login') {
        if (req.method !== 'POST') return methodNotAllowed(res);

        let body;
        try {
            body = await parseRequestBody(req);
        } catch (error) {
            return badRequest(res, error.message);
        }

        const username = String(body.username || '').trim();
        const normalized = normalizeUsername(username);
        const password = String(body.password || '');

        if (!username) return badRequest(res, '请输入账号');
        if (!password) return badRequest(res, '请输入密码');

        const user = data.users.find((item) => normalizeUsername(item.username) === normalized);
        if (!user) return badRequest(res, '账号不存在');

        if (user.passwordHash !== sha256(password)) {
            return badRequest(res, '密码错误');
        }

        const session = createUserSession(data, user.username);
        writeData(data);

        return json(res, 200, {
            user: publicUser(user),
            token: session.token,
            expiresAt: session.expiresAt
        });
    }

    if (pathname === '/api/session') {
        if (req.method !== 'GET') return methodNotAllowed(res);

        const token = getBearerToken(req);
        const session = getUserSession(data, token);
        if (!session) {
            writeData(data);
            return json(res, 200, { user: null });
        }

        const user = data.users.find((item) => item.username === session.username);
        if (!user) {
            data.sessions = data.sessions.filter((item) => item.token !== token);
            writeData(data);
            return json(res, 200, { user: null });
        }

        writeData(data);
        return json(res, 200, {
            user: publicUser(user),
            expiresAt: session.expiresAt
        });
    }

    if (pathname === '/api/logout') {
        if (req.method !== 'POST') return methodNotAllowed(res);

        const token = getBearerToken(req);
        if (token) {
            data.sessions = data.sessions.filter((item) => item.token !== token);
            writeData(data);
        }

        return json(res, 200, { success: true });
    }

    if (pathname.startsWith('/api/admin/')) {
        if (pathname === '/api/admin/invites') {
            if (req.method === 'GET') {
                writeData(data);
                return json(res, 200, { invites: getSortedInvites(data) });
            }

            if (req.method === 'POST') {
                let body;
                try {
                    body = await parseRequestBody(req);
                } catch (error) {
                    return badRequest(res, error.message);
                }

                const created = generateInvites(data, body.count);
                writeData(data);
                return json(res, 200, { invites: created });
            }

            return methodNotAllowed(res);
        }

        if (pathname === '/api/admin/invites-unused') {
            if (req.method !== 'DELETE') return methodNotAllowed(res);

            data.invites = data.invites.filter((item) => item.used);
            writeData(data);
            return json(res, 200, { success: true });
        }

        const deleteInviteMatch = pathname.match(/^\/api\/admin\/invites\/([^/]+)$/);
        if (deleteInviteMatch) {
            if (req.method !== 'DELETE') return methodNotAllowed(res);

            const code = decodeURIComponent(deleteInviteMatch[1]).trim().toUpperCase();
            const target = data.invites.find((item) => String(item.code || '').toUpperCase() === code);

            if (!target) return badRequest(res, '邀请码不存在');
            if (target.used) return badRequest(res, '已使用的邀请码不能删除');

            data.invites = data.invites.filter((item) => String(item.code || '').toUpperCase() !== code);
            writeData(data);
            return json(res, 200, { success: true });
        }

        return notFound(res);
    }

    return notFound(res);
}

function serveStatic(req, res, url) {
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === '/') {
        pathname = '/index.html';
    }

    const safePath = path.normalize(path.join(ROOT_DIR, pathname));
    if (!safePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(safePath, (statError, stats) => {
        if (statError || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(safePath).pipe(res);
    });
}

function getLocalNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    Object.values(interfaces).forEach((items) => {
        (items || []).forEach((item) => {
            if (!item || item.family !== 'IPv4' || item.internal) return;
            addresses.push(item.address);
        });
    });

    return Array.from(new Set(addresses));
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (url.pathname.startsWith('/api/')) {
        try {
            await handleApi(req, res, url);
        } catch (error) {
            console.error('[server] api error:', error);
            json(res, 500, { message: '服务器内部错误' });
        }
        return;
    }

    serveStatic(req, res, url);
});

server.listen(PORT, HOST, () => {
    ensureDataFile();

    const localUrls = [
        `http://127.0.0.1:${PORT}`,
        `http://localhost:${PORT}`
    ];

    const lanUrls = getLocalNetworkAddresses().map((address) => `http://${address}:${PORT}`);

    console.log('[server] 已启动');
    console.log(`[server] 本机访问: ${localUrls.join(' , ')}`);

    if (lanUrls.length) {
        console.log(`[server] 手机局域网访问: ${lanUrls.join(' , ')}`);
    } else {
        console.log('[server] 未检测到局域网 IPv4 地址，手机可能无法通过同一 Wi‑Fi 访问');
    }

    console.log(`[server] 管理员口令: ${ADMIN_KEY || '(未设置)'}`);
});
