document.addEventListener('DOMContentLoaded', () => {
    const spotifyView = document.getElementById('spotify-view');
    const spotifyShell = document.getElementById('spotify-shell');
    const spotifyBackBtn = document.getElementById('spotify-back-btn');
    const spotifyHomeBackBtn = document.getElementById('spotify-home-back-btn');
    const spotifyMeBackBtn = document.getElementById('spotify-me-back-btn');
    const spotifyMeMoreBtn = document.getElementById('spotify-me-more-btn');
    const spotifyPlaylistMoreBtn = document.getElementById('spotify-playlist-more-btn');

    const spotifyHomeScreen = document.getElementById('spotify-home-screen');
    const spotifyMeScreen = document.getElementById('spotify-me-screen');
    const spotifyPlaylistScreen = document.getElementById('spotify-playlist-screen');
    const spotifyTabs = Array.from(document.querySelectorAll('.spotify-tab'));

    const spotifyFullBg = document.getElementById('spotify-full-bg');

    const spotifyProfileAvatar = document.getElementById('spotify-profile-avatar');
    const spotifyProfileAvatarFallback = document.getElementById('spotify-profile-avatar-fallback');
    const spotifyProfileName = document.getElementById('spotify-profile-name');
    const spotifyLikedMeta = document.getElementById('spotify-liked-meta');
    const spotifyPlaylistDetailMeta = document.getElementById('spotify-playlist-detail-meta');
    const spotifyLikedPlaylistBtn = document.getElementById('spotify-liked-playlist-btn');
    const spotifyPlaylistBackBtn = document.getElementById('spotify-playlist-back-btn');

    const spotifyEditBtn = document.getElementById('spotify-edit-btn');
    const spotifyEditSheet = document.getElementById('spotify-edit-sheet');
    const spotifyEditSaveBtn = document.getElementById('spotify-edit-save-btn');

    const spotifyEditAvatarTrigger = document.getElementById('spotify-edit-avatar-trigger');
    const spotifyAvatarUpload = document.getElementById('spotify-avatar-upload');
    const spotifyEditAvatarImg = document.getElementById('spotify-edit-avatar-img');
    const spotifyEditAvatarIcon = document.getElementById('spotify-edit-avatar-icon');

    const spotifyEditNameInput = document.getElementById('spotify-edit-name-input');

    const spotifyFullBgUploadTrigger = document.getElementById('spotify-full-bg-upload-trigger');
    const spotifyFullBgResetTrigger = document.getElementById('spotify-full-bg-reset-trigger');

    const spotifyFullBgUpload = document.getElementById('spotify-full-bg-upload');

    if (
        !spotifyView ||
        !spotifyShell ||
        !spotifyHomeScreen ||
        !spotifyMeScreen ||
        !spotifyPlaylistScreen ||
        spotifyTabs.length === 0
    ) {
        return;
    }

    const spotifyState = {
        customName: '',
        customAvatar: '',
        fullBackground: '',
        tempName: '',
        tempAvatar: '',
        tempFullBackground: ''
    };

    function getCurrentAccount() {
        const accounts = typeof window.getAccounts === 'function' ? window.getAccounts() : [];
        const currentAccountId = typeof window.getCurrentAccountId === 'function' ? window.getCurrentAccountId() : null;
        if (!Array.isArray(accounts) || currentAccountId == null) return null;
        return accounts.find(acc => String(acc.id) === String(currentAccountId)) || null;
    }

    function getBaseProfile() {
        const currentAccount = getCurrentAccount();
        const globalUser = window.userState || {};

        const name =
            spotifyState.customName ||
            (currentAccount && currentAccount.name) ||
            globalUser.name ||
            'User';

        const avatar =
            spotifyState.customAvatar ||
            (currentAccount && currentAccount.avatarUrl) ||
            globalUser.avatarUrl ||
            '';

        return { name, avatar };
    }

    function applySpotifySnapshot(raw = {}) {
        spotifyState.customName = typeof raw.customName === 'string' ? raw.customName : '';
        spotifyState.customAvatar = typeof raw.customAvatar === 'string' ? raw.customAvatar : '';
        spotifyState.fullBackground = typeof raw.fullBackground === 'string' ? raw.fullBackground : '';
    }

    function loadSpotifyState() {
        const raw = typeof window.getAppState === 'function'
            ? window.getAppState('spotify')
            : {};
        applySpotifySnapshot(raw);
    }

    function saveSpotifyState() {
        const nextState = {
            customName: spotifyState.customName,
            customAvatar: spotifyState.customAvatar,
            fullBackground: spotifyState.fullBackground
        };

        if (typeof window.setAppState === 'function') {
            window.setAppState('spotify', nextState);
        } else if (window.saveGlobalData) {
            window.saveGlobalData();
        }
    }

    function applyAvatarToNode(imgNode, fallbackNode, avatarUrl) {
        if (!imgNode || !fallbackNode) return;

        if (avatarUrl) {
            imgNode.src = avatarUrl;
            imgNode.style.display = 'block';
            fallbackNode.style.display = 'none';
        } else {
            imgNode.removeAttribute('src');
            imgNode.style.display = 'none';
            fallbackNode.style.display = 'flex';
        }
    }

    function applyBackground(element, url, fallback) {
        if (!element) return;
        element.style.backgroundImage = url ? `url(${url}), ${fallback}` : fallback;
    }

    function renderSpotifyProfile() {
        const profile = getBaseProfile();

        if (spotifyProfileName) {
            spotifyProfileName.textContent = profile.name;
        }

        if (spotifyLikedMeta) {
            spotifyLikedMeta.textContent = `0 首歌曲 · ${profile.name}`;
        }

        if (spotifyPlaylistDetailMeta) {
            spotifyPlaylistDetailMeta.textContent = `0 首歌曲 · ${profile.name}`;
        }

        applyAvatarToNode(spotifyProfileAvatar, spotifyProfileAvatarFallback, profile.avatar);

        applyBackground(
            spotifyFullBg,
            spotifyState.fullBackground,
            'linear-gradient(180deg, rgba(116, 112, 121, 0.92) 0%, rgba(37, 37, 40, 0.98) 28%, #121212 52%, #121212 100%)'
        );
    }

    function syncEditSheet() {
        const profile = getBaseProfile();

        spotifyState.tempName = spotifyState.customName || profile.name;
        spotifyState.tempAvatar = spotifyState.customAvatar || profile.avatar || '';
        spotifyState.tempFullBackground = spotifyState.fullBackground || '';

        if (spotifyEditNameInput) {
            spotifyEditNameInput.value = spotifyState.tempName;
        }

        if (spotifyEditAvatarImg && spotifyEditAvatarIcon) {
            if (spotifyState.tempAvatar) {
                spotifyEditAvatarImg.src = spotifyState.tempAvatar;
                spotifyEditAvatarImg.style.display = 'block';
                spotifyEditAvatarIcon.style.display = 'none';
            } else {
                spotifyEditAvatarImg.removeAttribute('src');
                spotifyEditAvatarImg.style.display = 'none';
                spotifyEditAvatarIcon.style.display = 'flex';
            }
        }
    }

    function setActiveScreen(target) {
        const nextTarget = target === 'home' || target === 'playlist' ? target : 'me';

        spotifyTabs.forEach(tab => {
            tab.classList.toggle('active', nextTarget !== 'playlist' && tab.dataset.target === nextTarget);
        });

        spotifyHomeScreen.classList.toggle('active', nextTarget === 'home');
        spotifyMeScreen.classList.toggle('active', nextTarget === 'me');
        spotifyPlaylistScreen.classList.toggle('active', nextTarget === 'playlist');

    }

    function openSpotifyView() {
        if (window.isJiggleMode || window.preventAppClick) return;
        if (window.syncUIs) window.syncUIs();

        renderSpotifyProfile();
        setActiveScreen('me');

        spotifyView.classList.remove('closing');
        spotifyView.classList.remove('active');

        requestAnimationFrame(() => {
            spotifyView.classList.add('active');
        });
    }

    function closeSpotifyView() {
        if (!spotifyView.classList.contains('active') || spotifyView.classList.contains('closing')) return;

        spotifyView.classList.add('closing');
        window.setTimeout(() => {
            spotifyView.classList.remove('active');
            spotifyView.classList.remove('closing');
            setActiveScreen('me');
        }, 220);
    }

    function openEditSheet() {
        syncEditSheet();
        if (window.openView) {
            window.openView(spotifyEditSheet);
        } else if (spotifyEditSheet) {
            spotifyEditSheet.classList.add('active');
        }
    }

    function closeEditSheet() {
        renderSpotifyProfile();

        if (window.closeView) {
            window.closeView(spotifyEditSheet);
        } else if (spotifyEditSheet) {
            spotifyEditSheet.classList.remove('active');
        }
    }

    function readImage(file, onLoad) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
            if (typeof onLoad === 'function') {
                onLoad(event.target.result);
            }
        };
        reader.readAsDataURL(file);
    }

    spotifyTabs.forEach(tab => {
        tab.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            setActiveScreen(tab.dataset.target);
        });
    });

    if (spotifyBackBtn) {
        spotifyBackBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            closeSpotifyView();
        });
    }

    if (spotifyHomeBackBtn) {
        spotifyHomeBackBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            closeSpotifyView();
        });
    }

    if (spotifyMeBackBtn) {
        spotifyMeBackBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            closeSpotifyView();
        });
    }

    if (spotifyPlaylistBackBtn) {
        spotifyPlaylistBackBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            setActiveScreen('me');
        });
    }

    if (spotifyMeMoreBtn) {
        spotifyMeMoreBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    if (spotifyPlaylistMoreBtn) {
        spotifyPlaylistMoreBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    if (spotifyEditBtn) {
        spotifyEditBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            openEditSheet();
        });
    }

    if (spotifyEditAvatarTrigger && spotifyAvatarUpload) {
        spotifyEditAvatarTrigger.addEventListener('click', () => {
            spotifyAvatarUpload.click();
        });
    }

    if (spotifyAvatarUpload) {
        spotifyAvatarUpload.addEventListener('change', event => {
            const file = event.target.files && event.target.files[0];
            readImage(file, result => {
                spotifyState.tempAvatar = result;
                if (spotifyEditAvatarImg && spotifyEditAvatarIcon) {
                    spotifyEditAvatarImg.src = result;
                    spotifyEditAvatarImg.style.display = 'block';
                    spotifyEditAvatarIcon.style.display = 'none';
                }
            });
            event.target.value = '';
        });
    }

    if (spotifyFullBgUploadTrigger && spotifyFullBgUpload) {
        spotifyFullBgUploadTrigger.addEventListener('click', () => {
            spotifyFullBgUpload.click();
        });
    }

    if (spotifyFullBgUpload) {
        spotifyFullBgUpload.addEventListener('change', event => {
            const file = event.target.files && event.target.files[0];
            readImage(file, result => {
                spotifyState.tempFullBackground = result;
                applyBackground(
                    spotifyFullBg,
                    spotifyState.tempFullBackground,
                    'linear-gradient(180deg, rgba(116, 112, 121, 0.92) 0%, rgba(37, 37, 40, 0.98) 28%, #121212 52%, #121212 100%)'
                );
            });
            event.target.value = '';
        });
    }

    if (spotifyFullBgResetTrigger) {
        spotifyFullBgResetTrigger.addEventListener('click', () => {
            spotifyState.tempFullBackground = '';
            applyBackground(
                spotifyFullBg,
                spotifyState.tempFullBackground,
                'linear-gradient(180deg, rgba(116, 112, 121, 0.92) 0%, rgba(37, 37, 40, 0.98) 28%, #121212 52%, #121212 100%)'
            );
        });
    }

    if (spotifyLikedPlaylistBtn) {
        spotifyLikedPlaylistBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            renderSpotifyProfile();
            setActiveScreen('playlist');
        });

        spotifyLikedPlaylistBtn.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                renderSpotifyProfile();
                setActiveScreen('playlist');
            }
        });
    }

    if (spotifyEditSaveBtn) {
        spotifyEditSaveBtn.addEventListener('click', () => {
            spotifyState.customName = spotifyEditNameInput ? spotifyEditNameInput.value.trim() : '';
            spotifyState.customAvatar = spotifyState.tempAvatar || '';
            spotifyState.fullBackground = spotifyState.tempFullBackground || '';

            saveSpotifyState();
            renderSpotifyProfile();
            closeEditSheet();
        });
    }

    document.addEventListener('click', event => {
        const appItem = event.target.closest('.app-item');
        if (appItem && appItem.querySelector('#app-icon-8')) {
            event.preventDefault();
            event.stopPropagation();
            openSpotifyView();
        }
    });

    loadSpotifyState();
    renderSpotifyProfile();
    setActiveScreen('me');
});
