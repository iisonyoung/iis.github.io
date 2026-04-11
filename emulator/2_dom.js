// ==========================================
// 2. DOM ELEMENTS
// ==========================================

// --- Helper: Get/Create Avatar Img Tag ---
function createOrGetImg(parent) {
    if (!parent) return null;
    let img = parent.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        img.style.display = 'none';
        parent.appendChild(img);
    }
    return img;
}

const UI = {
    views: {
        settings: document.getElementById('settings-view'),
        edit: document.getElementById('edit-view'), // Apple ID Profile View
        worldBook: document.getElementById('world-book-view')
    },
    overlays: {
        accountSwitcher: document.getElementById('account-sheet-overlay'),
        personaDetail: document.getElementById('persona-detail-sheet'),
        apiConfig: document.getElementById('api-config-sheet'),
        themeConfig: document.getElementById('theme-config-sheet'),
        widgetGallery: document.getElementById('widget-gallery-sheet'),
        aboutDevice: document.getElementById('about-device-sheet'),
        addFriend: document.getElementById('add-friend-sheet'),
        savePreset: document.getElementById('save-preset-name-sheet'),
        loadPreset: document.getElementById('load-preset-list-sheet'),
        modelPicker: document.getElementById('model-picker-sheet'),
        addGroup: document.getElementById('add-group-overlay'),
        addBook: document.getElementById('add-book-overlay'), // Also used for Edit
        bookGroupPicker: document.getElementById('book-group-picker-sheet')
    },
    displays: {
        homeName: document.querySelector('.username'),
        homeAvatarImg: createOrGetImg(document.querySelector('.avatar')),
        homeAvatarIcon: document.querySelector('.avatar i'),
        
        settingsName: document.getElementById('settings-name'),
        settingsAvatarImg: document.getElementById('settings-avatar-img'),
        settingsAvatarIcon: document.querySelector('.apple-id-avatar-small i'),

        displayName: document.getElementById('display-name'),
        displayPhone: document.getElementById('display-phone'),
        editAvatarImg: document.getElementById('edit-avatar-img'),
        editAvatarIcon: document.querySelector('#edit-avatar-preview i'),
    },
    inputs: {
        detailName: document.getElementById('detail-name-input'),
        detailPhone: document.getElementById('detail-phone-input'),
        detailSignature: document.getElementById('detail-signature-input'),
        detailPersona: document.getElementById('detail-persona-input'),
        detailAvatarImg: document.getElementById('detail-avatar-img'),
        detailAvatarIcon: document.querySelector('#detail-avatar-preview i'),
        
        friendRealName: document.getElementById('friend-realname-input'),
        friendNickname: document.getElementById('friend-nickname-input'),
        friendSignature: document.getElementById('friend-signature-input'),
        friendPersona: document.getElementById('friend-persona-input'),
        friendAvatarImg: document.getElementById('friend-avatar-img'),
        friendAvatarIcon: document.querySelector('#friend-avatar-preview i'),

        apiEndpoint: document.getElementById('api-endpoint-input'),
        apiKey: document.getElementById('api-key-input'),
        apiTemp: document.getElementById('api-temp-input'),
        apiModel: document.getElementById('api-model-input'),
        presetName: document.getElementById('preset-name-input'),
        apiEnableSubToggle: document.getElementById('api-enable-sub-toggle'),
        apiTabMain: document.getElementById('api-tab-main'),
        apiTabSub: document.getElementById('api-tab-sub'),
        mainApiControls: document.getElementById('main-api-controls'),
        subApiControls: document.getElementById('sub-api-controls'),
        modelSearchInput: document.getElementById('model-search-input'),
        
        themeBgUrl: document.getElementById('theme-bg-url-input'),
        themeAppList: document.getElementById('theme-app-list')
    },
    lists: {
        accounts: document.getElementById('account-list'),
        presets: document.getElementById('preset-list'),
        models: document.getElementById('model-list')
    }
};
window.UI = UI;
