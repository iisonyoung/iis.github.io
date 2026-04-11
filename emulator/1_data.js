// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
const userState = {
    name: '',
    phone: '',
    persona: '',
    avatarUrl: null
};
window.userState = userState;

let accounts = [];
let currentAccountId = null;

// Detail View temp state
let isCreatingNewAccount = false;
let detailTempId = null;

// API State
const APP_NAME = 'iison';
const APP_VERSION = '2.0.0';
const STORAGE_SCHEMA_VERSION = 3;
const DEFAULT_API_CONFIG = { 
    endpoint: '', 
    apiKey: '', 
    model: '', 
    temperature: 0.7,
    enableSubApi: false,
    subEndpoint: '',
    subApiKey: '',
    subModel: '',
    subTemperature: 0.7
};
let apiConfig = { ...DEFAULT_API_CONFIG };
let apiPresets = [];
let fetchedModels = [];

// Theme State
let themeState = createDefaultThemeState();
let currentEditingAppIndex = -1;

// World Book State
let wbGroups = []; 
let worldBooks = []; 
window.getWorldBooks = () => worldBooks; 
window.worldBooks = worldBooks;
let editingBookId = null; 
let tempEntries = []; 
let activeEntryId = null; 

function clonePlainData(value) {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function createDefaultAppState() {
    return {
        youtube: {
            channelState: {
                bannerUrl: null,
                url: '',
                boundWorldBookIds: [],
                systemPrompt: '',
                summaryPrompt: '',
                groupChatPrompt: '',
                vodPrompt: '',
                postPrompt: '',
                liveSummaryPrompt: '',
                liveSummaries: [],
                groupChatHistory: [],
                cachedTrendingLive: null,
                cachedTrendingSub: null,
                pastVideos: []
            },
            subscriptions: [],
            userState: null
        },
        tiktok: {
            profile: {
                name: 'User',
                handle: 'user123',
                avatar: null,
                status: '思考中...',
                bio: '点击添加个人简介',
                persona: '',
                following: 0,
                followers: 0,
                likes: 0,
                posts: []
            },
            chars: [],
            videos: [
                {
                    id: 'v_default_1',
                    authorId: 'user_default_1',
                    authorName: 'Mew',
                    desc: '周末的正确打开方式，当然是和猫猫一起虚度光阴啦 🐈 #猫咪日常 #周末vlog',
                    sceneText: '阳光穿过窗纱洒在木地板上，一只橘猫正四仰八叉地躺在阳光里打呼噜。镜头缓慢拉近，画面色调温暖治愈，配着慵懒的 lofi 音乐。',
                    likes: 12543,
                    commentsCount: 432,
                    shares: 128,
                    isLiked: false,
                    comments: [
                        { authorName: 'Cici', text: '好治愈的画面，想去你家偷猫！', likes: 231 },
                        { authorName: '鱼蛋', text: '这猫怎么长得跟人一样哈哈哈', likes: 89 }
                    ]
                },
                {
                    id: 'v_default_2',
                    authorId: 'user_default_2',
                    authorName: 'CityWalker',
                    desc: '下雨天的城市，也有别样的浪漫 🌧️ 📸 #扫街 #下雨天 #摄影',
                    sceneText: '镜头跟随着一把透明雨伞，穿梭在霓虹闪烁的积水街道。水面倒映着红蓝色的灯牌，雨滴砸在伞面上发出清脆的白噪音，氛围感拉满。',
                    likes: 8762,
                    commentsCount: 215,
                    shares: 342,
                    isLiked: false,
                    comments: [
                        { authorName: '光影', text: '色彩太棒了，求个滤镜参数', likes: 156 },
                        { authorName: 'Jay', text: '喜欢下雨天的人，内心都很温柔吧', likes: 44 }
                    ]
                }
            ],
            dms: []
        },
        pay: {
            transactions: [],
            balance: 1000
        },
        spotify: {
            customName: '',
            avatarUrl: '',
            backgroundUrl: ''
        },
        diary: {
            notes: []
        },
        maps: {
            mapsStore: [],
            activeMapId: null,
            friendPositionsStore: {}
        },
        desktop: {},
        bstage: {},
        x: {
            xData: {
                name: 'User',
                handle: '@user',
                bio: '点击编辑资料添加简介',
                location: '',
                following: '0',
                followers: '0',
                persona: '',
                avatar: '',
                banner: ''
            },
            xTopics: [],
            xHomeBannerUrl: '',
            xSearchBannerUrl: ''
        },
        imessage: {
            uiState: {
                cssPresets: []
            }
        }
    };
}

function ensureAppStateShape(rawState = {}) {
    const defaults = createDefaultAppState();
    const safeState = rawState && typeof rawState === 'object' ? rawState : {};

    return {
        ...defaults,
        ...safeState,
        youtube: {
            ...defaults.youtube,
            ...(safeState.youtube && typeof safeState.youtube === 'object' ? safeState.youtube : {})
        },
        tiktok: {
            ...defaults.tiktok,
            ...(safeState.tiktok && typeof safeState.tiktok === 'object' ? safeState.tiktok : {})
        },
        pay: {
            ...defaults.pay,
            ...(safeState.pay && typeof safeState.pay === 'object' ? safeState.pay : {})
        },
        spotify: {
            ...defaults.spotify,
            ...(safeState.spotify && typeof safeState.spotify === 'object' ? safeState.spotify : {})
        },
        diary: {
            ...defaults.diary,
            ...(safeState.diary && typeof safeState.diary === 'object' ? safeState.diary : {})
        },
        maps: {
            ...defaults.maps,
            ...(safeState.maps && typeof safeState.maps === 'object' ? safeState.maps : {})
        },
        desktop: safeState.desktop && typeof safeState.desktop === 'object' ? safeState.desktop : defaults.desktop,
        bstage: safeState.bstage && typeof safeState.bstage === 'object' ? safeState.bstage : defaults.bstage,
        x: {
            ...defaults.x,
            ...(safeState.x && typeof safeState.x === 'object' ? safeState.x : {}),
            xData: {
                ...defaults.x.xData,
                ...(safeState.x && safeState.x.xData && typeof safeState.x.xData === 'object'
                    ? safeState.x.xData
                    : {})
            },
            xTopics: Array.isArray(safeState.x?.xTopics) ? safeState.x.xTopics : defaults.x.xTopics,
            xHomeBannerUrl: typeof safeState.x?.xHomeBannerUrl === 'string'
                ? safeState.x.xHomeBannerUrl
                : defaults.x.xHomeBannerUrl,
            xSearchBannerUrl: typeof safeState.x?.xSearchBannerUrl === 'string'
                ? safeState.x.xSearchBannerUrl
                : defaults.x.xSearchBannerUrl
        },
        imessage: {
            ...defaults.imessage,
            ...(safeState.imessage && typeof safeState.imessage === 'object' ? safeState.imessage : {}),
            uiState: {
                ...defaults.imessage.uiState,
                ...(safeState.imessage && safeState.imessage.uiState && typeof safeState.imessage.uiState === 'object'
                    ? safeState.imessage.uiState
                    : {})
            }
        }
    };
}

let appState = ensureAppStateShape();
window.__iisonAppState = appState;

window.getAllAppState = function() {
    return appState;
};

window.getAppState = function(appKey) {
    return appState && appState[appKey] ? appState[appKey] : null;
};

window.setAppState = function(appKey, nextState, options = {}) {
    if (!appKey) return null;
    appState[appKey] = nextState && typeof nextState === 'object'
        ? clonePlainData(nextState)
        : nextState;
    appState = ensureAppStateShape(appState);
    window.__iisonAppState = appState;
    if (options.save !== false) {
        saveGlobalData();
    }
    return appState[appKey];
};

window.updateAppState = function(appKey, updater, options = {}) {
    if (!appKey) return null;
    const previousState = appState[appKey];
    const draft = previousState && typeof previousState === 'object'
        ? clonePlainData(previousState)
        : previousState;
    const nextState = typeof updater === 'function' ? updater(draft) ?? draft : updater;
    return window.setAppState(appKey, nextState, options);
};

window.resetUnifiedAppState = function(options = {}) {
    appState = ensureAppStateShape();
    window.__iisonAppState = appState;
    if (options.save !== false) {
        saveGlobalData();
    }
    return appState;
};

window.apiConfig = apiConfig;
window.apiPresets = apiPresets;
window.fetchedModels = fetchedModels;
window.themeState = themeState;

window.globalDataLoadHooks = Array.isArray(window.globalDataLoadHooks) ? window.globalDataLoadHooks : [];
window.globalDataSaveHooks = Array.isArray(window.globalDataSaveHooks) ? window.globalDataSaveHooks : [];

window.registerGlobalDataLoadHook = function(handler) {
    if (typeof handler === 'function' && !window.globalDataLoadHooks.includes(handler)) {
        window.globalDataLoadHooks.push(handler);
    }
    return handler;
};

window.registerGlobalDataSaveHook = function(handler) {
    if (typeof handler === 'function' && !window.globalDataSaveHooks.includes(handler)) {
        window.globalDataSaveHooks.push(handler);
    }
    return handler;
};

window.unregisterGlobalDataLoadHook = function(handler) {
    window.globalDataLoadHooks = (window.globalDataLoadHooks || []).filter(item => item !== handler);
};

window.unregisterGlobalDataSaveHook = function(handler) {
    window.globalDataSaveHooks = (window.globalDataSaveHooks || []).filter(item => item !== handler);
};

function runGlobalDataLoadHooks(data) {
    (window.globalDataLoadHooks || []).forEach((handler) => {
        try {
            handler(data);
        } catch (err) {
            console.error('A global data load hook failed', err);
        }
    });

    if (typeof window.onGlobalDataLoaded === 'function') {
        try {
            window.onGlobalDataLoaded(data);
        } catch (err) {
            console.error('Legacy onGlobalDataLoaded hook failed', err);
        }
    }
}

function runGlobalDataSaveHooks(data) {
    (window.globalDataSaveHooks || []).forEach((handler) => {
        try {
            handler(data);
        } catch (err) {
            console.error('A global data save hook failed', err);
        }
    });

    if (typeof window.onGlobalDataSave === 'function') {
        try {
            window.onGlobalDataSave(data);
        } catch (err) {
            console.error('Legacy onGlobalDataSave hook failed', err);
        }
    }
}

function readImageAsCompressedDataUrl(file, options = {}) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file selected'));
            return;
        }

        const {
            maxWidth = 1024,
            maxHeight = 1024,
            quality = 0.82,
            outputType = 'image/jpeg'
        } = options;

        const reader = new FileReader();
        reader.onload = (event) => {
            const rawDataUrl = event?.target?.result;
            if (!rawDataUrl || typeof rawDataUrl !== 'string') {
                reject(new Error('Failed to read file'));
                return;
            }

            const image = new Image();
            image.onload = () => {
                let { width, height } = image;

                if (!width || !height) {
                    resolve(rawDataUrl);
                    return;
                }

                const widthRatio = maxWidth / width;
                const heightRatio = maxHeight / height;
                const scale = Math.min(1, widthRatio, heightRatio);

                const targetWidth = Math.max(1, Math.round(width * scale));
                const targetHeight = Math.max(1, Math.round(height * scale));

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(rawDataUrl);
                    return;
                }

                ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

                try {
                    const compressedDataUrl = canvas.toDataURL(outputType, quality);
                    resolve(compressedDataUrl || rawDataUrl);
                } catch (err) {
                    console.warn('Failed to compress image, using original data url.', err);
                    resolve(rawDataUrl);
                }
            };

            image.onerror = () => reject(new Error('Failed to load image for compression'));
            image.src = rawDataUrl;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// --- Data Persistence Helper ---
