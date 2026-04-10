// ==========================================
// 5. NAVIGATION EVENT LISTENERS
// ==========================================
// Main Settings
const settingsBtn = document.getElementById('dock-icon-settings');
if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
        if (window.isJiggleMode || window.preventAppClick) { e.preventDefault(); e.stopPropagation(); return; }
        syncUIs();
        openView(UI.views.settings);
    });
}
document.getElementById('settings-title-back-btn').addEventListener('click', () => closeView(UI.views.settings));

const aboutDeviceBtn = document.getElementById('about-device-btn');
const aboutDeviceSheet = UI?.overlays?.aboutDevice || document.getElementById('about-device-sheet');
const aboutDeviceCloseBtn = document.getElementById('about-device-close-btn');
const aboutDeviceDisclaimerBtn = document.getElementById('about-device-disclaimer-btn');
const dataManagementBtn = document.getElementById('data-management-btn');
const dataManagementSheet = document.getElementById('data-management-sheet');
const dataManagementCloseBtn = document.getElementById('data-management-close-btn');
const authManagementBtn = document.getElementById('auth-management-btn');
const dataUsageBadge = document.getElementById('data-usage-badge');
const authAccountModal = document.getElementById('auth-account-modal');
const authAccountCloseBtn = document.getElementById('auth-account-close-btn');
const authAccountCurrentUser = document.getElementById('auth-account-current-user');
const authAccountLogoutBtn = document.getElementById('auth-account-logout-btn');
const authLogoutConfirmModal = document.getElementById('auth-logout-confirm-modal');
const authLogoutCancelBtn = document.getElementById('auth-logout-cancel-btn');
const authLogoutConfirmBtn = document.getElementById('auth-logout-confirm-btn');

function openAuthLogoutConfirmModal() {
    if (authLogoutConfirmModal) {
        authLogoutConfirmModal.style.display = 'flex';
    }
}

function closeAuthLogoutConfirmModal() {
    if (authLogoutConfirmModal) {
        authLogoutConfirmModal.style.display = 'none';
    }
}

function performAuthLogout() {
    window.authManager?.logout?.();
    closeAuthLogoutConfirmModal();
    closeAuthAccountModal();
    document.getElementById('auth-overlay')?.classList.remove('is-hidden');
    if (typeof showToast === 'function') {
        showToast('已退出当前账号');
    }
}

function syncAboutDeviceInfo() {
    const appNameEl = document.getElementById('about-device-app-name');
    const versionEl = document.getElementById('about-device-version');

    if (appNameEl) appNameEl.textContent = window.APP_NAME || 'iison';
    if (versionEl) versionEl.textContent = '1.0.0';
}

async function refreshDataUsageBadge() {
    if (!dataUsageBadge) return;

    dataUsageBadge.textContent = '计算中...';

    try {
        if (!window.appStorage?.getUsageSummary) {
            dataUsageBadge.textContent = '-- / --';
            return;
        }

        const summary = await window.appStorage.getUsageSummary();
        dataUsageBadge.textContent = summary?.label || '-- / --';
    } catch (err) {
        console.error('Failed to refresh data usage badge', err);
        dataUsageBadge.textContent = '-- / --';
    }
}

if (aboutDeviceBtn && aboutDeviceSheet) {
    aboutDeviceBtn.addEventListener('click', () => {
        syncAboutDeviceInfo();
        openView(aboutDeviceSheet);
    });
}

if (aboutDeviceCloseBtn && aboutDeviceSheet) {
    aboutDeviceCloseBtn.addEventListener('click', () => closeView(aboutDeviceSheet));
}

if (aboutDeviceDisclaimerBtn) {
    aboutDeviceDisclaimerBtn.addEventListener('click', () => {
        showToast('免责声明内容暂未配置');
    });
}

if (dataManagementBtn && dataManagementSheet) {
    dataManagementBtn.addEventListener('click', async () => {
        await refreshDataUsageBadge();
        openView(dataManagementSheet);
    });
}

if (dataManagementCloseBtn && dataManagementSheet) {
    dataManagementCloseBtn.addEventListener('click', () => closeView(dataManagementSheet));
}

