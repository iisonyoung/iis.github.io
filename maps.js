(function() {
    function initMapsApp() {
        if (window.mapsApp && window.mapsApp.initialized) return;

        const mapsView = document.getElementById('maps-view');
        const mapsBackBtn = document.getElementById('maps-back-btn');
        const mapsCanvas = document.getElementById('maps-canvas');
        const mapsTitleText = document.getElementById('maps-title-text');
        const mapsSettingsBtn = document.getElementById('maps-settings-btn');
        const mapsSettingsSheet = document.getElementById('maps-settings-sheet');
        const mapsSearchBtn = document.getElementById('maps-search-btn');
        const mapsFocusMeBtn = document.getElementById('maps-focus-me-btn');
        const mapsMapSwitcherBtn = document.getElementById('maps-map-switcher-btn');

        const segmentChips = Array.from(document.querySelectorAll('.maps-segment-chip'));
        const contactsPanel = document.getElementById('maps-panel-contacts');
        const mePanel = document.getElementById('maps-panel-me');

        const contactList = document.getElementById('maps-contact-list');
        const contactEmpty = document.getElementById('maps-contact-empty');

        const mapsMeLocationInput = document.getElementById('maps-me-location-input');

        const settingNameInput = document.getElementById('maps-setting-name');
        const addPinNameInput = document.getElementById('maps-add-pin-name');
        const addPinDescInput = document.getElementById('maps-add-pin-desc');
        const addPinBtn = document.getElementById('maps-add-pin-btn');
        const savePresetBtn = document.getElementById('maps-save-preset-btn');
        const addPinIconBtns = Array.from(document.querySelectorAll('.maps-icon-btn'));

        const customPinsContainer = document.getElementById('maps-custom-pins-container');
        const mapsMapList = document.getElementById('maps-map-list');
        const mapsMapSwitcherOverlay = document.getElementById('maps-map-switcher-overlay');
        const mapsMapSwitcherList = document.getElementById('maps-map-switcher-list');
        const mapsPlaceList = document.getElementById('maps-place-list');

        const friendPopoverOverlay = document.getElementById('maps-friend-popover-overlay');
        const friendPopoverAvatar = document.getElementById('maps-friend-popover-avatar');
        const friendPopoverName = document.getElementById('maps-friend-popover-name');
        const friendMapSelect = document.getElementById('maps-friend-map-select');
        const friendPositionInput = document.getElementById('maps-friend-position-input');
        const friendDescriptionInput = document.getElementById('maps-friend-description-input');
        const friendPopoverCancelBtn = document.getElementById('maps-friend-popover-cancel-btn');
        const friendPopoverSaveBtn = document.getElementById('maps-friend-popover-save-btn');
        const friendPopoverTabs = Array.from(document.querySelectorAll('.maps-friend-popover-tab'));
        const friendPopoverPanels = Array.from(document.querySelectorAll('.maps-friend-popover-panel'));
        const friendScheduleApiBtn = document.getElementById('maps-friend-schedule-api-btn');
        const friendScheduleAddBtn = document.getElementById('maps-friend-schedule-add-btn');
        const friendScheduleTimeline = document.getElementById('maps-friend-schedule-timeline');

        const placePopoverOverlay = document.getElementById('maps-place-popover-overlay');
        const placeNameInput = document.getElementById('maps-place-name-input');
        const placeDescInput = document.getElementById('maps-place-desc-input');
        const placePopoverCancelBtn = document.getElementById('maps-place-popover-cancel-btn');
        const placePopoverSaveBtn = document.getElementById('maps-place-popover-save-btn');

        if (!mapsView || !mapsCanvas || !customPinsContainer) return;

        const DEFAULT_MAP_ID = 'default-map';
        const DEFAULT_MAP = {
            id: DEFAULT_MAP_ID,
            name: '地图',
            myLocation: {
                text: '我的房间',
                x: 50,
                y: 52
            },
            pins: []
        };

        const DEFAULT_FRIEND_TEXTS = [
            '海边',
            '学校后门',
            '便利店',
            '天台',
            '图书馆',
            '训练室',
            '街角',
            '咖啡店',
            '公园',
            '地铁口',
            '宿舍',
            '球场'
        ];

        let currentSelectedIcon = 'fas fa-location-dot';
        let currentActivePanel = 'contacts';
        let activeFriendPopoverId = null;
        let activePlacePopoverId = null;
        let activeFriendSchedules = [];
        let renderFrameRequested = false;
        let meLocationInputTimer = null;

        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        function roundPercent(value) {
            return `${Number(value).toFixed(1)}%`;
        }

        function hashString(input) {
            const source = String(input || '');
            let hash = 0;
            for (let index = 0; index < source.length; index += 1) {
                hash = ((hash << 5) - hash) + source.charCodeAt(index);
                hash |= 0;
            }
            return Math.abs(hash);
        }

        function normalizePoint(x, y) {
            return {
                x: clamp(Number(x) || 0, 6, 94),
                y: clamp(Number(y) || 0, 10, 90)
            };
        }

        function parsePointText(input) {
            const source = String(input || '').trim();
            if (!source) return null;
            const parts = source.split(',').map(item => Number(item.trim()));
            if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
            return normalizePoint(parts[0], parts[1]);
        }

        function normalizeMyLocation(data) {
            const point = normalizePoint(
                data && data.x != null ? data.x : DEFAULT_MAP.myLocation.x,
                data && data.y != null ? data.y : DEFAULT_MAP.myLocation.y
            );

            return {
                text: (data && data.text ? String(data.text).trim() : '') || DEFAULT_MAP.myLocation.text,
                x: point.x,
                y: point.y
            };
        }

        function normalizePin(pin) {
            if (!pin) return null;
            const point = normalizePoint(pin.x, pin.y);
            return {
                id: String(pin.id || Date.now()),
                name: String(pin.name || '新地点').trim() || '新地点',
                desc: String(pin.desc || '').trim(),
                icon: String(pin.icon || 'fas fa-map-marker-alt'),
                x: point.x,
                y: point.y
            };
        }

        function normalizeMapItem(map, index = 0) {
            return {
                id: String(map && map.id ? map.id : `map-${index + 1}`),
                name: (map && map.name ? String(map.name).trim() : '') || `地图 ${index + 1}`,
                myLocation: normalizeMyLocation(map && map.myLocation ? map.myLocation : {}),
                pins: Array.isArray(map && map.pins) ? map.pins.map(normalizePin).filter(Boolean) : []
            };
        }

        function ensureMapsGlobalState() {
            if (!window.__mapsGlobalState || typeof window.__mapsGlobalState !== 'object') {
                const rawState = typeof window.getAppState === 'function'
                    ? window.getAppState('maps')
                    : null;
                window.__mapsGlobalState = rawState && typeof rawState === 'object'
                    ? {
                        mapsStore: Array.isArray(rawState.mapsStore) ? rawState.mapsStore : [normalizeMapItem(DEFAULT_MAP)],
                        activeMapId: rawState.activeMapId || null,
                        friendPositionsStore: rawState.friendPositionsStore && typeof rawState.friendPositionsStore === 'object'
                            ? rawState.friendPositionsStore
                            : {}
                    }
                    : {};
            }
            if (!Array.isArray(window.__mapsGlobalState.mapsStore) || window.__mapsGlobalState.mapsStore.length === 0) {
                window.__mapsGlobalState.mapsStore = [normalizeMapItem(DEFAULT_MAP)];
            }
            if (!window.__mapsGlobalState.friendPositionsStore || typeof window.__mapsGlobalState.friendPositionsStore !== 'object') {
                window.__mapsGlobalState.friendPositionsStore = {};
            }
            return window.__mapsGlobalState;
        }

        function persistMapsGlobalState() {
            const state = ensureMapsGlobalState();
            const nextState = {
                mapsStore: Array.isArray(state.mapsStore) ? state.mapsStore.map((item, index) => normalizeMapItem(item, index)) : [normalizeMapItem(DEFAULT_MAP)],
                activeMapId: state.activeMapId || null,
                friendPositionsStore: state.friendPositionsStore && typeof state.friendPositionsStore === 'object'
                    ? state.friendPositionsStore
                    : {}
            };

            window.__mapsGlobalState = nextState;

            if (typeof window.setAppState === 'function') {
                window.setAppState('maps', nextState);
            } else if (window.saveGlobalData) {
                window.saveGlobalData();
            }
        }

        function getMapsStore() {
            const state = ensureMapsGlobalState();
            const parsed = state.mapsStore;
            if (!Array.isArray(parsed) || parsed.length === 0) {
                state.mapsStore = [normalizeMapItem(DEFAULT_MAP)];
                return state.mapsStore;
            }
            state.mapsStore = parsed.map((item, index) => normalizeMapItem(item, index));
            return state.mapsStore;
        }

        function saveMapsStore(maps) {
            const normalized = Array.isArray(maps) && maps.length > 0
                ? maps.map((item, index) => normalizeMapItem(item, index))
                : [normalizeMapItem(DEFAULT_MAP)];

            ensureMapsGlobalState().mapsStore = normalized;
            persistMapsGlobalState();
            return normalized;
        }

        function getActiveMapId() {
            const state = ensureMapsGlobalState();
            const stored = state.activeMapId;
            const maps = getMapsStore();
            if (stored && maps.some(map => map.id === stored)) return stored;
            return maps[0].id;
        }

        function setActiveMapId(mapId) {
            ensureMapsGlobalState().activeMapId = mapId;
            persistMapsGlobalState();
        }

        function getActiveMap() {
            const maps = getMapsStore();
            const activeMapId = getActiveMapId();
            return maps.find(map => map.id === activeMapId) || maps[0];
        }

        function saveActiveMap(nextMap) {
            const maps = getMapsStore();
            const updatedMaps = maps.map(map => (map.id === nextMap.id ? normalizeMapItem(nextMap) : map));
            saveMapsStore(updatedMaps);
            setActiveMapId(nextMap.id);
        }

        function createMapIfNeeded() {
            const maps = getMapsStore();
            const trimmedName = settingNameInput ? settingNameInput.value.trim() : '';
            const activeMap = getActiveMap();

            if (!trimmedName || trimmedName === activeMap.name) {
                return activeMap;
            }

            const existingByName = maps.find(map => map.name === trimmedName);
            if (existingByName) {
                setActiveMapId(existingByName.id);
                return existingByName;
            }

            const newMap = normalizeMapItem({
                id: `map-${Date.now()}`,
                name: trimmedName,
                myLocation: activeMap.myLocation,
                pins: activeMap.pins
            }, maps.length);

            saveMapsStore([...maps, newMap]);
            setActiveMapId(newMap.id);
            return newMap;
        }

        function getVisibleFriends() {
            const friends = typeof window.getImFriends === 'function'
                ? window.getImFriends()
                : (window.imData && Array.isArray(window.imData.friends) ? window.imData.friends : []);

            return friends.filter(friend => {
                if (!friend) return false;
                if (friend.type === 'npc') return false;
                if (friend.type === 'group') return false;
                if (friend.type === 'official') return false;
                return true;
            });
        }

        function getFriendPositionsStore() {
            const state = ensureMapsGlobalState();
            const parsed = state.friendPositionsStore;
            if (parsed && typeof parsed === 'object') return parsed;
            state.friendPositionsStore = {};
            return state.friendPositionsStore;
        }

        function saveFriendPositionsStore(store) {
            ensureMapsGlobalState().friendPositionsStore = store || {};
            persistMapsGlobalState();
        }

        function createDefaultFriendPosition(friend) {
            const seed = `${friend.id || ''}-${friend.nickname || friend.realName || friend.signature || ''}`;
            const hash = hashString(seed);
            const x = 16 + (hash % 68);
            const y = 18 + (((hash / 97) | 0) % 56);
            return {
                text: DEFAULT_FRIEND_TEXTS[hash % DEFAULT_FRIEND_TEXTS.length],
                ...normalizePoint(x, y)
            };
        }

        function normalizeFriendPosition(value, fallbackText) {
            const point = normalizePoint(value && value.x, value && value.y);
            return {
                text: (value && value.text ? String(value.text).trim() : '') || fallbackText || '附近',
                x: point.x,
                y: point.y
            };
        }

        function ensureFriendPosition(friend, mapId = getActiveMapId()) {
            const store = getFriendPositionsStore();
            if (!store[mapId]) store[mapId] = {};

            const friendId = String(friend.id);
            if (!store[mapId][friendId]) {
                store[mapId][friendId] = createDefaultFriendPosition(friend);
                saveFriendPositionsStore(store);
            }

            store[mapId][friendId] = normalizeFriendPosition(
                store[mapId][friendId],
                createDefaultFriendPosition(friend).text
            );
            return store[mapId][friendId];
        }

        function updateFriendPosition(friendId, mapId, patch) {
            const store = getFriendPositionsStore();
            if (!store[mapId]) store[mapId] = {};
            store[mapId][friendId] = normalizeFriendPosition(
                {
                    ...(store[mapId][friendId] || {}),
                    ...patch
                },
                '附近'
            );
            saveFriendPositionsStore(store);
        }

        function getDisplayName(friend) {
            return friend.nickname || friend.realName || '好友';
        }

        function getDisplaySub(friend) {
            return friend.signature || friend.realName || '已添加好友';
        }

        function getInitials(name) {
            const normalized = String(name || '友').trim();
            if (!normalized) return '友';
            const asciiParts = normalized.split(/\s+/).filter(Boolean);
            if (asciiParts.length > 1) {
                return asciiParts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
            }
            return normalized.slice(0, 2).toUpperCase();
        }

        function createContactAvatar(friend) {
            if (friend.avatarUrl) {
                return `<img src="${friend.avatarUrl}" alt="${getDisplayName(friend)}">`;
            }
            return `<span>${getInitials(getDisplayName(friend))}</span>`;
        }

        function createFriendPinAvatar(friend) {
            if (friend.avatarUrl) {
                return `<img src="${friend.avatarUrl}" alt="${getDisplayName(friend)}">`;
            }
            return `<span>${getInitials(getDisplayName(friend))}</span>`;
        }

        function getCurrentAppleAccount() {
            const accounts = typeof window.getAccounts === 'function' ? window.getAccounts() : [];
            const currentAccountId = typeof window.getCurrentAccountId === 'function' ? window.getCurrentAccountId() : null;
            if (!Array.isArray(accounts) || currentAccountId == null) return null;
            return accounts.find(acc => String(acc.id) === String(currentAccountId)) || null;
        }

        function createMyPinAvatar() {
            const currentAccount = getCurrentAppleAccount();
            if (currentAccount && currentAccount.avatarUrl) {
                return `<img src="${currentAccount.avatarUrl}" alt="${currentAccount.name || '我'}">`;
            }
            return '<i class="fas fa-location-crosshairs"></i>';
        }

        function setActivePanel(target) {
            currentActivePanel = target === 'me' ? 'me' : (target === 'map' ? 'map' : 'contacts');

            segmentChips.forEach(chip => {
                chip.classList.toggle('active', chip.dataset.target === currentActivePanel);
            });

            if (contactsPanel) contactsPanel.classList.toggle('active', currentActivePanel === 'contacts');
            if (mePanel) mePanel.classList.toggle('active', currentActivePanel === 'me');
        }

        function updateTitle(name) {
            if (mapsTitleText) {
                mapsTitleText.textContent = name || DEFAULT_MAP.name;
            }
        }

        function syncSettingsForm() {
            const activeMap = getActiveMap();

            if (settingNameInput) {
                settingNameInput.value = activeMap.name || DEFAULT_MAP.name;
            }
        }

        function renderMePanel() {
            const activeMap = getActiveMap();

            if (mapsMeLocationInput && document.activeElement !== mapsMeLocationInput) {
                mapsMeLocationInput.value = activeMap.myLocation.text || DEFAULT_MAP.myLocation.text;
            }
        }

        function renderMapLists() {
            const maps = getMapsStore();
            const activeMapId = getActiveMapId();
            const activeMap = getActiveMap();

            if (mapsMapList) {
                mapsMapList.innerHTML = maps.map(map => `
                <div class="maps-map-list-item${map.id === activeMapId ? ' active' : ''}" data-map-id="${map.id}">
                    <span>${map.name}</span>
                    <span class="maps-map-list-meta">${map.pins.length} 个地点</span>
                </div>
            `).join('');
            }

            if (mapsMapSwitcherList) {
                mapsMapSwitcherList.innerHTML = maps.map(map => `
                <div class="maps-map-switcher-item${map.id === activeMapId ? ' active' : ''}" data-map-id="${map.id}">
                    <span>${map.name}</span>
                    <span class="maps-map-switcher-meta">${map.pins.length} 个地点</span>
                </div>
            `).join('');
            }

            if (mapsPlaceList) {
                if (!activeMap.pins.length) {
                    mapsPlaceList.innerHTML = `
                    <div class="maps-place-list-item">
                        <div class="maps-place-list-main">
                            <div class="maps-place-list-name">暂无地点</div>
                            <div class="maps-place-list-desc">添加后的地点会显示在这里</div>
                        </div>
                    </div>
                `;
                } else {
                    mapsPlaceList.innerHTML = activeMap.pins.map(pin => `
                    <div class="maps-place-list-item" data-pin-id="${pin.id}">
                        <div class="maps-place-list-main">
                            <div class="maps-place-list-name">${pin.name}</div>
                            <div class="maps-place-list-desc">${pin.desc || '暂无详情'}</div>
                        </div>
                        <button class="maps-place-delete-btn" type="button" data-pin-delete="${pin.id}">
                            <i class="fas fa-xmark"></i>
                        </button>
                    </div>
                `).join('');
                }
            }
        }

        function openMapSwitcher() {
            renderMapLists();
            if (mapsMapSwitcherOverlay) {
                mapsMapSwitcherOverlay.classList.add('active');
            }
        }

        function closeMapSwitcher() {
            if (mapsMapSwitcherOverlay) {
                mapsMapSwitcherOverlay.classList.remove('active');
            }
        }

        function buildFriendPopoverAvatar(friend) {
            if (friend.avatarUrl) {
                return `<img src="${friend.avatarUrl}" alt="${getDisplayName(friend)}">`;
            }
            return `<span>${getInitials(getDisplayName(friend))}</span>`;
        }

        function syncFriendPopoverFields(friendId, mapId) {
            const friend = getVisibleFriends().find(item => String(item.id) === String(friendId));
            if (!friend) return;

            const position = ensureFriendPosition(friend, mapId);
            if (friendPositionInput) {
                friendPositionInput.value = `${Number(position.x).toFixed(1)}, ${Number(position.y).toFixed(1)}`;
            }
            if (friendDescriptionInput) {
                friendDescriptionInput.value = position.text || '';
            }

            renderFriendSchedule(friend, mapId);
        }

        function setFriendPopoverTab(tab) {
            const nextTab = tab === 'schedule' ? 'schedule' : 'settings';

            friendPopoverTabs.forEach(item => {
                item.classList.toggle('active', item.dataset.tab === nextTab);
            });

            friendPopoverPanels.forEach(item => {
                item.classList.toggle('active', item.dataset.panel === nextTab);
            });
        }

        function openFriendPopover(friend) {
            activeFriendPopoverId = String(friend.id);
            setFriendPopoverTab('settings');

            if (friendPopoverAvatar) {
                friendPopoverAvatar.innerHTML = buildFriendPopoverAvatar(friend);
            }

            if (friendPopoverName) {
                friendPopoverName.textContent = getDisplayName(friend);
            }

            if (friendMapSelect) {
                const maps = getMapsStore();
                const activeMapId = getActiveMapId();
                friendMapSelect.innerHTML = maps.map(map => `
                <option value="${map.id}" ${map.id === activeMapId ? 'selected' : ''}>${map.name}</option>
            `).join('');
            }

            syncFriendPopoverFields(friend.id, friendMapSelect ? friendMapSelect.value : getActiveMapId());

            if (friendPopoverOverlay) {
                friendPopoverOverlay.classList.add('active');
            }
        }

        function closeFriendPopover() {
            activeFriendPopoverId = null;
            setFriendPopoverTab('settings');
            if (friendPopoverOverlay) {
                friendPopoverOverlay.classList.remove('active');
            }
        }

        function openPlacePopover(pinId) {
            const activeMap = getActiveMap();
            const pin = activeMap.pins.find(item => String(item.id) === String(pinId));
            if (!pin) return;

            activePlacePopoverId = String(pinId);

            if (placeNameInput) {
                placeNameInput.value = pin.name || '';
            }

            if (placeDescInput) {
                placeDescInput.value = pin.desc || '';
            }

            if (placePopoverOverlay) {
                placePopoverOverlay.classList.add('active');
            }
        }

        function closePlacePopover() {
            activePlacePopoverId = null;
            if (placePopoverOverlay) {
                placePopoverOverlay.classList.remove('active');
            }
        }

        function saveFriendPopover() {
            if (!activeFriendPopoverId) return;
            const mapId = friendMapSelect ? friendMapSelect.value : getActiveMapId();
            const point = parsePointText(friendPositionInput ? friendPositionInput.value : '') || { x: 50, y: 52 };
            const description = friendDescriptionInput ? friendDescriptionInput.value.trim() : '';

            updateFriendPosition(activeFriendPopoverId, mapId, {
                x: point.x,
                y: point.y,
                text: description || '附近'
            });

            if (mapId === getActiveMapId()) {
                requestRenderMap();
            }

            closeFriendPopover();
            if (window.showToast) {
                window.showToast('好友位置已保存');
            }
        }

        function savePlacePopover() {
            if (!activePlacePopoverId) return;

            const activeMap = getActiveMap();
            activeMap.pins = activeMap.pins.map(pin => {
                if (String(pin.id) !== String(activePlacePopoverId)) return pin;
                return {
                    ...pin,
                    name: (placeNameInput ? placeNameInput.value.trim() : '') || pin.name || '新地点',
                    desc: placeDescInput ? placeDescInput.value.trim() : pin.desc
                };
            });

            saveActiveMap(activeMap);
            closePlacePopover();
            requestRenderMap();

            if (window.showToast) {
                window.showToast('地点已更新');
            }
        }

        function deletePin(pinId) {
            const activeMap = getActiveMap();
            const nextPins = activeMap.pins.filter(pin => String(pin.id) !== String(pinId));
            if (nextPins.length === activeMap.pins.length) return;

            activeMap.pins = nextPins;
            saveActiveMap(activeMap);
            requestRenderMap();

            if (window.showToast) {
                window.showToast('地点已删除');
            }
        }

        function renderFriendSchedule(friend, mapId = getActiveMapId()) {
            if (!friendScheduleTimeline) return;

            const position = ensureFriendPosition(friend, mapId);
            activeFriendSchedules = [
                {
                    id: `schedule-${String(friend.id)}-1`,
                    time: '08:30',
                    title: `${getDisplayName(friend)} 的早间安排`,
                    place: position.text || '附近'
                },
                {
                    id: `schedule-${String(friend.id)}-2`,
                    time: '11:00',
                    title: '午前行程',
                    place: position.text || '便利店'
                },
                {
                    id: `schedule-${String(friend.id)}-3`,
                    time: '15:00',
                    title: '下午活动',
                    place: position.text || '海边'
                },
                {
                    id: `schedule-${String(friend.id)}-4`,
                    time: '18:30',
                    title: '晚间安排',
                    place: position.text || '街角'
                }
            ];

            friendScheduleTimeline.innerHTML = activeFriendSchedules.map(item => `
            <div class="maps-friend-schedule-item" data-schedule-id="${item.id}">
                <div class="maps-friend-schedule-time">${item.time}</div>
                <div class="maps-friend-schedule-dot"></div>
                <div class="maps-friend-schedule-card">
                    <div class="maps-friend-schedule-card-top">
                        <div class="maps-friend-schedule-card-title">${item.title}</div>
                        <div class="maps-friend-schedule-card-actions">
                            <button class="maps-friend-schedule-collect-btn" type="button">收录</button>
                            <button class="maps-friend-schedule-delete-btn" type="button" aria-label="删除行程">×</button>
                        </div>
                    </div>
                    <div class="maps-friend-schedule-card-sub">地点：${item.place}</div>
                </div>
            </div>
        `).join('');
        }

        function saveMyLocationText(nextText) {
            const activeMap = getActiveMap();
            activeMap.myLocation = {
                ...activeMap.myLocation,
                text: nextText || DEFAULT_MAP.myLocation.text
            };
            saveActiveMap(activeMap);
        }

        function renderContactsPanel() {
            if (!contactList || !contactEmpty) return;

            const friends = getVisibleFriends();
            contactList.innerHTML = '';

            if (friends.length === 0) {
                contactList.style.display = 'none';
                contactEmpty.style.display = 'flex';
                return;
            }

            contactList.style.display = 'flex';
            contactEmpty.style.display = 'none';

            const activeMapId = getActiveMapId();

            friends.forEach((friend, index) => {
                const position = ensureFriendPosition(friend, activeMapId);
                const item = document.createElement('div');
                item.className = `maps-contact-item${index === 0 ? ' active' : ''}`;
                item.dataset.friendId = String(friend.id);
                item.innerHTML = `
                <div class="maps-contact-avatar">${createContactAvatar(friend)}</div>
                <div class="maps-contact-meta">
                    <div class="maps-contact-name">${getDisplayName(friend)}</div>
                    <div class="maps-contact-sub">${position.text || getDisplaySub(friend)}</div>
                </div>
                <div class="maps-contact-status">设置</div>
            `;

                item.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    openFriendPopover(friend);
                });

                contactList.appendChild(item);
            });
        }

        function clearDynamicLayers() {
            const friendLayer = mapsCanvas.querySelector('.maps-map-friends-layer');
            if (friendLayer) friendLayer.remove();

            const myLayer = mapsCanvas.querySelector('.maps-my-pin-layer');
            if (myLayer) myLayer.remove();

            customPinsContainer.innerHTML = '';
        }

        function renderMyPin() {
            const activeMap = getActiveMap();
            const layer = document.createElement('div');
            layer.className = 'maps-my-pin-layer';

            const myPin = document.createElement('div');
            myPin.className = 'maps-my-pin';
            myPin.dataset.type = 'my-location';
            myPin.style.left = `${activeMap.myLocation.x}%`;
            myPin.style.top = `${activeMap.myLocation.y}%`;
            myPin.innerHTML = `
            <div class="maps-my-pin-inner">
                <div class="maps-my-avatar-wrap">
                    <div class="maps-my-avatar">
                        ${createMyPinAvatar()}
                    </div>
                </div>
            </div>
        `;

            enableDragging(myPin, point => {
                const latestMap = getActiveMap();
                latestMap.myLocation = {
                    ...latestMap.myLocation,
                    x: point.x,
                    y: point.y
                };
                saveActiveMap(latestMap);
                requestRenderMap();
            });

            layer.appendChild(myPin);
            mapsCanvas.appendChild(layer);
        }

        function renderFriendPins() {
            const layer = document.createElement('div');
            layer.className = 'maps-map-friends-layer';

            const friends = getVisibleFriends();
            const activeMapId = getActiveMapId();

            friends.forEach(friend => {
                const position = ensureFriendPosition(friend, activeMapId);
                const pinEl = document.createElement('div');
                pinEl.className = 'maps-friend-pin';
                pinEl.dataset.friendId = String(friend.id);
                pinEl.style.left = `${position.x}%`;
                pinEl.style.top = `${position.y}%`;
                pinEl.innerHTML = `
                <div class="maps-friend-pin-inner">
                    <div class="maps-friend-pin-bubble">${position.text || '附近'}</div>
                    <div class="maps-friend-avatar-wrap">
                        <div class="maps-friend-avatar">${createFriendPinAvatar(friend)}</div>
                    </div>
                </div>
            `;

                enableDragging(pinEl, point => {
                    updateFriendPosition(String(friend.id), activeMapId, {
                        x: point.x,
                        y: point.y
                    });
                    requestRenderMap();
                });

                pinEl.addEventListener('click', event => {
                    event.stopPropagation();
                });

                layer.appendChild(pinEl);
            });

            mapsCanvas.appendChild(layer);
        }

        function renderCustomPins() {
            const activeMap = getActiveMap();

            activeMap.pins.forEach(pin => {
                const pinEl = document.createElement('div');
                pinEl.className = 'maps-custom-pin';
                pinEl.dataset.id = pin.id;
                pinEl.style.left = `${pin.x}%`;
                pinEl.style.top = `${pin.y}%`;
                pinEl.innerHTML = `
                <div class="maps-custom-pin-icon">
                    <i class="${pin.icon}"></i>
                </div>
            `;

                enableDragging(pinEl, point => {
                    const latestMap = getActiveMap();
                    latestMap.pins = latestMap.pins.map(item => {
                        if (item.id !== pin.id) return item;
                        return {
                            ...item,
                            x: point.x,
                            y: point.y
                        };
                    });
                    saveActiveMap(latestMap);
                    requestRenderMap();
                });

                customPinsContainer.appendChild(pinEl);
            });
        }

        function requestRenderMap() {
            if (renderFrameRequested) return;
            renderFrameRequested = true;
            requestAnimationFrame(() => {
                renderFrameRequested = false;
                renderMap();
            });
        }

        function renderMap() {
            const activeMap = getActiveMap();
            updateTitle(activeMap.name);
            syncSettingsForm();
            renderMePanel();
            renderMapLists();
            renderContactsPanel();
            clearDynamicLayers();
            renderMyPin();
            renderFriendPins();
            renderCustomPins();
        }

        function getCanvasPointFromClient(clientX, clientY) {
            const rect = mapsCanvas.getBoundingClientRect();
            const x = clamp(((clientX - rect.left) / rect.width) * 100, 6, 94);
            const y = clamp(((clientY - rect.top) / rect.height) * 100, 10, 90);
            return { x, y };
        }

        function enableDragging(element, onCommit) {
            let dragging = false;
            let activePointerId = null;
            let startPoint = null;
            let latestPoint = null;
            let moveFrame = null;

            const flushMove = () => {
                moveFrame = null;
                if (!latestPoint) return;
                element.style.left = `${latestPoint.x}%`;
                element.style.top = `${latestPoint.y}%`;
            };

            const cleanup = () => {
                dragging = false;
                activePointerId = null;
                startPoint = null;
                latestPoint = null;
                element.classList.remove('dragging');
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.removeEventListener('pointercancel', onPointerUp);
                if (moveFrame) {
                    cancelAnimationFrame(moveFrame);
                    moveFrame = null;
                }
            };

            const onPointerMove = event => {
                if (!dragging || event.pointerId !== activePointerId) return;
                event.preventDefault();

                const point = getCanvasPointFromClient(event.clientX, event.clientY);
                latestPoint = point;

                if (startPoint) {
                    const deltaX = Math.abs(event.clientX - startPoint.clientX);
                    const deltaY = Math.abs(event.clientY - startPoint.clientY);
                    if (deltaX + deltaY < 3) return;
                }

                if (!moveFrame) {
                    moveFrame = requestAnimationFrame(flushMove);
                }
            };

            const onPointerUp = event => {
                if (!dragging || event.pointerId !== activePointerId) return;

                const point = latestPoint || getCanvasPointFromClient(event.clientX, event.clientY);

                if (typeof element.releasePointerCapture === 'function') {
                    try {
                        element.releasePointerCapture(activePointerId);
                    } catch (error) {
                        // ignore
                    }
                }

                cleanup();
                onCommit(point);
            };

            element.addEventListener('pointerdown', event => {
                event.preventDefault();
                event.stopPropagation();

                activePointerId = event.pointerId;
                dragging = true;
                startPoint = {
                    clientX: event.clientX,
                    clientY: event.clientY
                };
                latestPoint = getCanvasPointFromClient(event.clientX, event.clientY);
                element.classList.add('dragging');

                if (typeof element.setPointerCapture === 'function') {
                    try {
                        element.setPointerCapture(activePointerId);
                    } catch (error) {
                        // ignore
                    }
                }

                document.addEventListener('pointermove', onPointerMove, { passive: false });
                document.addEventListener('pointerup', onPointerUp);
                document.addEventListener('pointercancel', onPointerUp);
            });
        }

        function saveCurrentMap() {
            const targetMap = createMapIfNeeded();
            targetMap.name = settingNameInput ? (settingNameInput.value.trim() || targetMap.name || DEFAULT_MAP.name) : targetMap.name;

            saveActiveMap(targetMap);
            renderMap();

            if (window.closeView && mapsSettingsSheet) {
                window.closeView(mapsSettingsSheet);
            }

            if (window.showToast) {
                window.showToast('地图已保存');
            }
        }

        function addNewPin() {
            const name = addPinNameInput ? addPinNameInput.value.trim() : '';
            const desc = addPinDescInput ? addPinDescInput.value.trim() : '';
            if (!name) return;

            const activeMap = createMapIfNeeded();
            const hash = hashString(`${name}-${Date.now()}`);
            const x = 18 + (hash % 60);
            const y = 24 + (((hash / 67) | 0) % 48);

            activeMap.pins.push({
                id: Date.now().toString(),
                name,
                desc,
                icon: currentSelectedIcon,
                x,
                y
            });

            saveActiveMap(activeMap);
            renderMap();

            if (addPinNameInput) addPinNameInput.value = '';
            if (addPinDescInput) addPinDescInput.value = '';

            if (window.showToast) {
                window.showToast('新地点已添加，可直接拖动');
            }
        }

        function focusMyLocation() {
            setActivePanel('map');
            const myPin = mapsCanvas.querySelector('.maps-my-pin');
            if (myPin) {
                myPin.classList.add('dragging');
                window.setTimeout(() => myPin.classList.remove('dragging'), 260);
            }

            if (window.showToast) {
                window.showToast('我的位置可直接拖动');
            }
        }

        function switchToMap(mapId) {
            const maps = getMapsStore();
            if (!maps.some(map => map.id === mapId)) return;
            setActiveMapId(mapId);
            closeMapSwitcher();
            closeFriendPopover();
            renderMap();
        }

        function openMapsView() {
            if (window.isJiggleMode || window.preventAppClick) return;
            if (window.syncUIs) window.syncUIs();

            renderMap();
            setActivePanel('contacts');

            mapsView.classList.remove('closing');
            mapsView.classList.remove('active');

            requestAnimationFrame(() => {
                mapsView.classList.add('active');
            });
        }

        function closeMapsView() {
            if (!mapsView.classList.contains('active') || mapsView.classList.contains('closing')) return;

            mapsView.classList.add('closing');
            window.setTimeout(() => {
                mapsView.classList.remove('active');
                mapsView.classList.remove('closing');
                setActivePanel('contacts');
            }, 220);
        }

        addPinIconBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                addPinIconBtns.forEach(item => item.classList.remove('active'));
                btn.classList.add('active');
                currentSelectedIcon = btn.dataset.icon || 'fas fa-map-marker-alt';
            });
        });

        if (mapsSettingsBtn && mapsSettingsSheet && window.openView) {
            mapsSettingsBtn.addEventListener('click', event => {
                event.stopPropagation();
                syncSettingsForm();
                renderMapLists();
                window.openView(mapsSettingsSheet);
            });
        }

        if (savePresetBtn) {
            savePresetBtn.addEventListener('click', saveCurrentMap);
        }

        if (addPinBtn) {
            addPinBtn.addEventListener('click', addNewPin);
        }

        if (mapsSearchBtn) {
            mapsSearchBtn.addEventListener('click', focusMyLocation);
        }

        if (mapsFocusMeBtn) {
            mapsFocusMeBtn.addEventListener('click', focusMyLocation);
        }

        if (mapsMapSwitcherBtn) {
            mapsMapSwitcherBtn.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                openMapSwitcher();
            });
        }

        if (mapsMapList) {
            mapsMapList.addEventListener('click', event => {
                const item = event.target.closest('.maps-map-list-item');
                if (!item) return;
                switchToMap(item.dataset.mapId);
            });
        }

        if (mapsPlaceList) {
            mapsPlaceList.addEventListener('click', event => {
                const deleteBtn = event.target.closest('[data-pin-delete]');
                if (deleteBtn) {
                    event.preventDefault();
                    event.stopPropagation();
                    deletePin(deleteBtn.dataset.pinDelete);
                    return;
                }

                const item = event.target.closest('[data-pin-id]');
                if (!item) return;
                event.preventDefault();
                event.stopPropagation();
                openPlacePopover(item.dataset.pinId);
            });
        }

        if (mapsMapSwitcherList) {
            mapsMapSwitcherList.addEventListener('click', event => {
                const item = event.target.closest('.maps-map-switcher-item');
                if (!item) return;
                switchToMap(item.dataset.mapId);
            });
        }

        if (mapsMapSwitcherOverlay) {
            mapsMapSwitcherOverlay.addEventListener('click', event => {
                if (event.target === mapsMapSwitcherOverlay) {
                    closeMapSwitcher();
                }
            });
        }

        if (placePopoverOverlay) {
            placePopoverOverlay.addEventListener('click', event => {
                if (event.target === placePopoverOverlay) {
                    closePlacePopover();
                }
            });
        }

        if (friendPopoverOverlay) {
            friendPopoverOverlay.addEventListener('click', event => {
                if (event.target === friendPopoverOverlay) {
                    closeFriendPopover();
                }
            });
        }

        if (friendMapSelect) {
            friendMapSelect.addEventListener('change', () => {
                if (!activeFriendPopoverId) return;
                syncFriendPopoverFields(activeFriendPopoverId, friendMapSelect.value);
            });
        }

        if (friendPopoverTabs.length > 0) {
            friendPopoverTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    setFriendPopoverTab(tab.dataset.tab);
                });
            });
        }

        if (friendScheduleApiBtn) {
            friendScheduleApiBtn.addEventListener('click', () => {
                if (window.showToast) {
                    window.showToast('行程 API 生成功能暂未接入');
                }
            });
        }

        if (friendScheduleAddBtn) {
            friendScheduleAddBtn.addEventListener('click', () => {
                if (window.showToast) {
                    window.showToast('添加好友行程功能暂未接入');
                }
            });
        }

        if (friendScheduleTimeline) {
            friendScheduleTimeline.addEventListener('click', event => {
                const deleteBtn = event.target.closest('.maps-friend-schedule-delete-btn');
                if (deleteBtn) {
                    const item = deleteBtn.closest('[data-schedule-id]');
                    if (!item) return;
                    event.preventDefault();
                    event.stopPropagation();
                    item.remove();
                    activeFriendSchedules = activeFriendSchedules.filter(schedule => schedule.id !== item.dataset.scheduleId);
                    if (window.showToast) {
                        window.showToast('行程已删除');
                    }
                    return;
                }

                const collectBtn = event.target.closest('.maps-friend-schedule-collect-btn');
                if (!collectBtn) return;
                event.preventDefault();
                event.stopPropagation();
                if (window.showToast) {
                    window.showToast('收录功能暂未接入');
                }
            });
        }

        if (friendPopoverCancelBtn) {
            friendPopoverCancelBtn.addEventListener('click', closeFriendPopover);
        }

        if (friendPopoverSaveBtn) {
            friendPopoverSaveBtn.addEventListener('click', saveFriendPopover);
        }

        if (placePopoverCancelBtn) {
            placePopoverCancelBtn.addEventListener('click', closePlacePopover);
        }

        if (placePopoverSaveBtn) {
            placePopoverSaveBtn.addEventListener('click', savePlacePopover);
        }

        if (mapsMeLocationInput) {
            mapsMeLocationInput.addEventListener('input', () => {
                const nextValue = mapsMeLocationInput.value.trim();

                if (meLocationInputTimer) {
                    clearTimeout(meLocationInputTimer);
                }

                meLocationInputTimer = window.setTimeout(() => {
                    saveMyLocationText(nextValue);
                    requestRenderMap();
                }, 120);
            });

            mapsMeLocationInput.addEventListener('blur', () => {
                const nextValue = mapsMeLocationInput.value.trim();

                if (meLocationInputTimer) {
                    clearTimeout(meLocationInputTimer);
                    meLocationInputTimer = null;
                }

                saveMyLocationText(nextValue);
                requestRenderMap();
            });
        }

        if (mapsBackBtn) {
            mapsBackBtn.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                closeMapsView();
            });
        }

        document.addEventListener('click', event => {
            const appItem = event.target.closest('.app-item');
            if (appItem && appItem.querySelector('#app-icon-6')) {
                event.preventDefault();
                event.stopPropagation();
                openMapsView();
                return;
            }

            const chip = event.target.closest('.maps-segment-chip');
            if (chip) {
                event.preventDefault();
                setActivePanel(chip.dataset.target);
            }
        });

        setActivePanel('contacts');
        ensureMapsGlobalState();
        saveMapsStore(getMapsStore());
        setActiveMapId(getActiveMapId());
        renderMap();

        window.mapsApp = Object.assign(window.mapsApp || {}, {
            initialized: true,
            init: initMapsApp,
            open: openMapsView,
            close: closeMapsView,
            render: renderMap
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMapsApp, { once: true });
    } else {
        initMapsApp();
    }
})();
