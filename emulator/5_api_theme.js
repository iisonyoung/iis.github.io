// ==========================================
// 7. API CONFIGURATION
// ==========================================
// Open API Settings
document.getElementById('api-config-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    UI.inputs.apiEndpoint.value = apiConfig.endpoint;
    UI.inputs.apiKey.value = apiConfig.apiKey;
    UI.inputs.apiModel.value = apiConfig.model;
    UI.inputs.apiTemp.value = apiConfig.temperature;
    openView(UI.overlays.apiConfig);
});

// Confirm API Settings
document.getElementById('confirm-api-btn').addEventListener('click', () => {
    apiConfig.endpoint = UI.inputs.apiEndpoint.value;
    apiConfig.apiKey = UI.inputs.apiKey.value;
    apiConfig.model = UI.inputs.apiModel.value;
    apiConfig.temperature = parseFloat(UI.inputs.apiTemp.value) || 0.7;
    
    // Save globally
    window.apiConfig = apiConfig;
    saveGlobalData();
    
    closeView(UI.overlays.apiConfig);
    showToast('API Config Saved');
});

// Real Fetch Models Logic
const btnApiFetch = document.getElementById('fetch-models-btn');
if (btnApiFetch) {
    btnApiFetch.addEventListener('click', async () => {
        const endpoint = UI.inputs.apiEndpoint.value.trim();
        const key = UI.inputs.apiKey.value.trim();
        
        if (!endpoint) {
            showToast('Please enter an endpoint');
            return;
        }

        const originalText = btnApiFetch.innerHTML;
        btnApiFetch.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
        
        try {
            // Clean up endpoint to point to /v1/models
            let url = endpoint;
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/models')) {
                url = url.endsWith('/v1') ? url + '/models' : url + '/v1/models';
            }

            const headers = { 'Content-Type': 'application/json' };
            if (key) {
                headers['Authorization'] = `Bearer ${key}`;
            }

            const res = await fetch(url, { method: 'GET', headers });
            if (!res.ok) throw new Error('Network response was not ok');
            
            const data = await res.json();
            
            if (data && data.data && Array.isArray(data.data)) {
                fetchedModels = data.data.map(m => m.id);
                saveGlobalData();
                showToast(`Fetched ${fetchedModels.length} models!`);
            } else {
                throw new Error('Invalid format');
            }
        } catch (error) {
            console.error('Fetch Models Error:', error);
            showToast('Failed to fetch models');
        } finally {
            btnApiFetch.innerHTML = originalText;
        }
    });
}

// -- Presets --
const savePresetBtn = document.getElementById('save-preset-btn');
const loadPresetBtn = document.getElementById('load-preset-btn');
const confirmSavePresetBtn = document.getElementById('confirm-save-preset-btn');

if (savePresetBtn) {
    savePresetBtn.addEventListener('click', () => {
        if (UI.inputs.presetName) UI.inputs.presetName.value = '';
        openView(UI.overlays.savePreset);
    });
}

if (confirmSavePresetBtn) {
    confirmSavePresetBtn.addEventListener('click', () => {
        const endpoint = UI.inputs.apiEndpoint ? UI.inputs.apiEndpoint.value.trim() : '';
        const apiKey = UI.inputs.apiKey ? UI.inputs.apiKey.value.trim() : '';
        const model = UI.inputs.apiModel ? UI.inputs.apiModel.value.trim() : '';
        const temp = UI.inputs.apiTemp ? parseFloat(UI.inputs.apiTemp.value) || 0.7 : 0.7;
        const presetName = UI.inputs.presetName ? UI.inputs.presetName.value.trim() : '';

        apiPresets.push({
            id: Date.now(),
            name: presetName || '未命名预设',
            endpoint,
            apiKey,
            model,
            temp
        });

        saveGlobalData();
        closeView(UI.overlays.savePreset);
        showToast('预设已保存');
    });
}

if (loadPresetBtn) {
    loadPresetBtn.addEventListener('click', () => {
        renderPresetList();
        openView(UI.overlays.loadPreset);
    });
}