function syncAuthAccountModal() {
    const currentUser = window.authManager?.getCurrentUser?.();
    if (authAccountCurrentUser) {
        authAccountCurrentUser.textContent = currentUser?.displayName || currentUser?.username || '未登录';
    }
    if (authAccountLogoutBtn) {
        authAccountLogoutBtn.disabled = !currentUser;
    }
}

function openAuthAccountModal() {
    syncAuthAccountModal();
    authAccountModal?.classList.add('is-visible');
}

function closeAuthAccountModal() {
    authAccountModal?.classList.remove('is-visible');
}

if (authManagementBtn) {
    authManagementBtn.addEventListener('click', () => {
        openAuthAccountModal();
    });
}

if (authAccountCloseBtn) {
    authAccountCloseBtn.addEventListener('click', () => {
        closeAuthAccountModal();
    });
}

if (authAccountModal) {
    authAccountModal.addEventListener('click', (event) => {
        if (event.target === authAccountModal) {
            closeAuthAccountModal();
        }
    });
}

if (authAccountLogoutBtn) {
    authAccountLogoutBtn.addEventListener('click', () => {
        openAuthLogoutConfirmModal();
    });
}

if (authLogoutCancelBtn) {
    authLogoutCancelBtn.addEventListener('click', () => {
        closeAuthLogoutConfirmModal();
    });
}

if (authLogoutConfirmBtn) {
    authLogoutConfirmBtn.addEventListener('click', () => {
        performAuthLogout();
    });
}

if (authLogoutConfirmModal) {
    authLogoutConfirmModal.addEventListener('click', (event) => {
        if (event.target === authLogoutConfirmModal) {
            closeAuthLogoutConfirmModal();
        }
    });
}

// Apple ID Profile
document.getElementById('apple-id-trigger').addEventListener('click', (e) => {
    e.stopPropagation(); 
    syncUIs();
    openView(UI.views.edit);
});
document.getElementById('edit-back-btn').addEventListener('click', () => closeView(UI.views.edit));

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

window.readImageAsCompressedDataUrl = readImageAsCompressedDataUrl;

// Main Edit Avatar Logic
const mainEditAvatarWrapper = document.getElementById('main-edit-avatar-wrapper');
const mainAvatarUpload = document.getElementById('main-avatar-upload');
if (mainEditAvatarWrapper && mainAvatarUpload) {
    mainEditAvatarWrapper.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') mainAvatarUpload.click();
    });

    mainAvatarUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const url = await readImageAsCompressedDataUrl(file, {
                    maxWidth: 768,
                    maxHeight: 768,
                    quality: 0.82
                });

                // Update user state
                userState.avatarUrl = url;
                
                // Update current account in accounts array
                const acc = accounts.find(a => a.id === currentAccountId);
                if (acc) {
                    acc.avatarUrl = url;
                }
                
                saveGlobalData();
                // Sync the UI immediately
                syncUIs();
                showToast('头像已更新');
            } catch (err) {
                console.error('Failed to process avatar upload', err);
                showToast('头像处理失败');
            }
        }
        e.target.value = ''; // Reset
    });
}

// ==========================================
// 6. ACCOUNT MANAGEMENT
// ==========================================
// Open Switcher
document.getElementById('switch-account-btn').addEventListener('click', () => {
    renderAccountList();
    openView(UI.overlays.accountSwitcher);
});

// Add New Account
document.getElementById('add-account-btn').addEventListener('click', () => {
    isCreatingNewAccount = true;
    detailTempId = Date.now();
    UI.inputs.detailName.value = '';
    UI.inputs.detailPhone.value = '';
    if(UI.inputs.detailSignature) UI.inputs.detailSignature.value = '';
    UI.inputs.detailPersona.value = '';
    setDetailAvatar(null);
    openView(UI.overlays.personaDetail);
});

// Save Selected Account to Main State
document.getElementById('save-id-btn').addEventListener('click', () => {
    const accToSync = accounts.find(a => a.id === currentAccountId);
    if (accToSync) {
        userState.name = accToSync.name;
        userState.phone = accToSync.phone;
        userState.persona = accToSync.signature || accToSync.persona; // Use signature for display
        userState.avatarUrl = accToSync.avatarUrl;
    } else {
        userState.name = '';
        userState.phone = '';
        userState.persona = '';
        userState.avatarUrl = null;
    }
    saveGlobalData();
    syncUIs();
    closeView(UI.overlays.accountSwitcher);
});