function normalizeApiConfig(config = {}) {
    return {
        endpoint: config && typeof config.endpoint === 'string' ? config.endpoint : '',
        apiKey: config && typeof config.apiKey === 'string' ? config.apiKey : '',
        model: config && typeof config.model === 'string' ? config.model : '',
        temperature: Number.isFinite(parseFloat(config && config.temperature))
            ? parseFloat(config.temperature)
            : DEFAULT_API_CONFIG.temperature,
        enableSubApi: config && typeof config.enableSubApi === 'boolean' ? config.enableSubApi : false,
        subEndpoint: config && typeof config.subEndpoint === 'string' ? config.subEndpoint : '',
        subApiKey: config && typeof config.subApiKey === 'string' ? config.subApiKey : '',
        subModel: config && typeof config.subModel === 'string' ? config.subModel : '',
        subTemperature: Number.isFinite(parseFloat(config && config.subTemperature))
            ? parseFloat(config.subTemperature)
            : DEFAULT_API_CONFIG.subTemperature
    };
}

function createDefaultThemeState() {
    return {
        bgUrl: null,
        fontMode: 'preset',
        fontPresetKey: 'system-default',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        fontCssName: '',
        fontSize: 16,
        fontSources: {
            woff2: '',
            woff: '',
            ttf: ''
        },
        savedFontPresets: [],
        apps: [
            { id: 'app-icon-1', name: 'Pay', icon: null },
            { id: 'app-icon-2', name: 'TikTok', icon: null },
            { id: 'app-icon-3', name: 'b.stage', icon: null },
            { id: 'app-icon-4', name: 'X', icon: null },
            { id: 'app-icon-5', name: 'Diary', icon: null },
            { id: 'app-icon-6', name: 'Maps', icon: null },
            { id: 'app-icon-7', name: 'AO3', icon: null },
            { id: 'app-icon-8', name: 'Spotify', icon: null },
            { id: 'dock-icon-settings', name: '设置', icon: null },
            { id: 'dock-icon-imessage', name: '信息', icon: null },
            { id: 'dock-icon-youtube', name: 'YouTube', icon: null }
        ]
    };
}