function renderPresetList() {
    if (!UI.lists.presets) return;
    UI.lists.presets.innerHTML = '';

    if (!Array.isArray(apiPresets) || apiPresets.length === 0) {
        UI.lists.presets.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #8e8e93; font-size: 15px;">
                暂无预设
            </div>
        `;
        return;
    }

    apiPresets.forEach(preset => {
        const item = document.createElement('div');
        item.className = 'account-card';
        item.innerHTML = `
            <div class="account-content" style="cursor: pointer;">
                <div class="account-avatar" style="background-color: var(--blue-color); color: white;"><i class="fas fa-server"></i></div>
                <div class="account-info">
                    <div class="account-name">${preset.name || '未命名预设'}</div>
                    <div class="account-detail" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;">${preset.endpoint || '未填写接口地址'}</div>
                </div>
                <i class="fas fa-times delete-icon"></i>
            </div>
        `;

        const content = item.querySelector('.account-content');
        const deleteIcon = item.querySelector('.delete-icon');

        if (content) {
            content.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-icon') || e.target.closest('.delete-icon')) return;

                if (UI.inputs.apiEndpoint) UI.inputs.apiEndpoint.value = preset.endpoint || '';
                if (UI.inputs.apiKey) UI.inputs.apiKey.value = preset.apiKey || '';
                if (UI.inputs.apiModel) UI.inputs.apiModel.value = preset.model || '';
                if (UI.inputs.apiTemp) UI.inputs.apiTemp.value = preset.temp ?? 0.7;

                closeView(UI.overlays.loadPreset);
                showToast('预设已加载');
            });
        }

        if (deleteIcon) {
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`删除预设“${preset.name || '未命名预设'}”？`)) {
                    apiPresets = apiPresets.filter(p => p.id !== preset.id);
                    saveGlobalData();
                    renderPresetList();
                    showToast('预设已删除');
                }
            });
        }

        UI.lists.presets.appendChild(item);
    });
}

// -- Model Picker --
if (UI.inputs.apiModel) {
    UI.inputs.apiModel.addEventListener('click', () => {
        renderModelList();
        openView(UI.overlays.modelPicker);
    });
}

function renderModelList() {
    if (!UI.lists.models) return;
    UI.lists.models.innerHTML = '';

    if (!Array.isArray(fetchedModels) || fetchedModels.length === 0) {
        UI.lists.models.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #8e8e93; font-size: 15px;">
                暂无模型，请先点击 Fetch Models
            </div>
        `;
        return;
    }

    fetchedModels.forEach(model => {
        const item = document.createElement('div');
        item.className = 'api-model-card';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <div class="api-model-card-name">${model}</div>
            <div class="api-model-card-action">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        item.addEventListener('click', () => {
            UI.inputs.apiModel.value = model;
            closeView(UI.overlays.modelPicker);
        });
        UI.lists.models.appendChild(item);
    });
}

if (typeof window.scheduleViewportSync === 'function') {
    window.scheduleViewportSync();
} else if (typeof window.syncViewportMetrics === 'function') {
    window.syncViewportMetrics();
}

window.addEventListener('orientationchange', () => {
    if (typeof window.scheduleViewportSync === 'function') {
        window.scheduleViewportSync();
    } else if (typeof window.syncViewportMetrics === 'function') {
        window.syncViewportMetrics();
    }
});

const THEME_FONT_PREVIEW_TEXT = 'Aa 你好 Hello 123';
const DEFAULT_SYSTEM_THEME_FONT_FAMILY = 'system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
const BUILTIN_THEME_FONTS = [
    {
        key: 'system-default',
        label: '默认',
        cssName: '',
        family: DEFAULT_SYSTEM_THEME_FONT_FAMILY,
        sources: {
            woff2: '',
            woff: '',
            ttf: ''
        }
    },
    {
        key: 'ios1670',
        label: 'iOS台简',
        cssName: 'iOS1670',
        family: '"iOS1670", "PingFang SC", system-ui',
        sources: {
            woff2: 'iOS1670-txpfjc.woff2',
            woff: 'iOS1670-txpfjc.woff',
            ttf: ''
        }
    }
];

const themeFontBtn = document.getElementById('theme-font-btn');
const themeFontModal = document.getElementById('theme-font-modal');
const themeFontCloseBtn = document.getElementById('theme-font-close-btn');
const themeFontResetBtn = document.getElementById('theme-font-reset-btn');
const themeFontLinkFocusBtn = document.getElementById('theme-font-link-focus-btn');
const themeFontApplyCustomBtn = document.getElementById('theme-font-apply-custom-btn');
const themeFontSavePresetBtn = document.getElementById('theme-font-save-preset-btn');
const themeFontCustomSection = document.getElementById('theme-font-custom-section');
const themeFontPreviewBubble = document.getElementById('theme-font-preview-bubble');
const themeFontModalPreview = document.getElementById('theme-font-modal-preview');
const themeFontCurrentLabel = document.getElementById('theme-font-current-label');
const themeFontPresetList = document.getElementById('theme-font-preset-list');
const themeFontModalPresetList = document.getElementById('theme-font-modal-preset-list');
const themeFontModalUserPresetList = document.getElementById('theme-font-modal-user-preset-list');
const themeFontNameInput = document.getElementById('theme-font-name-input');
const themeFontUrlInput = document.getElementById('theme-font-url-input');
const themeFontSizeSlider = document.getElementById('theme-font-size-slider');
const themeFontSizeValue = document.getElementById('theme-font-size-value');

function cloneThemeFontSources(sources = {}) {
    return {
        woff2: typeof sources.woff2 === 'string' ? sources.woff2.trim() : '',
        woff: typeof sources.woff === 'string' ? sources.woff.trim() : '',
        ttf: typeof sources.ttf === 'string' ? sources.ttf.trim() : ''
    };
}

function normalizeThemeFontSize(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 16;
    return Math.min(24, Math.max(12, Math.round(parsed)));
}

function normalizeThemeFontPreset(preset = {}, fallbackIndex = 0) {
    const normalizedName = sanitizeThemeFontCssName(preset.name || preset.label || preset.cssName || `CustomFont${fallbackIndex + 1}`);
    const sources = cloneThemeFontSources(preset.sources);
    return {
        id: typeof preset.id === 'string' && preset.id ? preset.id : `font_preset_${Date.now()}_${fallbackIndex}`,
        type: 'user',
        name: normalizedName,
        label: normalizedName,
        cssName: sanitizeThemeFontCssName(preset.cssName || normalizedName),
        family: buildThemeFontFamily(preset.cssName || normalizedName),
        sources
    };
}