// Detail View Confirm
document.getElementById('confirm-sync-btn').addEventListener('click', () => {
    const name = UI.inputs.detailName.value || 'New User';
    const phone = UI.inputs.detailPhone.value;
    const signature = UI.inputs.detailSignature ? UI.inputs.detailSignature.value : '';
    const persona = UI.inputs.detailPersona.value;
    const currentAvatarSrc = UI.inputs.detailAvatarImg.style.display === 'block' ? UI.inputs.detailAvatarImg.src : null;

    if (isCreatingNewAccount) {
        accounts.push({ id: detailTempId, name, phone, signature, persona, avatarUrl: currentAvatarSrc });
        currentAccountId = detailTempId; 
    } else {
        const acc = accounts.find(a => a.id === detailTempId);
        if (acc) {
            acc.name = name;
            acc.phone = phone;
            acc.signature = signature;
            acc.persona = persona;
            acc.avatarUrl = currentAvatarSrc;
        }
    }
    isCreatingNewAccount = false;
    saveGlobalData();
    renderAccountList(); 
    closeView(UI.overlays.personaDetail); 
});

// Avatar Upload Handler
const userDetailAvatarWrapper = document.getElementById('user-detail-avatar-wrapper');
if (userDetailAvatarWrapper) {
    userDetailAvatarWrapper.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') document.getElementById('detail-avatar-upload').click();
    });
}

document.getElementById('detail-avatar-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const url = await readImageAsCompressedDataUrl(file, {
                maxWidth: 768,
                maxHeight: 768,
                quality: 0.82
            });
            setDetailAvatar(url);
        } catch (err) {
            console.error('Failed to process detail avatar upload', err);
            showToast('头像处理失败');
        }
    }
});

function setDetailAvatar(url) {
    if (url) {
        UI.inputs.detailAvatarImg.src = url;
        UI.inputs.detailAvatarImg.style.display = 'block';
        UI.inputs.detailAvatarIcon.style.display = 'none';
    } else {
        UI.inputs.detailAvatarImg.style.display = 'none';
        UI.inputs.detailAvatarIcon.style.display = 'block';
        UI.inputs.detailAvatarImg.src = '';
    }
}

const bindRoleBtn = document.getElementById('bind-role-btn');
const bindRoleBtnCount = document.getElementById('bind-role-btn-count');
const bindRoleSheet = document.getElementById('bind-role-sheet');
const bindRoleList = document.getElementById('bind-role-list');
const bindRoleEmpty = document.getElementById('bind-role-empty');
const bindRoleSheetAccountName = document.getElementById('bind-role-sheet-account-name');
const bindRoleSheetAccountDesc = document.getElementById('bind-role-sheet-account-desc');
const confirmBindRoleBtn = document.getElementById('confirm-bind-role-btn');

let tempBoundRoleIds = [];

function getCurrentAppleAccount() {
    return accounts.find(acc => String(acc.id) === String(currentAccountId)) || null;
}

function getBindableRoles() {
    return (window.imData?.friends || []).filter(friend => friend && friend.type !== 'group');
}

function getRolesBoundToCurrentAccount() {
    return getBindableRoles().filter(friend => String(friend.boundAccountId || '') === String(currentAccountId || ''));
}

function updateBindRoleEntryPoints() {
    if (!bindRoleBtnCount) return;
    const count = currentAccountId ? getRolesBoundToCurrentAccount().length : 0;
    bindRoleBtnCount.textContent = count > 0 ? `${count}个角色` : '';
}