function buildFreshGlobalData(preservedApiConfig = DEFAULT_API_CONFIG) {
    return {
        storageSchemaVersion: STORAGE_SCHEMA_VERSION,
        userState: {
            name: '',
            phone: '',
            persona: '',
            avatarUrl: null
        },
        accounts: [],
        currentAccountId: null,
        apiConfig: normalizeApiConfig(preservedApiConfig),
        apiPresets: [],
        fetchedModels: [],
        themeState: createDefaultThemeState(),
        wbGroups: [],
        worldBooks: [],
        appState: ensureAppStateShape()
    };
}

function applyLoadedGlobalData(data = {}) {
    const safeData = data && typeof data === 'object' ? data : {};

    Object.assign(userState, {
        name: safeData.userState?.name || '',
        phone: safeData.userState?.phone || '',
        persona: safeData.userState?.persona || '',
        avatarUrl: safeData.userState?.avatarUrl || null
    });

    accounts = Array.isArray(safeData.accounts) ? safeData.accounts : [];
    currentAccountId = safeData.currentAccountId ?? null;
    Object.assign(apiConfig, normalizeApiConfig(safeData.apiConfig || DEFAULT_API_CONFIG));
    window.apiConfig = apiConfig;
    apiPresets = Array.isArray(safeData.apiPresets) ? safeData.apiPresets : [];
    fetchedModels = Array.isArray(safeData.fetchedModels) ? safeData.fetchedModels : [];

    const defaultThemeState = createDefaultThemeState();
    themeState = safeData.themeState && typeof safeData.themeState === 'object'
        ? {
            ...defaultThemeState,
            ...safeData.themeState,
            fontSources: {
                ...defaultThemeState.fontSources,
                ...(safeData.themeState.fontSources && typeof safeData.themeState.fontSources === 'object'
                    ? safeData.themeState.fontSources
                    : {})
            },
            savedFontPresets: Array.isArray(safeData.themeState.savedFontPresets)
                ? clonePlainData(safeData.themeState.savedFontPresets)
                : clonePlainData(defaultThemeState.savedFontPresets),
            apps: Array.isArray(safeData.themeState.apps)
                ? clonePlainData(safeData.themeState.apps)
                : clonePlainData(defaultThemeState.apps)
        }
        : defaultThemeState;

    wbGroups = Array.isArray(safeData.wbGroups) ? safeData.wbGroups : [];
    worldBooks = Array.isArray(safeData.worldBooks) ? safeData.worldBooks : [];
    appState = ensureAppStateShape(safeData.appState);

    window.apiPresets = apiPresets;
    window.fetchedModels = fetchedModels;
    window.themeState = themeState;
    window.worldBooks = worldBooks;
    window.__iisonAppState = appState;
}