function ensureThemeFontStateShape() {
    if (!themeState || typeof themeState !== 'object') return;

    if (!themeState.fontMode) themeState.fontMode = 'preset';
    if (!themeState.fontPresetKey) themeState.fontPresetKey = 'system-default';
    if (!themeState.fontFamily) themeState.fontFamily = DEFAULT_SYSTEM_THEME_FONT_FAMILY;
    if (typeof themeState.fontCssName !== 'string') themeState.fontCssName = '';
    themeState.fontSize = normalizeThemeFontSize(themeState.fontSize);

    const builtin = getBuiltinThemeFontByKey(themeState.fontPresetKey);
    if (themeState.fontMode !== 'saved') {
        themeState.fontPresetKey = builtin.key;
        themeState.fontFamily = builtin.family || DEFAULT_SYSTEM_THEME_FONT_FAMILY;
        themeState.fontCssName = builtin.cssName || '';
    }

    if (!themeState.fontSources || typeof themeState.fontSources !== 'object') {
        themeState.fontSources = cloneThemeFontSources(builtin.sources);
    } else {
        themeState.fontSources = cloneThemeFontSources(themeState.fontSources);
    }

    if (!Array.isArray(themeState.savedFontPresets)) {
        themeState.savedFontPresets = [];
    } else {
        themeState.savedFontPresets = themeState.savedFontPresets.map((preset, index) => normalizeThemeFontPreset(preset, index));
    }
}

function getBuiltinThemeFontByKey(key) {
    return BUILTIN_THEME_FONTS.find(font => font.key === key) || BUILTIN_THEME_FONTS[0];
}

function getSavedThemeFontPresetById(id) {
    ensureThemeFontStateShape();
    return themeState.savedFontPresets.find(preset => preset.id === id) || null;
}