function renderBindRoleList() {
    if (!bindRoleList || !bindRoleEmpty) return;

    const roles = getBindableRoles();
    const currentAcc = getCurrentAppleAccount();
    const boundRoles = getRolesBoundToCurrentAccount();
    tempBoundRoleIds = boundRoles.map(friend => String(friend.id));

    if (bindRoleSheetAccountName) {
        bindRoleSheetAccountName.textContent = currentAcc ? (currentAcc.name || '当前 ID') : '未选择 Apple ID';
    }
    if (bindRoleSheetAccountDesc) {
        bindRoleSheetAccountDesc.textContent = currentAcc
            ? `已绑定 ${boundRoles.length} 个角色`
            : '请先创建并选中一个 Apple ID';
    }

    bindRoleList.innerHTML = '';

    if (!currentAcc || roles.length === 0) {
        bindRoleList.style.display = 'none';
        bindRoleEmpty.style.display = 'block';
        bindRoleEmpty.textContent = currentAcc ? '暂无可绑定角色' : '请先在 Apple ID 中选择一个账号';
        return;
    }

    bindRoleList.style.display = 'flex';
    bindRoleEmpty.style.display = 'none';

    roles.forEach(friend => {
        const isSelected = tempBoundRoleIds.includes(String(friend.id));
        const alreadyBoundAccount = window.imApp?.getBoundAccountByFriend
            ? window.imApp.getBoundAccountByFriend(friend)
            : null;

        const item = document.createElement('div');
        item.className = 'account-card';
        item.style.padding = '14px 16px';
        item.style.height = 'auto';
        item.style.cursor = 'pointer';
        item.style.borderRadius = '16px';
        item.style.border = isSelected ? '2px solid #007aff' : '2px solid transparent';
        item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';

        item.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#f2f2f7; overflow:hidden; display:flex; align-items:center; justify-content:center; color:#8e8e93; flex-shrink:0;">
                        ${friend.avatarUrl ? `<img src="${friend.avatarUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-user"></i>'}
                    </div>
                    <div style="min-width:0;">
                        <div style="font-size:15px; font-weight:600; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${friend.nickname || '未命名角色'}</div>
                        <div style="font-size:12px; color:#8e8e93; margin-top:3px;">${friend.realName || friend.signature || '角色'}</div>
                        <div style="font-size:12px; color:#666; margin-top:4px; line-height:1.45;">当前绑定：${alreadyBoundAccount ? (alreadyBoundAccount.name || '某个ID') : '未绑定'}</div>
                    </div>
                </div>
                <div style="width:22px; height:22px; border-radius:50%; border:1px solid ${isSelected ? '#007aff' : '#c7c7cc'}; background:${isSelected ? '#007aff' : 'transparent'}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; flex-shrink:0;">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;

        item.addEventListener('click', () => {
            const friendId = String(friend.id);
            if (tempBoundRoleIds.includes(friendId)) {
                tempBoundRoleIds = tempBoundRoleIds.filter(id => id !== friendId);
            } else {
                tempBoundRoleIds.push(friendId);
            }
            renderBindRoleListFromDraft();
        });

        bindRoleList.appendChild(item);
    });
}

function renderBindRoleListFromDraft() {
    if (!bindRoleList) return;
    const currentAcc = getCurrentAppleAccount();
    const roles = getBindableRoles();

    bindRoleList.innerHTML = '';
    roles.forEach(friend => {
        const isSelected = tempBoundRoleIds.includes(String(friend.id));
        const alreadyBoundAccount = window.imApp?.getBoundAccountByFriend
            ? window.imApp.getBoundAccountByFriend(friend)
            : null;

        const item = document.createElement('div');
        item.className = 'account-card';
        item.style.padding = '14px 16px';
        item.style.height = 'auto';
        item.style.cursor = 'pointer';
        item.style.borderRadius = '16px';
        item.style.border = isSelected ? '2px solid #007aff' : '2px solid transparent';
        item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';

        item.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#f2f2f7; overflow:hidden; display:flex; align-items:center; justify-content:center; color:#8e8e93; flex-shrink:0;">
                        ${friend.avatarUrl ? `<img src="${friend.avatarUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-user"></i>'}
                    </div>
                    <div style="min-width:0;">
                        <div style="font-size:15px; font-weight:600; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${friend.nickname || '未命名角色'}</div>
                        <div style="font-size:12px; color:#8e8e93; margin-top:3px;">${friend.realName || friend.signature || '角色'}</div>
                        <div style="font-size:12px; color:#666; margin-top:4px; line-height:1.45;">目标绑定：${isSelected ? (currentAcc?.name || '当前ID') : (alreadyBoundAccount ? alreadyBoundAccount.name : '未绑定')}</div>
                    </div>
                </div>
                <div style="width:22px; height:22px; border-radius:50%; border:1px solid ${isSelected ? '#007aff' : '#c7c7cc'}; background:${isSelected ? '#007aff' : 'transparent'}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; flex-shrink:0;">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;

        item.addEventListener('click', () => {
            const friendId = String(friend.id);
            if (tempBoundRoleIds.includes(friendId)) {
                tempBoundRoleIds = tempBoundRoleIds.filter(id => id !== friendId);
            } else {
                tempBoundRoleIds.push(friendId);
            }
            renderBindRoleListFromDraft();
        });

        bindRoleList.appendChild(item);
    });

    if (bindRoleSheetAccountDesc && currentAcc) {
        bindRoleSheetAccountDesc.textContent = `已选择 ${tempBoundRoleIds.length} 个角色`;
    }
}

function renderAccountList() {
    if(!UI.lists.accounts) return;
    UI.lists.accounts.innerHTML = '';

    accounts.forEach(acc => {
        const card = document.createElement('div');
        card.className = `account-card ${acc.id === currentAccountId ? 'selected' : ''}`;
        
        const avatarHtml = acc.avatarUrl ? `<img src="${acc.avatarUrl}" alt="">` : `<i class="fas fa-user"></i>`;
        card.innerHTML = `
            <div class="account-content">
                <div class="account-avatar">${avatarHtml}</div>
                <div class="account-info">
                    <div class="account-name">${acc.name}</div>
                    <div class="account-detail">${acc.phone || 'No Phone'}</div>
                </div>
                <i class="fas fa-times delete-icon"></i>
            </div>
        `;

        // Click to Open Detail View & Set Active
        card.querySelector('.account-content').addEventListener('click', (e) => {
            // If clicked on delete icon, do not open detail view
            if (e.target.classList.contains('delete-icon') || e.target.closest('.delete-icon')) return;

            currentAccountId = acc.id;
            if (window.setCurrentAccountId) window.setCurrentAccountId(acc.id);
            renderAccountList(); // Refresh highlighting
            
            isCreatingNewAccount = false;
            detailTempId = acc.id;
            UI.inputs.detailName.value = acc.name || '';
            UI.inputs.detailPhone.value = acc.phone || '';
            if(UI.inputs.detailSignature) UI.inputs.detailSignature.value = acc.signature || acc.persona || '';
            UI.inputs.detailPersona.value = acc.persona || '';
            setDetailAvatar(acc.avatarUrl);
            
            openView(UI.overlays.personaDetail);
        });

        // Delete Action
        card.querySelector('.delete-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete account "${acc.name}"?`)) {
                accounts = accounts.filter(a => a.id !== acc.id);
                if (currentAccountId === acc.id) {
                    currentAccountId = accounts.length > 0 ? accounts[0].id : null;
                    if (window.setCurrentAccountId) window.setCurrentAccountId(currentAccountId);
                    const nextAccount = accounts.find(a => a.id === currentAccountId);
                    userState.name = nextAccount?.name || '';
                    userState.phone = nextAccount?.phone || '';
                    userState.persona = nextAccount?.signature || nextAccount?.persona || '';
                    userState.avatarUrl = nextAccount?.avatarUrl || null;
                }
                saveGlobalData();
                syncUIs();
                renderAccountList();
            }
        });

        UI.lists.accounts.appendChild(card);
    });
    updateBindRoleEntryPoints();
}