function buildCurrentGlobalData() {
    return {
        storageSchemaVersion: STORAGE_SCHEMA_VERSION,
        userState: {
            name: userState.name || '',
            phone: userState.phone || '',
            persona: userState.persona || '',
            avatarUrl: userState.avatarUrl || null
        },
        accounts: Array.isArray(accounts) ? accounts : [],
        currentAccountId,
        apiConfig: normalizeApiConfig(apiConfig),
        apiPresets: Array.isArray(apiPresets) ? apiPresets : [],
        fetchedModels: Array.isArray(fetchedModels) ? fetchedModels : [],
        themeState,
        wbGroups: Array.isArray(wbGroups) ? wbGroups : [],
        worldBooks: Array.isArray(worldBooks) ? worldBooks : [],
        appState: ensureAppStateShape(appState)
    };
}

async function loadGlobalData() {
    try {
        let data = null;

        if (window.appStorage?.loadGlobalData) {
            data = await window.appStorage.loadGlobalData();
        }

        const loadedSchemaVersion = Number(data?.storageSchemaVersion) || 0;
        const shouldResetStorage =
            !data ||
            typeof data !== 'object' ||
            loadedSchemaVersion !== STORAGE_SCHEMA_VERSION;

        if (shouldResetStorage) {
            if (window.appStorage?.clearAllData) {
                await window.appStorage.clearAllData();
            }
            data = buildFreshGlobalData();
            if (window.appStorage?.saveGlobalData) {
                await window.appStorage.saveGlobalData(data);
            }
        }

        applyLoadedGlobalData(data);
        runGlobalDataLoadHooks(data);

        if (typeof window.syncUIs === 'function') {
            try {
                window.syncUIs();
            } catch (err) {
                console.error('syncUIs failed after global data load', err);
            }
        }

        document.dispatchEvent(new CustomEvent('global-data-ready', { detail: data }));
        return data;
    } catch (e) {
        console.error('Failed to load global data', e);
        const fallback = buildFreshGlobalData();
        applyLoadedGlobalData(fallback);
        document.dispatchEvent(new CustomEvent('global-data-ready', { detail: fallback }));
        return fallback;
    }
}

async function saveGlobalData() {
    try {
        const data = buildCurrentGlobalData();
        window.__iisonAppState = data.appState;
        runGlobalDataSaveHooks(data);

        if (window.appStorage?.saveGlobalData) {
            await window.appStorage.saveGlobalData(data);
        }

        return true;
    } catch (e) {
        console.error('Failed to save global data', e);
        return false;
    }
}
window.saveGlobalData = saveGlobalData;
window.loadGlobalData = loadGlobalData;
window.readImageAsCompressedDataUrl = readImageAsCompressedDataUrl;
window.APP_NAME = APP_NAME;
window.APP_VERSION = APP_VERSION;
window.STORAGE_SCHEMA_VERSION = STORAGE_SCHEMA_VERSION;
window.getAccounts = () => accounts;
window.getCurrentAccountId = () => currentAccountId;
window.setCurrentAccountId = (id) => {
    currentAccountId = id;
    return currentAccountId;
};

// Load at startup
window.globalDataReadyPromise = loadGlobalData();