function sanitizeThemeFontCssName(value) {
    const sanitized = String(value || '')
        .trim()
        .replace(/["']/g, '')
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ');
    return sanitized || 'CustomThemeFont';
}

function buildThemeFontFamily(cssName) {
    return `"${cssName}", system-ui`;
}

function buildThemeFontFaceCss(cssName, sources = {}) {
    const safeCssName = sanitizeThemeFontCssName(cssName);
    const safeSources = cloneThemeFontSources(sources);
    const srcList = [];

    if (safeSources.woff2) srcList.push(`url("${safeSources.woff2}") format("woff2")`);
    if (safeSources.woff) srcList.push(`url("${safeSources.woff}") format("woff")`);
    if (safeSources.ttf) srcList.push(`url("${safeSources.ttf}") format("truetype")`);

    if (!safeCssName || srcList.length === 0) return '';

    return `
@font-face {
    font-family: '${safeCssName}';
    src: ${srcList.join(',\n         ')};
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
    `.trim();
}

function buildThemeFontSourcesFromSingleUrl(urlValue = '') {
    const rawUrl = String(urlValue || '').trim();
    if (!rawUrl) return { woff2: '', woff: '', ttf: '' };

    const normalizedUrl = rawUrl.split('?')[0].split('#')[0].toLowerCase();
    if (normalizedUrl.endsWith('.woff2')) return { woff2: rawUrl, woff: '', ttf: '' };
    if (normalizedUrl.endsWith('.woff')) return { woff2: '', woff: rawUrl, ttf: '' };
    if (normalizedUrl.endsWith('.ttf')) return { woff2: '', woff: '', ttf: rawUrl };

    return { woff2: rawUrl, woff: '', ttf: '' };
}

function getThemeFontSingleUrlFromSources(sources = {}) {
    const safeSources = cloneThemeFontSources(sources);
    return safeSources.woff2 || safeSources.woff || safeSources.ttf || '';
}

function getThemeFontFaceStyleElement() {
    let styleEl = document.getElementById('theme-font-face-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'theme-font-face-style';
        document.head.appendChild(styleEl);
    }
    return styleEl;
}

function getThemeFontAppliedStyleElement() {
    let styleEl = document.getElementById('theme-font-applied-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'theme-font-applied-style';
        document.head.appendChild(styleEl);
    }
    return styleEl;
}

function getActiveThemeFontDefinition(state = themeState) {
    ensureThemeFontStateShape();

    if (state.fontMode === 'saved') {
        const savedPreset = getSavedThemeFontPresetById(state.fontPresetKey);
        if (savedPreset) {
            return {
                key: savedPreset.id,
                label: savedPreset.label,
                cssName: savedPreset.cssName,
                family: savedPreset.family,
                sources: cloneThemeFontSources(savedPreset.sources),
                type: 'user'
            };
        }
    }

    const preset = getBuiltinThemeFontByKey(state.fontPresetKey || 'system-default');
    return {
        key: preset.key,
        label: preset.label,
        cssName: preset.cssName || '',
        family: preset.family || 'system-ui',
        sources: cloneThemeFontSources(preset.sources),
        type: 'builtin'
    };
}

function getThemeFontLabel(state = themeState) {
    const definition = getActiveThemeFontDefinition(state);
    if (definition.type === 'user') {
        return `当前字体：我的预设 · ${definition.label}`;
    }
    return `当前字体：${definition.label}`;
}

function registerThemeFontFace(state = themeState) {
    const definition = getActiveThemeFontDefinition(state);
    const faceStyleEl = getThemeFontFaceStyleElement();
    const fontFaceCss = buildThemeFontFaceCss(definition.cssName, definition.sources);
    faceStyleEl.textContent = fontFaceCss;
    return definition;
}

function applyThemeFont(state = themeState) {
    const definition = registerThemeFontFace(state);
    const appliedStyleEl = getThemeFontAppliedStyleElement();
    const resolvedFamily = definition.family || 'system-ui';
    const resolvedSize = `${normalizeThemeFontSize(state.fontSize)}px`;

    appliedStyleEl.textContent = `
:root {
    --theme-font-family: ${resolvedFamily};
    --theme-font-size: ${resolvedSize};
}

body,
.screen,
input,
textarea,
button,
select {
    font-family: var(--theme-font-family);
    font-size: var(--theme-font-size);
}
    `.trim();

    document.documentElement.style.setProperty('--theme-font-family', resolvedFamily);
    document.documentElement.style.setProperty('--theme-font-size', resolvedSize);
    return definition;
}

function applyThemeBackground(state = themeState) {
    const screenEl = document.querySelector('.screen');
    if (!screenEl) return;

    const bgUrl = typeof state.bgUrl === 'string' ? state.bgUrl.trim() : '';

    if (bgUrl) {
        screenEl.style.backgroundImage = `url(${bgUrl})`;
        screenEl.style.backgroundSize = 'cover';
        screenEl.style.backgroundPosition = 'center';
        screenEl.style.backgroundColor = 'transparent';

        document.body.style.backgroundImage = `url(${bgUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    } else {
        screenEl.style.backgroundImage = 'none';
        screenEl.style.backgroundColor = '';

        document.body.style.backgroundImage = 'none';
    }
}

function applyThemeAppIcons(state = themeState) {
    if (!Array.isArray(state.apps)) return;
    state.apps.forEach(app => {
        applyAppIconStyles(app);
    });
}

function commitThemeFontChanges(toastMessage = '') {
    renderThemeFontPresetLists();
    renderThemeFontPreview();
    applyThemeFont(themeState);
    saveGlobalData();
    if (toastMessage) showToast(toastMessage);
}

function commitThemeBackgroundChanges(toastMessage = '') {
    applyThemeBackground(themeState);
    saveGlobalData();
    if (toastMessage) showToast(toastMessage);
}

function commitThemeAppIconChanges(toastMessage = '') {
    applyThemeAppIcons(themeState);
    renderThemeAppList();
    saveGlobalData();
    if (toastMessage) showToast(toastMessage);
}

function buildThemeFontDraftFromInputs() {
    const cssName = sanitizeThemeFontCssName(themeFontNameInput?.value || '');
    const fontSources = buildThemeFontSourcesFromSingleUrl(themeFontUrlInput?.value || '');

    if (!fontSources.woff2 && !fontSources.woff && !fontSources.ttf) {
        showToast('请至少填写一个字体完整链接');
        return null;
    }

    return {
        id: '',
        type: 'user',
        name: cssName,
        label: cssName,
        cssName,
        family: buildThemeFontFamily(cssName),
        sources: fontSources
    };
}

function applyThemeFontSelection(definition) {
    if (!definition) return;

    themeState.fontMode = definition.type === 'user' ? 'saved' : 'preset';
    themeState.fontPresetKey = definition.key;
    themeState.fontCssName = definition.cssName || '';
    themeState.fontFamily = definition.family || 'system-ui';
    themeState.fontSources = cloneThemeFontSources(definition.sources);
}

function syncThemeFontInputsFromState() {
    ensureThemeFontStateShape();

    if (themeFontSizeSlider) themeFontSizeSlider.value = String(normalizeThemeFontSize(themeState.fontSize));
    if (themeFontSizeValue) themeFontSizeValue.textContent = `${normalizeThemeFontSize(themeState.fontSize)}px`;

    if (!themeFontNameInput || !themeFontUrlInput) return;

    if (themeState.fontMode === 'saved') {
        const preset = getSavedThemeFontPresetById(themeState.fontPresetKey);
        if (preset) {
            themeFontNameInput.value = preset.name || '';
            themeFontUrlInput.value = getThemeFontSingleUrlFromSources(preset.sources);
            return;
        }
    }

    themeFontNameInput.value = '';
    themeFontUrlInput.value = '';
}

function renderThemeFontPreview() {
    ensureThemeFontStateShape();
    const definition = registerThemeFontFace(themeState);
    const label = getThemeFontLabel(themeState);

    const previewSize = `${normalizeThemeFontSize(themeState.fontSize)}px`;

    if (themeFontPreviewBubble) {
        themeFontPreviewBubble.textContent = THEME_FONT_PREVIEW_TEXT;
        themeFontPreviewBubble.style.fontFamily = definition.family || 'system-ui';
        themeFontPreviewBubble.style.fontSize = previewSize;
    }

    if (themeFontModalPreview) {
        themeFontModalPreview.textContent = THEME_FONT_PREVIEW_TEXT;
        themeFontModalPreview.style.fontFamily = definition.family || 'system-ui';
        themeFontModalPreview.style.fontSize = previewSize;
    }

    if (themeFontSizeValue) {
        themeFontSizeValue.textContent = previewSize;
    }

    if (themeFontSizeSlider) {
        themeFontSizeSlider.value = String(normalizeThemeFontSize(themeState.fontSize));
    }

    if (themeFontCurrentLabel) {
        themeFontCurrentLabel.textContent = label;
    }
}

function createThemeFontPill({ label, family, isActive, onSelect, onDelete = null }) {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `theme-font-pill ${isActive ? 'active' : ''}`;
    pill.style.fontFamily = family || 'system-ui';

    const pillLabel = document.createElement('span');
    pillLabel.className = 'theme-font-pill-label';
    pillLabel.textContent = label;
    pill.appendChild(pillLabel);

    pill.addEventListener('click', () => {
        onSelect?.();
    });

    if (typeof onDelete === 'function') {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'theme-font-pill-delete';
        deleteBtn.innerHTML = '<i class="fas fa-xmark"></i>';
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            onDelete();
        });
        pill.appendChild(deleteBtn);
    }

    return pill;
}

function renderThemeFontPresetListInto(container) {
    if (!container) return;
    container.innerHTML = '';

    BUILTIN_THEME_FONTS.forEach((font) => {
        const pill = createThemeFontPill({
            label: font.label,
            family: font.family,
            isActive: themeState.fontMode === 'preset' && themeState.fontPresetKey === font.key,
            onSelect: () => {
                applyThemeFontSelection({
                    key: font.key,
                    label: font.label,
                    cssName: font.cssName || '',
                    family: font.family || 'system-ui',
                    sources: cloneThemeFontSources(font.sources),
                    type: 'builtin'
                });
                syncThemeFontInputsFromState();
                commitThemeFontChanges(`已切换到 ${font.label}`);
            }
        });
        container.appendChild(pill);
    });
}

function renderThemeFontUserPresetListInto(container) {
    if (!container) return;
    container.innerHTML = '';

    ensureThemeFontStateShape();

    themeState.savedFontPresets.forEach((preset) => {
        const pill = createThemeFontPill({
            label: preset.label,
            family: preset.family,
            isActive: themeState.fontMode === 'saved' && themeState.fontPresetKey === preset.id,
            onSelect: () => {
                applyThemeFontSelection({
                    key: preset.id,
                    label: preset.label,
                    cssName: preset.cssName,
                    family: preset.family,
                    sources: cloneThemeFontSources(preset.sources),
                    type: 'user'
                });
                syncThemeFontInputsFromState();
                commitThemeFontChanges(`已切换到 ${preset.label}`);
            },
            onDelete: () => {
                deleteSavedThemeFontPreset(preset.id);
            }
        });
        container.appendChild(pill);
    });
}

function renderThemeFontPresetLists() {
    renderThemeFontPresetListInto(themeFontPresetList);
    renderThemeFontPresetListInto(themeFontModalPresetList);
    renderThemeFontUserPresetListInto(themeFontModalUserPresetList);
}

function openThemeFontModal() {
    if (!themeFontModal) return;
    syncThemeFontInputsFromState();
    renderThemeFontPresetLists();
    renderThemeFontPreview();
    themeFontModal.classList.add('active');
}

function closeThemeFontModal() {
    themeFontModal?.classList.remove('active');
}

function resetThemeFontSelection() {
    const builtin = getBuiltinThemeFontByKey('system-default');
    themeState.fontMode = 'preset';
    themeState.fontPresetKey = builtin.key;
    themeState.fontFamily = builtin.family;
    themeState.fontCssName = builtin.cssName || '';
    themeState.fontSources = cloneThemeFontSources(builtin.sources);
    themeState.fontSize = 16;

    syncThemeFontInputsFromState();
    commitThemeFontChanges('字体已重置为默认字体');
}

function applyCustomThemeFontFromInputs() {
    const draftPreset = buildThemeFontDraftFromInputs();
    if (!draftPreset) return;

    themeState.fontMode = 'saved';
    themeState.fontPresetKey = '__draft__';
    themeState.fontCssName = draftPreset.cssName;
    themeState.fontFamily = draftPreset.family;
    themeState.fontSources = cloneThemeFontSources(draftPreset.sources);

    commitThemeFontChanges('链接字体已应用');
}

function saveCurrentThemeFontAsPreset() {
    ensureThemeFontStateShape();

    const draftPreset = buildThemeFontDraftFromInputs();
    if (!draftPreset) return;

    const existingIndex = themeState.savedFontPresets.findIndex((preset) => preset.name === draftPreset.name);
    const presetId = existingIndex >= 0
        ? themeState.savedFontPresets[existingIndex].id
        : `font_preset_${Date.now()}`;

    const nextPreset = normalizeThemeFontPreset({
        ...draftPreset,
        id: presetId
    });

    if (existingIndex >= 0) {
        themeState.savedFontPresets[existingIndex] = nextPreset;
    } else {
        themeState.savedFontPresets.push(nextPreset);
    }

    applyThemeFontSelection({
        key: nextPreset.id,
        label: nextPreset.label,
        cssName: nextPreset.cssName,
        family: nextPreset.family,
        sources: cloneThemeFontSources(nextPreset.sources),
        type: 'user'
    });
    syncThemeFontInputsFromState();
    commitThemeFontChanges(existingIndex >= 0 ? '字体预设已更新' : '字体预设已保存');
}

function deleteSavedThemeFontPreset(presetId) {
    ensureThemeFontStateShape();

    const targetPreset = getSavedThemeFontPresetById(presetId);
    if (!targetPreset) return;

    themeState.savedFontPresets = themeState.savedFontPresets.filter((preset) => preset.id !== presetId);

    if (themeState.fontMode === 'saved' && themeState.fontPresetKey === presetId) {
        const builtin = getBuiltinThemeFontByKey('system-default');
        themeState.fontMode = 'preset';
        themeState.fontPresetKey = builtin.key;
        themeState.fontCssName = builtin.cssName || '';
        themeState.fontFamily = builtin.family || DEFAULT_SYSTEM_THEME_FONT_FAMILY;
        themeState.fontSources = cloneThemeFontSources(builtin.sources);
    }

    syncThemeFontInputsFromState();
    commitThemeFontChanges(`已删除预设 ${targetPreset.label}`);
}

if (themeFontBtn) {
    themeFontBtn.addEventListener('click', () => {
        openThemeFontModal();
    });
}

if (themeFontCloseBtn) {
    themeFontCloseBtn.addEventListener('click', () => {
        closeThemeFontModal();
    });
}

if (themeFontResetBtn) {
    themeFontResetBtn.addEventListener('click', () => {
        resetThemeFontSelection();
    });
}

if (themeFontLinkFocusBtn) {
    themeFontLinkFocusBtn.addEventListener('click', () => {
        themeFontCustomSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        themeFontNameInput?.focus();
    });
}

if (themeFontApplyCustomBtn) {
    themeFontApplyCustomBtn.addEventListener('click', () => {
        applyCustomThemeFontFromInputs();
    });
}

if (themeFontSavePresetBtn) {
    themeFontSavePresetBtn.addEventListener('click', () => {
        saveCurrentThemeFontAsPreset();
    });
}

if (themeFontSizeSlider) {
    themeFontSizeSlider.addEventListener('input', (event) => {
        themeState.fontSize = normalizeThemeFontSize(event.target.value);
        renderThemeFontPreview();
        applyThemeFont(themeState);
        saveGlobalData();
    });

    themeFontSizeSlider.addEventListener('change', (event) => {
        themeState.fontSize = normalizeThemeFontSize(event.target.value);
        showToast(`字体大小已调整为 ${themeState.fontSize}px`);
    });
}

if (themeFontModal) {
    themeFontModal.addEventListener('click', (event) => {
        if (event.target === themeFontModal) {
            closeThemeFontModal();
        }
    });
}

// ==========================================
// 8. THEME CONFIGURATION
// ==========================================
// Open Theme Settings
document.getElementById('theme-config-btn').addEventListener('click', (e) => {
    e.stopPropagation();

    ensureThemeFontStateShape();

    if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = themeState.bgUrl || '';

    syncThemeFontInputsFromState();
    renderThemeFontPresetLists();
    renderThemeFontPreview();
    renderThemeAppList();
    openView(UI.overlays.themeConfig);
});

// Theme Background Upload
document.getElementById('theme-bg-upload-btn').addEventListener('click', () => {
    document.getElementById('theme-bg-file-input').click();
});

// Theme Background Reset
document.getElementById('theme-bg-reset-btn').addEventListener('click', () => {
    themeState.bgUrl = null;
    if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = '';
    commitThemeBackgroundChanges('背景已重置');
});

document.getElementById('theme-bg-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Resize for background (max 1080p)
            if (window.compressImage) {
                window.compressImage(event.target.result, 1080, 1920, (compressedUrl) => {
                    if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = compressedUrl;
                    themeState.bgUrl = compressedUrl;
                    commitThemeBackgroundChanges('背景已更新');
                });
            } else {
                if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = event.target.result;
                themeState.bgUrl = event.target.result;
                commitThemeBackgroundChanges('背景已更新');
            }
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
});

// Background URL Input Change
if (UI.inputs.themeBgUrl) {
    UI.inputs.themeBgUrl.addEventListener('input', (e) => {
        themeState.bgUrl = e.target.value;
        commitThemeBackgroundChanges();
    });
}

// Reset All Icons
const resetAllIconsBtn = document.getElementById('theme-reset-all-icons-btn');
if (resetAllIconsBtn) {
    resetAllIconsBtn.addEventListener('click', () => {
        themeState.apps.forEach(app => {
            app.icon = null;
        });
        commitThemeAppIconChanges('应用图标已全部重置');
    });
}

// Render App List for Customization
function renderThemeAppList() {
    if (!UI.inputs.themeAppList) return;
    UI.inputs.themeAppList.innerHTML = '';

    themeState.apps.forEach((app, index) => {
        const item = document.createElement('div');
        item.className = 'form-item';
        // Custom styling for app item
        item.style.padding = '8px 16px';
        item.style.height = '60px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.borderBottom = '1px solid #f2f2f7';
        
        // Icon Preview (or placeholder)
        let iconHtml = '';
        if (app.icon) {
            iconHtml = `<div style="width: 40px; height: 40px; border-radius: 10px; background-image: url('${app.icon}'); background-size: cover; background-position: center; border: 1px solid #e5e5ea; flex-shrink: 0;"></div>`;
        } else {
            iconHtml = `<div style="width: 40px; height: 40px; border-radius: 10px; background-color: #f2f2f7; border: 1px solid #e5e5ea; display: flex; align-items: center; justify-content: center; color: #c7c7cc; flex-shrink: 0;"><i class="fas fa-image"></i></div>`;
        }

        item.innerHTML = `
            <div style="display: flex; align-items: center; flex: 1;">
                ${iconHtml}
                <div style="margin-left: 12px; font-size: 16px; font-weight: 500; color: #000;">${app.name}</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <div class="reset-single-app-btn" style="width: 32px; height: 32px; border-radius: 50%; background: #ffebee; color: #ff3b30; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                    <i class="fas fa-undo" style="font-size: 14px;"></i>
                </div>
                <div class="upload-single-app-btn" style="width: 32px; height: 32px; border-radius: 50%; background: #e8f5e9; color: #34c759; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                    <i class="fas fa-upload" style="font-size: 14px;"></i>
                </div>
            </div>
        `;
        
        // Click to reset
        const resetBtn = item.querySelector('.reset-single-app-btn');
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeState.apps[index].icon = null;
            commitThemeAppIconChanges(`${app.name} 图标已重置`);
        });

        // Click to upload
        const uploadBtn = item.querySelector('.upload-single-app-btn');
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentEditingAppIndex = index;
            document.getElementById('theme-app-file-input').click();
        });

        UI.inputs.themeAppList.appendChild(item);
    });
}

// Handle App Icon File Selection
document.getElementById('theme-app-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && currentEditingAppIndex >= 0) {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Compress icon to tiny size (150x150) to save space
            if (window.compressImage) {
                window.compressImage(event.target.result, 150, 150, (compressedUrl) => {
                    const appName = themeState.apps[currentEditingAppIndex]?.name || '应用';
                    themeState.apps[currentEditingAppIndex].icon = compressedUrl;
                    commitThemeAppIconChanges(`${appName} 图标已更新`);
                });
            } else {
                const appName = themeState.apps[currentEditingAppIndex]?.name || '应用';
                themeState.apps[currentEditingAppIndex].icon = event.target.result;
                commitThemeAppIconChanges(`${appName} 图标已更新`);
            }
        };
        reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = '';
});

// Apply specific logic for app icon background to avoid overlay bug
function applyAppIconStyles(app) {
    const el = document.getElementById(app.id);
    if (!el) return;

    const appItem = el.classList.contains('app-item') ? el : el.closest('.app-item');
    const iconDiv = el.classList.contains('app-icon') ? el : (el.querySelector('.app-icon') || appItem?.querySelector('.app-icon'));
    const nameEl = appItem ? appItem.querySelector('.app-name') : el.querySelector('.app-name');

    if (nameEl && app.name) {
        nameEl.textContent = app.name;
    }

    if (!iconDiv) return;

    const ensureIconElement = (className, extraStyle = '') => {
        iconDiv.innerHTML = `<i class="${className}" style="${extraStyle}"></i>`;
        return iconDiv.querySelector('i');
    };

    if (app.icon) {
        iconDiv.innerHTML = '';
        iconDiv.style.backgroundImage = `url(${app.icon})`;
        iconDiv.style.backgroundSize = 'cover';
        iconDiv.style.backgroundPosition = 'center';
        iconDiv.style.backgroundColor = 'transparent';
        iconDiv.style.background = 'transparent';
    } else {
        iconDiv.style.backgroundImage = 'none';
        iconDiv.style.backgroundSize = '';
        iconDiv.style.backgroundPosition = '';
        iconDiv.style.backgroundColor = '';
        iconDiv.style.color = '';
        iconDiv.style.border = '1px solid #e5e5ea';
        iconDiv.style.display = 'flex';
        iconDiv.style.justifyContent = 'center';
        iconDiv.style.alignItems = 'center';
        iconDiv.innerHTML = '';

        if (app.id === 'dock-icon-settings') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fas fa-cog');
        } else if (app.id === 'dock-icon-imessage') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fas fa-comment');
        } else if (app.id === 'dock-icon-youtube') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fab fa-youtube');
        } else if (app.id === 'app-icon-1') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fas fa-wallet');
        } else if (app.id === 'app-icon-2') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fab fa-tiktok');
        } else if (app.id === 'app-icon-3') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fas fa-layer-group', 'font-size: 26px;');
        } else if (app.id === 'app-icon-4') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fa-brands fa-x-twitter', 'font-size: 26px;');
        } else if (app.id === 'app-icon-5') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fas fa-book', 'color: #1c1c1e; font-size: 30px; filter: none;');
        } else if (app.id === 'app-icon-6') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fas fa-map-location-dot', 'color: #1c1c1e; font-size: 28px; filter: none;');
        } else if (app.id === 'app-icon-7') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.backgroundColor = '#ffffff';
            iconDiv.style.color = '#111111';
            iconDiv.style.border = '1px solid #d9d9d9';
            ensureIconElement('fas fa-feather-pointed', 'color: #9d1d1d; font-size: 28px;');
        } else if (app.id === 'app-icon-8') {
            iconDiv.style.background = '#ffffff';
            iconDiv.style.color = '#1c1c1e';
            ensureIconElement('fab fa-spotify', 'color: #1c1c1e; font-size: 28px;');
        }
    }
}

// Apply theme on load
function applySavedTheme() {
    if (typeof window.scheduleViewportSync === 'function') {
        window.scheduleViewportSync();
    } else if (typeof window.syncViewportMetrics === 'function') {
        window.syncViewportMetrics();
    }

    applyThemeBackground(themeState);
    applyThemeFont(themeState);
    applyThemeAppIcons(themeState);
}
window.applySavedTheme = applySavedTheme;

// ==========================================
// --- Chat Sending Logic (Shared Helper Functions if needed) ---
// ==========================================
(() => {
    const chatInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('send-msg-btn');
    const micBtn = document.getElementById('mic-msg-btn');
    const chatMessagesContainer = document.getElementById('ins-chat-messages');

    function scrollToBottom() {
        if (chatMessagesContainer) {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }

    function appendUserMessage(msg) {
        if (!chatMessagesContainer) return;
        const row = document.createElement('div');
        row.className = 'chat-row user-row';
        row.innerHTML = `<div class="chat-bubble user-bubble">${msg}</div>`;
        chatMessagesContainer.appendChild(row);
        scrollToBottom();
    }

    function appendAiMessage(msg, friend) {
        if (!chatMessagesContainer) return;
        const row = document.createElement('div');
        row.className = 'chat-row ai-row';
        
        const avatarHtml = (friend && friend.avatarUrl) 
            ? `<img src="${friend.avatarUrl}">`
            : `<i class="fas fa-user"></i>`;

        row.innerHTML = `
            <div class="chat-avatar-small">${avatarHtml}</div>
            <div class="chat-bubble ai-bubble">${msg}</div>
        `;
        chatMessagesContainer.appendChild(row);
        scrollToBottom();
    }

    function appendAiTyping(friend) {
        if (!chatMessagesContainer) return null;
        const row = document.createElement('div');
        row.className = 'chat-row ai-row typing-row';
        
        const avatarHtml = (friend && friend.avatarUrl) 
            ? `<img src="${friend.avatarUrl}">`
            : `<i class="fas fa-user"></i>`;

        row.innerHTML = `
            <div class="chat-avatar-small">${avatarHtml}</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessagesContainer.appendChild(row);
        scrollToBottom();
        return row;
    }

    function handleSendMessage() {
        if (!chatInput) return;
        const msg = chatInput.value.trim();
        if (msg) {
            appendUserMessage(msg);
            chatInput.value = '';
        }
    }

    async function handleAiGenerate() {
        // Assuming currentActiveFriend is defined globally by another script that uses this
        if (typeof currentActiveFriend === 'undefined' || !currentActiveFriend) {
            showToast('No active friend selected.');
            return;
        }
        
        if (!apiConfig.endpoint || !apiConfig.apiKey) {
            showToast('请先配置 API Endpoint 和 Key');
            return;
        }

        const typingRow = appendAiTyping(currentActiveFriend);
        if(micBtn) micBtn.style.opacity = '0.5';

        const systemDepthWorldBookContext = window.getGlobalWorldBookContextByPosition
            ? window.getGlobalWorldBookContextByPosition('system_depth')
            : '';
        const beforeRoleWorldBookContext = window.getGlobalWorldBookContextByPosition
            ? window.getGlobalWorldBookContextByPosition('before_role')
            : '';
        const afterRoleWorldBookContext = window.getGlobalWorldBookContextByPosition
            ? window.getGlobalWorldBookContextByPosition('after_role')
            : '';
        const systemPrompt = `${systemDepthWorldBookContext ? `System Depth Rules (Highest Priority):\n${systemDepthWorldBookContext}\n\n` : ''}${beforeRoleWorldBookContext ? `Before Role Rules:\n${beforeRoleWorldBookContext}\n\n` : ''}You are playing the role of ${currentActiveFriend.realName || currentActiveFriend.nickname}. 
Your persona is: ${currentActiveFriend.persona || 'No specific persona'}. 
You are talking to ${userState.name}, whose persona is: ${userState.persona || 'A normal user'}.${afterRoleWorldBookContext ? `\n\nAfter Role Rules:\n${afterRoleWorldBookContext}` : ''}

Reply naturally as your character in a chat app. Do not include your own name at the beginning.`;

        const messages = [{ role: 'system', content: systemPrompt }];
        
        if (chatMessagesContainer) {
            const rows = chatMessagesContainer.querySelectorAll('.chat-row');
            const recentRows = Array.from(rows).slice(-10);
            recentRows.forEach(row => {
                if (row.classList.contains('typing-row')) return;
                const bubble = row.querySelector('.chat-bubble');
                if (bubble) {
                    if (row.classList.contains('user-row')) {
                        messages.push({ role: 'user', content: bubble.textContent });
                    } else if (row.classList.contains('ai-row')) {
                        messages.push({ role: 'assistant', content: bubble.textContent });
                    }
                }
            });
        }
        
        if (messages.length === 1) {
            messages.push({ role: 'user', content: '你好' });
        }

        try {
            let endpoint = apiConfig.endpoint;
            // 确保 endpoint 结尾没有 /，且自动补全 /chat/completions 或 /v1/chat/completions 
            if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if(!endpoint.endsWith('/chat/completions')) {
                endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: apiConfig.model || '',
                    messages: messages,
                    temperature: parseFloat(apiConfig.temperature) || 0.7
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            const aiReply = data.choices[0].message.content;
            
            if (typingRow) typingRow.remove();
            appendAiMessage(aiReply, currentActiveFriend);

        } catch (error) {
            console.error(error);
            if (typingRow) typingRow.remove();
            showToast('API 请求失败，请检查配置或网络');
        } finally {
            if(micBtn) micBtn.style.opacity = '1';
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }

    if (micBtn) {
        micBtn.addEventListener('click', handleAiGenerate);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
})();