if (bindRoleSheet) {
    bindRoleSheet.addEventListener('click', (e) => {
        if (e.target === bindRoleSheet) closeView(bindRoleSheet);
    });
}

if (bindRoleBtn) {
    bindRoleBtn.addEventListener('click', () => {
        if (!currentAccountId) {
            showToast('请先选择一个 Apple ID');
            return;
        }
        renderBindRoleList();
        openView(bindRoleSheet);
    });
}

if (confirmBindRoleBtn) {
    confirmBindRoleBtn.addEventListener('click', async () => {
        const roles = getBindableRoles();
        const selectedIds = new Set(tempBoundRoleIds.map(String));

        if (!window.imApp?.commitFriendsChange) {
            showToast('保存入口不可用');
            return;
        }

        const changedFriendIds = roles
            .filter(friend => {
                const currentBoundAccountId = String(friend.boundAccountId || '');
                const nextBoundAccountId = selectedIds.has(String(friend.id))
                    ? String(currentAccountId || '')
                    : '';
                return currentBoundAccountId !== nextBoundAccountId;
            })
            .map(friend => String(friend.id));

        if (changedFriendIds.length === 0) {
            closeView(bindRoleSheet);
            showToast('角色绑定无变化');
            return;
        }

        const saved = await window.imApp.commitFriendsChange(() => {
            roles.forEach(friend => {
                const targetFriend = window.imData?.friends?.find(item => String(item.id) === String(friend.id));
                if (!targetFriend) return;

                if (selectedIds.has(String(targetFriend.id))) {
                    targetFriend.boundAccountId = currentAccountId || null;
                } else if (String(targetFriend.boundAccountId || '') === String(currentAccountId || '')) {
                    targetFriend.boundAccountId = null;
                }
            });
        }, {
            silent: true,
            friendIds: changedFriendIds
        });

        if (!saved) {
            showToast('角色绑定保存失败');
            return;
        }

        if (window.imApp?.updateChatBindIdLabel && window.imData?.currentSettingsFriend) {
            const latestCurrentFriend = window.imData.friends.find(
                item => String(item.id) === String(window.imData.currentSettingsFriend.id)
            );
            if (latestCurrentFriend) {
                window.imData.currentSettingsFriend = latestCurrentFriend;
                window.imApp.updateChatBindIdLabel(latestCurrentFriend);
            }
        }
        updateBindRoleEntryPoints();
        showToast('角色绑定已更新');
        closeView(bindRoleSheet);
    });
}

window.updateBindRoleEntryPoints = updateBindRoleEntryPoints;
window.renderBindRoleList = renderBindRoleList;

// ==========================================
// 8.5 DATA MANAGEMENT (Export / Import / Clear)
// ==========================================
document.getElementById('export-data-btn')?.addEventListener('click', async () => {
    try {
        await saveGlobalData();
        if (window.imApp?.flushGlobalSave) {
            await window.imApp.flushGlobalSave({ silent: true });
        }

        const exportPayload = window.appStorage?.exportAllData
            ? await window.appStorage.exportAllData()
            : null;

        if (!exportPayload || typeof exportPayload !== 'object') {
            showToast('暂无数据可导出');
            return;
        }

        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emulator_data_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        await refreshDataUsageBadge();
        showToast('导出成功');
    } catch (err) {
        console.error('Failed to export emulator data', err);
        showToast('导出失败');
    }
});

const importDataBtn = document.getElementById('import-data-btn');
const importDataFile = document.getElementById('import-data-file');

if (importDataBtn && importDataFile) {
    importDataBtn.addEventListener('click', () => {
        importDataFile.click();
    });

    importDataFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!parsed || typeof parsed !== 'object') {
                    showToast('无效的数据格式');
                    return;
                }

                if (!window.appStorage?.importAllData) {
                    showToast('统一存储入口不可用');
                    return;
                }

                await window.appStorage.clearAllData();
                await window.appStorage.importAllData(parsed);

                await refreshDataUsageBadge();
                showToast('导入成功，即将刷新...');
                setTimeout(() => location.reload(), 1500);
            } catch (err) {
                console.error('Failed to import emulator data', err);
                showToast('文件解析失败');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
}

async function refreshHydratedImessageAssetsAfterCacheClear() {
    if (!window.imStorage?.loadFriends || !Array.isArray(window.imData?.friends)) return false;

    try {
        const hydratedFriends = await window.imStorage.loadFriends();
        const hydratedById = new Map(
            (Array.isArray(hydratedFriends) ? hydratedFriends : []).map(friend => [String(friend.id), friend])
        );

        (window.imData.friends || []).forEach(friend => {
            const hydrated = hydratedById.get(String(friend.id));
            if (!hydrated) return;

            if (Object.prototype.hasOwnProperty.call(hydrated, 'avatarUrl')) {
                friend.avatarUrl = hydrated.avatarUrl || null;
            }
            if (Object.prototype.hasOwnProperty.call(hydrated, 'chatBg')) {
                friend.chatBg = hydrated.chatBg || null;
            }
            if (Object.prototype.hasOwnProperty.call(hydrated, 'momentsCover')) {
                friend.momentsCover = hydrated.momentsCover || null;
            }
        });

        if (window.imData.currentSettingsFriend) {
            const latestSettingsFriend = window.imData.friends.find(
                item => String(item.id) === String(window.imData.currentSettingsFriend.id)
            );
            if (latestSettingsFriend) {
                window.imData.currentSettingsFriend = latestSettingsFriend;
            }
        }

        if (window.imData.currentActiveFriend) {
            const latestActiveFriend = window.imData.friends.find(
                item => String(item.id) === String(window.imData.currentActiveFriend.id)
            );
            if (latestActiveFriend) {
                window.imData.currentActiveFriend = latestActiveFriend;
                if (window.imApp?.applyFriendBg) {
                    window.imApp.applyFriendBg(latestActiveFriend);
                }
            }
        }

        return true;
    } catch (err) {
        console.error('Failed to refresh iMessage assets after clearing cache', err);
        return false;
    }
}

function didPrimaryAppStorageDeleteSucceed(clearResult) {
    const databaseResults = Array.isArray(clearResult?.databases) ? clearResult.databases : [];
    const primaryDbResult = databaseResults.find(item => item?.name === 'iiso_app_storage');
    return !!primaryDbResult?.deleted;
}

function resetVisibleUserGeneratedUiState() {
    try {
        const profileBannerImg = document.getElementById('x-profile-banner-img');
        if (profileBannerImg) {
            profileBannerImg.src = '';
            profileBannerImg.style.display = 'none';
        }

        const searchBanner = document.getElementById('x-search-banner');
        if (searchBanner) {
            const img = searchBanner.querySelector('img');
            const placeholder = searchBanner.querySelector('.x-banner-placeholder');
            if (img) {
                img.src = '';
                img.style.display = 'none';
            }
            if (placeholder) {
                placeholder.style.display = 'block';
            }
        }

        if (window.resetUnifiedAppState) {
            window.resetUnifiedAppState({ save: false });
        }

        if (window.syncUIs) {
            window.syncUIs();
        }
    } catch (err) {
        console.error('Failed to reset visible user-generated UI state before reload', err);
    }
}

document.getElementById('clear-global-cache-btn')?.addEventListener('click', async () => {
    if (!confirm('确定要清理全局缓存吗？这会释放临时图片与运行时缓存，不会删除聊天记录、联系人和已保存配置。')) {
        return;
    }

    try {
        const cleared = window.imApp?.clearRuntimeCache
            ? window.imApp.clearRuntimeCache()
            : false;

        if (!cleared) {
            showToast('清理缓存失败');
            return;
        }

        await refreshHydratedImessageAssetsAfterCacheClear();

        if (window.imApp?.renderFriendsList) window.imApp.renderFriendsList();
        if (window.imApp?.renderChatsList) window.imApp.renderChatsList();
        if (typeof syncUIs === 'function') syncUIs();

        await refreshDataUsageBadge();
        showToast('全局缓存已清理');
    } catch (err) {
        console.error('Failed to clear global runtime cache', err);
        showToast('清理缓存失败');
    }
});

document.getElementById('clear-data-btn')?.addEventListener('click', async () => {
    if (confirm('确定要清空所有用户生成的数据吗？此操作不可恢复，并会清除聊天记录、导入内容、上传图片、编辑资料与浏览器残留缓存。刷新后会恢复系统内置默认演示内容。')) {
        try {
            if (window.imApp?.flushGlobalSave) {
                await window.imApp.flushGlobalSave({ silent: true });
            }

            const clearResult = window.appStorage?.clearAllPersistentData
                ? await window.appStorage.clearAllPersistentData()
                : null;

            console.log('Persistent data clear result:', clearResult);

            if (!didPrimaryAppStorageDeleteSucceed(clearResult)) {
                showToast('用户数据清空失败，请关闭其他页面后重试');
                return;
            }

            resetVisibleUserGeneratedUiState();
            await refreshDataUsageBadge();
            showToast('用户数据已清空，即将恢复默认内容...');
            setTimeout(() => location.reload(), 1500);
        } catch (err) {
            console.error('Failed to clear unified app data', err);
            showToast('用户数据清空失败');
        }
    }
});

refreshDataUsageBadge();
