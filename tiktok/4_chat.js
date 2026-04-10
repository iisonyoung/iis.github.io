// ==========================================
// TIKTOK: 4. CHAT & FOLLOWING
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const followingBar = document.getElementById('tk-following-bar');
    const addCharBtn = document.getElementById('tk-chat-add-btn');
    const editCharSheet = document.getElementById('tk-edit-char-sheet');
    const dmsContainer = document.getElementById('tk-chat-dms-container');
    
    // Chat View Elements
    const chatView = document.getElementById('tk-dm-chat-view');
    const chatBackBtn = document.getElementById('tk-dm-back-btn');
    const chatTitle = document.getElementById('tk-dm-chat-title');
    const messagesContainer = document.getElementById('tk-dm-messages-container');
    const chatInput = document.getElementById('tk-dm-chat-input');
    const chatSendBtn = document.getElementById('tk-dm-chat-send');
    const chatMicBtn = document.getElementById('tk-dm-mic-btn');
    
    // Form Inputs
    const charAvatarImg = document.getElementById('tk-char-avatar-img');
    const tkSubProfileMsgBtn = document.getElementById('tk-sub-profile-msg-btn');
    const charAvatarIcon = document.querySelector('#tk-char-avatar-preview i');
    const charNameInput = document.getElementById('tk-char-name');
    const charStatusInput = document.getElementById('tk-char-status');
    const charPersonaInput = document.getElementById('tk-char-persona');
    const charBioInput = document.getElementById('tk-char-bio');
    const charFollowingInput = document.getElementById('tk-char-following');
    const charFollowersInput = document.getElementById('tk-char-followers');
    const charLikesInput = document.getElementById('tk-char-likes');
    const saveCharBtn = document.getElementById('tk-save-char-btn');
    const deleteCharBtn = document.getElementById('tk-delete-char-btn');
    
    let editingCharId = null;

    let currentChatCharId = null;

    window.tkRenderChat = function() {
        if (!followingBar) return;
        
        // 1. Render Following Bar
        followingBar.innerHTML = '';
        
        // Render Self First
        const selfAvatarHtml = tkState.profile.avatar 
            ? `<img src="${tkState.profile.avatar}">` 
            : `<i class="fas fa-user"></i>`;
            
        const selfItem = document.createElement('div');
        selfItem.className = 'tk-follow-item';
        selfItem.innerHTML = `
            <div class="tk-follow-avatar">
                ${selfAvatarHtml}
                <div class="tk-follow-plus"><i class="fas fa-plus"></i></div>
            </div>
            ${tkState.profile.status ? `<div class="tk-follow-bubble">${tkState.profile.status}</div>` : ''}
            <div class="tk-follow-name">我的状态</div>
        `;
        selfItem.addEventListener('click', () => {
            // Trigger profile tab or edit status
            if (window.tkRenderProfile) {
                // Switch to profile tab
                document.querySelector('.tk-bottom-nav .tk-nav-item[data-target="tk-profile-tab"]').click();
            }
        });
        followingBar.appendChild(selfItem);

        // Render followed chars
        const followedChars = tkState.chars.filter(c => c.isFollowed);
        followedChars.forEach(char => {
            const charAvatarHtml = char.avatar 
                ? `<img src="${char.avatar}">` 
                : `<i class="fas fa-user"></i>`;
                
            const charItem = document.createElement('div');
            charItem.className = 'tk-follow-item';
            charItem.innerHTML = `
                <div class="tk-follow-avatar">
                    ${charAvatarHtml}
                </div>
                ${char.status ? `<div class="tk-follow-bubble">${char.status}</div>` : ''}
                <div class="tk-follow-name">${char.name || char.handle}</div>
            `;
            
            charItem.addEventListener('click', () => {
                if(window.tkOpenSubProfile) {
                    window.tkOpenSubProfile(char.id);
                }
            });
            
            followingBar.appendChild(charItem);
        });

        // 2. Render DMs
        if (dmsContainer) {
            dmsContainer.innerHTML = '';
            tkState.dms.forEach(dm => {
                const char = window.tkGetChar(dm.charId);
                if (!char) return;
                
                const lastMsg = dm.messages.length > 0 ? dm.messages[dm.messages.length - 1].text : '开始聊天吧';
                
                const charAvatarHtml = char.avatar 
                    ? `<img src="${char.avatar}">` 
                    : `<i class="fas fa-user"></i>`;
                    
                const dmItem = document.createElement('div');
                dmItem.className = 'tk-activity-item';
                dmItem.innerHTML = `
                    <div class="tk-activity-icon" style="background: #f0f0f0; color: #999;">
                        ${charAvatarHtml}
                    </div>
                    <div class="tk-activity-text">
                        <div class="tk-activity-title">${char.name || char.handle}</div>
                        <div class="tk-activity-desc" style="display:flex; align-items:center; gap:6px;">
                            ${lastMsg}
                        </div>
                    </div>
                    <i class="fas fa-camera arrow" style="font-size: 20px;"></i>
                `;
                
                // Add click to open standard chat view (reusing the logic or opening a dedicated one)
                dmItem.addEventListener('click', () => {
                    // Open tk dm view
                    window.tkOpenChatView(char.id);
                });
                
                dmsContainer.appendChild(dmItem);
            });
            
            if (tkState.dms.length === 0) {
                dmsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 13px;">暂无消息记录</div>';
            }
        }
    };

    // Add / Edit Char logic
    const importSheet = document.getElementById('tk-import-char-sheet');
    const importList = document.getElementById('tk-import-list');
    const closeImportBtn = document.getElementById('tk-close-import-btn');

    if (addCharBtn) {
        addCharBtn.addEventListener('click', () => {
            window.tkOpenImportSheet();
        });
    }
    
    if (closeImportBtn) {
        closeImportBtn.addEventListener('click', () => {
            window.closeView(importSheet);
        });
    }

    window.tkOpenImportSheet = function() {
        if (!importList) return;
        importList.innerHTML = '';

        // Add "Create New" button
        const createNewBtn = document.createElement('div');
        createNewBtn.className = 'tk-import-item';
        createNewBtn.innerHTML = `
            <div class="tk-avatar-small" style="background: #333; color: white;"><i class="fas fa-plus"></i></div>
            <div style="flex: 1; font-weight: 600; color: #111;">创建新角色</div>
        `;
        createNewBtn.addEventListener('click', () => {
            window.closeView(importSheet);
            openEditChar();
        });
        importList.appendChild(createNewBtn);

        // Fetch iMessage friends
        const imFriends = window.getImFriends ? window.getImFriends() : [];
        if (imFriends.length > 0) {
            const separator = document.createElement('div');
            separator.style.fontSize = '13px';
            separator.style.color = '#888';
            separator.style.marginTop = '10px';
            separator.style.marginBottom = '5px';
            separator.textContent = '从信息应用导入:';
            importList.appendChild(separator);

            imFriends.forEach(friend => {
                // Check if already imported
                const alreadyExists = tkState.chars.some(c => c.id === friend.id);
                
                const item = document.createElement('div');
                item.className = 'tk-import-item';
                item.style.opacity = alreadyExists ? '0.5' : '1';
                
                const avatarHtml = friend.avatarUrl 
                    ? `<img src="${friend.avatarUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
                    : `<i class="fas fa-user"></i>`;
                    
                item.innerHTML = `
                    <div class="tk-avatar-small">${avatarHtml}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #111; font-size: 15px;">${friend.nickname || friend.realName}</div>
                        <div style="color: #888; font-size: 12px; margin-top: 2px;">${friend.signature || ''}</div>
                    </div>
                    ${alreadyExists ? '<div style="font-size:12px; color:#999;">已添加</div>' : '<i class="fas fa-download" style="color:#111;"></i>'}
                `;

                if (!alreadyExists) {
                    item.addEventListener('click', () => {
                        // Import it
                        window.tkSaveChar({
                            id: friend.id,
                            name: friend.nickname || friend.realName,
                            handle: (friend.realName || friend.nickname || 'user').toLowerCase().replace(/\s+/g, '') + '_' + Math.floor(Math.random()*100),
                            avatar: friend.avatarUrl,
                            status: friend.signature || '刚来到 TikTok',
                            persona: friend.persona || '',
                            isFollowed: true
                        });
                        window.tkRenderChat();
                        window.closeView(importSheet);
                        window.showToast('导入成功');
                    });
                }
                importList.appendChild(item);
            });
        }
        
        window.openView(importSheet);
    };

    window.tkOpenEditChar = function(charId = null) {
        editingCharId = charId;
        const title = document.getElementById('tk-char-sheet-title');
        
        if (charId) {
            if(title) title.textContent = '编辑角色';
            const char = window.tkGetChar(charId);
            if (char) {
                if(charNameInput) charNameInput.value = char.name || '';
                if(charStatusInput) charStatusInput.value = char.status || '';
                if(charPersonaInput) charPersonaInput.value = char.persona || '';
                if(charBioInput) charBioInput.value = char.bio || '';
                if(charFollowingInput) charFollowingInput.value = char.following || 0;
                if(charFollowersInput) charFollowersInput.value = char.followers || 0;
                if(charLikesInput) charLikesInput.value = char.likes || 0;
                
                setCharAvatarPreview(char.avatar);
                if(deleteCharBtn) deleteCharBtn.style.display = 'block';
            }
        } else {
            if(title) title.textContent = '添加新角色';
            if(charNameInput) charNameInput.value = '';
            if(charStatusInput) charStatusInput.value = '';
            if(charPersonaInput) charPersonaInput.value = '';
            if(charBioInput) charBioInput.value = '';
            if(charFollowingInput) charFollowingInput.value = 0;
            if(charFollowersInput) charFollowersInput.value = 0;
            if(charLikesInput) charLikesInput.value = 0;
            setCharAvatarPreview(null);
            if(deleteCharBtn) deleteCharBtn.style.display = 'none';
        }
        
        window.openView(editCharSheet);
    }
    
    // Alias for internal usage
    function openEditChar(charId) {
        window.tkOpenEditChar(charId);
    }
    
    // Avatar Upload
    const avatarWrapper = document.getElementById('tk-char-avatar-wrapper');
    const avatarUpload = document.getElementById('tk-char-avatar-upload');
    
    if (avatarWrapper && avatarUpload) {
        avatarWrapper.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => setCharAvatarPreview(event.target.result);
                reader.readAsDataURL(file);
            }
            e.target.value = '';
        });
    }
    
    function setCharAvatarPreview(url) {
        if (url) {
            charAvatarImg.src = url;
            charAvatarImg.style.display = 'block';
            charAvatarIcon.style.display = 'none';
        } else {
            charAvatarImg.src = '';
            charAvatarImg.style.display = 'none';
            charAvatarIcon.style.display = 'block';
        }
    }
    
    // Save
    if (saveCharBtn) {
        saveCharBtn.addEventListener('click', () => {
            const name = charNameInput.value.trim() || 'User_' + Date.now();
            const status = charStatusInput.value.trim();
            const persona = charPersonaInput.value.trim();
            const avatar = charAvatarImg.style.display === 'block' ? charAvatarImg.src : null;
            const bio = charBioInput ? charBioInput.value.trim() : '';
            const following = charFollowingInput ? charFollowingInput.value : 0;
            const followers = charFollowersInput ? charFollowersInput.value : 0;
            const likes = charLikesInput ? charLikesInput.value : 0;
            
            if (editingCharId) {
                const char = window.tkGetChar(editingCharId);
                if (char) {
                    char.name = name;
                    char.status = status;
                    char.persona = persona;
                    char.avatar = avatar;
                    char.bio = bio;
                    char.following = following;
                    char.followers = followers;
                    char.likes = likes;
                }
            } else {
                const newId = 'char_' + Date.now();
                window.tkSaveChar({
                    id: newId,
                    name: name,
                    handle: newId,
                    status: status,
                    persona: persona,
                    avatar: avatar,
                    bio: bio,
                    following: following,
                    followers: followers,
                    likes: likes,
                    isFollowed: true
                });
            }
            
            if (window.tkPersistState) window.tkPersistState();
            window.tkRenderChat();
            window.closeView(editCharSheet);
            window.showToast('已保存');
        });
    }
    
    // Delete
    if (deleteCharBtn) {
        deleteCharBtn.addEventListener('click', () => {
            if (editingCharId) {
                if (confirm('确定删除此角色吗？')) {
                    tkState.chars = tkState.chars.filter(c => c.id !== editingCharId);
                    if (window.tkPersistState) window.tkPersistState();
                    window.tkRenderChat();
                    window.closeView(editCharSheet);
                    window.showToast('已删除');
                }
            }
        });
    }

    // --- FULLSCREEN CHAT VIEW LOGIC ---
    if (chatBackBtn && chatView) {
        chatBackBtn.addEventListener('click', () => {
            window.closeView(chatView);
            currentChatCharId = null;
        });
    }
    
    // --- WATCH TOGETHER FEATURE ---
    const wtBubble = document.getElementById('tk-watch-together-bubble');
    let currentWtConfirmHandler = null;
    window.currentWtCharId = null; // 全局保存一起看的角色ID

    window.tkOpenWatchTogetherConfirm = function() {
        // 放宽限制，为了调试加一些日志
        console.log("[一起看入口] 被点击，当前 currentChatCharId:", currentChatCharId);

        if (!currentChatCharId || currentChatCharId === "null" || currentChatCharId === "undefined") {
            // 如果在聊天界面外点击了，尝试从之前缓存的 currentWtCharId 恢复
            if (window.currentWtCharId && window.currentWtCharId !== "null" && window.currentWtCharId !== "undefined") {
                console.log("[一起看入口] 使用缓存的 currentWtCharId 恢复:", window.currentWtCharId);
                currentChatCharId = window.currentWtCharId;
            } else {
                if(window.showToast) window.showToast('无法获取当前聊天对象，请重新进入聊天室！');
                return;
            }
        }
        
        // 我们要在这里把真正的ID快照下来，防止后续异步执行前 currentChatCharId 变化
        const snapshotCharId = currentChatCharId;
        const char = window.tkGetChar(snapshotCharId);
        if (!char) {
            if(window.showToast) window.showToast('找不到角色数据');
            return;
        }

        // 检查气泡是否已经在显示中了
        const wtBubbleEl = document.getElementById('tk-watch-together-bubble');
        if (wtBubbleEl && wtBubbleEl.style.display === 'flex' && wtBubbleEl.dataset.isHidden !== "true") {
            if(window.showToast) window.showToast(`您已经在和 ${char.name || 'TA'} 一起看了！`);
            return;
        }

        const modalOverlay = document.getElementById('custom-modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        
        modalTitle.textContent = '一起看';
        modalMessage.innerHTML = `是否邀请 ${char.name || char.handle} 一起看视频？`;
        
        // 我们用克隆节点的方式彻底清除绑定，防止旧事件残留和多次触发
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        currentWtConfirmHandler = () => {
            window.closeView(modalOverlay);
            
            // Initialize Watch Together Bubble
            wtChatHistory = [];
            wtChatContainer.innerHTML = '<div style="text-align: center; color: rgba(0,0,0,0.5); font-size: 10px; margin-top: 5px;">点击对方头像可以进行互动</div>';
            
            wtUserAvatar.src = tkState.profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
            wtCharAvatar.src = char.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Char';
            
            // Store charId in bubble for later use
            wtBubble.dataset.charId = snapshotCharId;
            window.currentWtCharId = snapshotCharId; // 显式保存到全局
            wtBubble.dataset.isHidden = "false";
            
            wtBubble.style.display = 'flex';
            
            // Reset menu states if any
            if(wtExitMenu) wtExitMenu.style.display = 'none';
            if(wtMainContent) wtMainContent.style.display = 'flex';
            if(wtCloseBtn) wtCloseBtn.className = 'fas fa-times';

            // Close chat view and navigate to Home Feed
            window.closeView(chatView);
            document.querySelector('.tk-bottom-nav .tk-nav-item[data-target="tk-home-tab"]').click();
            
            window.showToast(`已连接 ${char.name || char.handle}`);
        };
        
        newConfirmBtn.addEventListener('click', currentWtConfirmHandler);
        
        // Ensure UI is set to normal confirm mode (not prompt mode)
        const promptContent = document.getElementById('modal-prompt-content');
        const confirmContent = document.getElementById('modal-confirm-content');
        const promptConfirmBtn = document.getElementById('modal-prompt-confirm-btn');
        if(promptContent) promptContent.style.display = 'none';
        if(confirmContent) confirmContent.style.display = 'block';
        if(promptConfirmBtn) promptConfirmBtn.style.display = 'none';
        if(newConfirmBtn) newConfirmBtn.style.display = 'block';
        
        // 确保 overlay 层级够高并且可见
        modalOverlay.style.zIndex = '99999';
        window.openView(modalOverlay);
    };

    const wtUserAvatar = document.getElementById('wt-user-avatar');
    const wtCharAvatar = document.getElementById('wt-char-avatar');
    const wtCloseBtn = document.getElementById('wt-close-btn');
    const wtChatContainer = document.getElementById('wt-chat-container');
    const wtChatInput = document.getElementById('wt-chat-input');
    const wtSendBtn = document.getElementById('wt-send-btn');
    const wtLoadingOverlay = document.getElementById('wt-loading-overlay');
    const wtLoadingText = document.getElementById('wt-loading-text');

    let wtChatHistory = []; // temporary history for the current watch session


    // WT Send User Message
    function sendWtMessage() {
        const text = wtChatInput.value.trim();
        if (!text) return;
        
        wtChatHistory.push({ sender: 'user', text: text });
        appendWtMessage('user', text);
        wtChatInput.value = '';
    }

    if (wtSendBtn && wtChatInput) {
        wtSendBtn.addEventListener('click', sendWtMessage);
        wtChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendWtMessage();
        });
    }

    // WT Append Message
    function appendWtMessage(sender, text) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.width = '100%';
        row.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';
        
        const msgDiv = document.createElement('div');
        msgDiv.style.background = sender === 'user' ? '#333333' : '#e5e5ea'; // char的背景改为浅灰色
        msgDiv.style.color = sender === 'user' ? '#ffffff' : '#111111';
        msgDiv.style.padding = '6px 10px';
        msgDiv.style.borderRadius = '16px';
        msgDiv.style.fontSize = '12px';
        msgDiv.style.maxWidth = '85%';
        msgDiv.style.wordBreak = 'break-word';
        msgDiv.textContent = text;
        
        row.appendChild(msgDiv);
        wtChatContainer.appendChild(row);
        wtChatContainer.scrollTop = wtChatContainer.scrollHeight;
    }

    // WT History Menu Logic
    const wtHistoryBtn = document.getElementById('wt-history-btn');
    const wtHistoryOverlay = document.getElementById('wt-history-overlay');
    const wtHistoryClose = document.getElementById('wt-history-close');
    const wtHistoryContent = document.getElementById('wt-history-content');

    if (wtHistoryBtn && wtHistoryOverlay) {
        wtHistoryBtn.addEventListener('click', () => {
            if(wtHistoryContent) {
                wtHistoryContent.innerHTML = '';
                // 使历史记录容器更好地适应气泡布局
                wtHistoryContent.style.display = 'flex';
                wtHistoryContent.style.flexDirection = 'column';
                wtHistoryContent.style.gap = '10px';
                wtHistoryContent.style.padding = '10px 5px';
            }
            const charId = wtBubble.dataset.charId;
            const char = window.tkGetChar(charId);
            
            if (wtChatHistory.length === 0) {
                if(wtHistoryContent) wtHistoryContent.innerHTML = '<div style="text-align: center; color: #999; margin-top: 20px;">暂无聊天记录</div>';
            } else {
                wtChatHistory.forEach(m => {
                    const isSelf = m.sender === 'user';
                    
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.width = '100%';
                    row.style.justifyContent = isSelf ? 'flex-end' : 'flex-start';
                    
                    const bubble = document.createElement('div');
                    bubble.style.maxWidth = '80%';
                    bubble.style.padding = '8px 12px';
                    bubble.style.fontSize = '14px';
                    bubble.style.lineHeight = '1.4';
                    bubble.style.wordBreak = 'break-word';
                    
                    if (isSelf) {
                        bubble.style.background = '#111111'; // 用户黑色气泡
                        bubble.style.color = '#ffffff';
                        bubble.style.borderRadius = '16px';
                    } else {
                        bubble.style.background = '#e5e5ea'; // 角色浅灰色气泡
                        bubble.style.color = '#111111';
                        bubble.style.borderRadius = '16px';
                    }
                    
                    bubble.textContent = m.text;
                    row.appendChild(bubble);
                    
                    if(wtHistoryContent) wtHistoryContent.appendChild(row);
                });
                
                // 滚动到底部
                setTimeout(() => {
                    if (wtHistoryContent) wtHistoryContent.scrollTop = wtHistoryContent.scrollHeight;
                }, 50);
            }
            
            wtHistoryOverlay.style.display = 'flex';
        });
        
        if(wtHistoryClose) {
            wtHistoryClose.addEventListener('click', () => {
                wtHistoryOverlay.style.display = 'none';
            });
        }
        
        wtHistoryOverlay.addEventListener('click', (e) => {
            if (e.target === wtHistoryOverlay) {
                wtHistoryOverlay.style.display = 'none';
            }
        });
    }

    // WT Char Avatar Click -> API Gen Reaction
    let isWtGenerating = false;
    
    window.tkTriggerWtApi = async function(e) {
        if (e) {
            e.stopPropagation(); // 阻止冒泡
            if (e.type === 'touchend') {
                e.preventDefault(); // 防止穿透和双击
            }
        }
        
        console.log("[一起看] 触发 API 调用逻辑");

        if (isWtGenerating) {
            console.log("[一起看] 拦截: 正在生成中");
            if (window.showToast) window.showToast('对方正在回复中...');
            return;
        }

        // 1. 优先使用 window.currentWtCharId
        let charId = window.currentWtCharId;

        // 2. 备用尝试 dataset
        const wtBubbleEl = document.getElementById('tk-watch-together-bubble');
        if (!charId && wtBubbleEl && wtBubbleEl.dataset.charId) {
            charId = wtBubbleEl.dataset.charId;
        }
        
        // 3. 最终尝试 currentChatCharId
        if (!charId) {
            charId = currentChatCharId;
        }

        // 清理由于 DOM 属性化带来的假值
        if (charId === "null" || charId === "undefined" || charId === "") {
            charId = null;
        }

        if (!charId) {
            console.warn("[一起看] 拦截: 找不到气泡或没有 charId (所有途径均为空)");
            if (window.showToast) window.showToast('无法获取互动对象ID，请退出重试！');
            return;
        }

        const char = window.tkGetChar(charId);
        if (!char) {
            console.warn("[一起看] 拦截: 找不到对应的 char 对象, charId:", charId);
            if (window.showToast) window.showToast(`找不到ID为 ${charId} 的角色数据！`);
            return;
        }

        if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
            if (window.showToast) window.showToast('请在系统设置中配置 API');
            return;
        }

        console.log("[一起看] 准备调用 API, Char:", char.name);
        isWtGenerating = true;
        if (window.showToast) window.showToast('准备互动中...');

        // Get Current Video Context dynamically based on scroll position
        let currentVideo = null;
        try {
            const fsView = document.getElementById('tk-fullscreen-video-view');
            if (fsView && fsView.classList.contains('active')) {
                const vid = fsView.dataset.videoId;
                if (vid && window.findVideoGlobal) {
                    const res = window.findVideoGlobal(vid);
                    currentVideo = res ? res.video : null;
                }
            } else {
                // 动态获取：在主页滚动时寻找最靠近容器中心的卡片 (适配手机端)
                const feedContainer = document.getElementById('tk-feed-container');
                if (feedContainer && feedContainer.children.length > 0) {
                    const cards = Array.from(feedContainer.querySelectorAll('.tk-video-card'));
                    let closestCard = null;
                    let minDistance = Infinity;
                    
                    const containerRect = feedContainer.getBoundingClientRect();
                    const containerCenter = containerRect.top + containerRect.height / 2;

                    cards.forEach(card => {
                        const rect = card.getBoundingClientRect();
                        const cardCenter = rect.top + rect.height / 2;
                        const distance = Math.abs(containerCenter - cardCenter);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestCard = card;
                        }
                    });

                    if (closestCard && closestCard.dataset.videoId) {
                        const vid = closestCard.dataset.videoId;
                        if (window.findVideoGlobal) {
                            const res = window.findVideoGlobal(vid);
                            currentVideo = res ? res.video : null;
                        }
                    }
                }
                
                // Fallback
                if (!currentVideo && tkState && tkState.videos && tkState.videos.length > 0) {
                    currentVideo = tkState.videos[0];
                }
            }
        } catch(err) {
            console.warn('获取当前视频上下文失败', err);
        }

            let commentsContext = '';
            if (currentVideo && currentVideo.comments && currentVideo.comments.length > 0) {
                commentsContext = "该视频的评论区热评：\n";
                currentVideo.comments.slice(0, 5).forEach(c => {
                    commentsContext += `- ${c.authorName}: ${c.text}\n`;
                });
            }

            let videoContext = currentVideo 
                ? `当前我们在看一个视频。视频作者是：${currentVideo.authorName || '未知'}。视频文案是：${currentVideo.desc || '无'}。视频画面描述是：${currentVideo.sceneText || '一段视频'}。\n${commentsContext}`
                : `我们在浏览TikTok，但是当前没有特定的视频。`;

            let chatHistoryStr = "聊天记录:\n";
            wtChatHistory.slice(-10).forEach(m => {
                chatHistoryStr += `[${m.sender === 'user' ? '我(User)' : char.name}]: ${m.text}\n`;
            });

            // Collect World Book info
            let wbContext = '';
            
            // 1. 全局世界书
            if (window.getWorldBooks) {
                const allWb = window.getWorldBooks();
                const globalWb = allWb.filter(b => b.isGlobal);
                if (globalWb.length > 0) {
                    wbContext += "世界观背景设定:\n";
                    globalWb.forEach(b => {
                        b.entries.forEach(e => {
                            wbContext += `- ${e.keyword}: ${e.content}\n`;
                        });
                    });
                    wbContext += "\n";
                }
            }

            // 2. 内置世界书
            if (window.getBuiltinWorldBooks) {
                const builtinWb = window.getBuiltinWorldBooks().filter(b => b.isGlobal);
                if (builtinWb.length > 0) {
                    wbContext += "内置设定:\n";
                    builtinWb.forEach(b => {
                        b.entries.forEach(e => {
                            wbContext += `- ${e.keyword}: ${e.content}\n`;
                        });
                    });
                    wbContext += "\n";
                }
            }

            // 3. 角色记忆
            if (char && char.memories && char.memories.length > 0) {
                wbContext += "角色记忆:\n";
                char.memories.forEach(m => {
                    wbContext += `- ${m.text}\n`;
                });
                wbContext += "\n";
            }

            // Setup User Persona context
            let userPersonaContext = '';
            if (window.userState && window.userState.persona) {
                userPersonaContext = `我(User)的人设: ${window.userState.persona}\n`;
            }

            // Loading state in bubble
            wtCharAvatar.style.opacity = '0.5';
            
            // Temporary typing message
            const typingId = 'wt-typing-' + Date.now();
            const row = document.createElement('div');
            row.id = typingId;
            row.style.display = 'flex';
            row.style.width = '100%';
            row.style.justifyContent = 'flex-start';
            const msgDiv = document.createElement('div');
            msgDiv.style.background = '#e5e5ea'; // 输入中提示也改成浅灰色
            msgDiv.style.color = '#666';
            msgDiv.style.padding = '6px 10px';
            msgDiv.style.borderRadius = '12px 12px 12px 2px';
            msgDiv.style.fontSize = '12px';
            msgDiv.style.maxWidth = '85%';
            msgDiv.textContent = '正在回复中...';
            row.appendChild(msgDiv);
            wtChatContainer.appendChild(row);
            wtChatContainer.scrollTop = wtChatContainer.scrollHeight;
            
            const prompt = `
你现在的身份是：${char.name}
你的人设是：${char.persona}
现在我们正在"一起看视频"的连麦状态。

${wbContext}
${userPersonaContext}

${videoContext}

${chatHistoryStr}

要求：
1. 请读取已挂载的世界书，深度扮演 ${char.name} 的身份人设与user开始沉浸式聊天。
2. 读取视频内容、文案、评论区以及我刚才的话（如果有），作出合理回应。可以吐槽视频、回复我的话、玩梗，或者分享你的感受。
3. 一句一发，将你想说的话拆分成 3 到 5 条简短的微信式气泡。
4. 绝对不要发 emoji，也绝对不要使用句号结尾，要有十足的"活人感"和"网感"。语言自然连贯。
5. 必须返回严格的 JSON 数组格式（不要带有 markdown 代码块标记），格式如下：
[
  "气泡1",
  "气泡2",
  "气泡3"
]
`;

            try {
                let endpoint = window.apiConfig.endpoint;
                if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
                if(!endpoint.endsWith('/chat/completions')) {
                    endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.apiConfig.apiKey}`
                    },
                    body: JSON.stringify({
                        model: window.apiConfig.model || 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: 'You are a roleplay character JSON generator.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: parseFloat(window.apiConfig.temperature) || 0.8
                    })
                });

                if (!response.ok) throw new Error('API Error');
                
                const data = await response.json();
                let aiReply = data.choices[0].message.content;
                aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
                
                let parsedMsgs = [];
                try {
                    const parsed = JSON.parse(aiReply);
                    if (Array.isArray(parsed)) {
                        parsedMsgs = parsed;
                    } else if (parsed.text) {
                        parsedMsgs = [parsed.text];
                    } else if (parsed.reply && Array.isArray(parsed.reply)) {
                        parsedMsgs = parsed.reply;
                    } else if (typeof parsed === 'object') {
                        // 提取对象中的所有 string 值
                        parsedMsgs = Object.values(parsed).filter(v => typeof v === 'string');
                    }
                } catch (parseErr) {
                    console.warn('JSON Parse failed, falling back to split', parseErr);
                    // 容错：直接按换行符拆分气泡
                    parsedMsgs = aiReply.split('\n').map(s => s.replace(/^[-*•\d.\[\]"'\s]+/, '').trim()).filter(s => s.length > 0);
                }
                
                if (parsedMsgs.length === 0) {
                    parsedMsgs = ["(微笑)"];
                }
                
                // Remove typing message
                const typingRow = document.getElementById(typingId);
                if(typingRow) typingRow.remove();

                let delay = 0;
                parsedMsgs.forEach((msgText) => {
                    setTimeout(() => {
                        wtChatHistory.push({ sender: 'char', text: msgText });
                        appendWtMessage('char', msgText);
                    }, delay);
                    delay += 1500 + Math.random() * 1000;
                });

        } catch (error) {
            console.error('WT Gen Error:', error);
            if (window.showToast) window.showToast('互动生成失败');
            const typingRow = document.getElementById(typingId);
            if(typingRow) typingRow.remove();
        } finally {
            const avatarEl = document.getElementById('wt-char-avatar');
            if (avatarEl) avatarEl.style.opacity = '1';
            isWtGenerating = false;
        }
    }

    if (wtCharAvatar) {
        wtCharAvatar.addEventListener('click', window.tkTriggerWtApi);
        wtCharAvatar.addEventListener('touchend', window.tkTriggerWtApi);
    }

    const wtMagicBtn = document.getElementById('wt-magic-btn');
    if (wtMagicBtn) {
        wtMagicBtn.addEventListener('click', window.tkTriggerWtApi);
        wtMagicBtn.addEventListener('touchend', window.tkTriggerWtApi);
    }

    // WT Close & Summary (Inline Menu)
    const wtMainContent = document.getElementById('wt-main-content');
    const wtExitMenu = document.getElementById('wt-exit-menu');
    const wtExitSummaryBtn = document.getElementById('wt-exit-summary-btn');
    const wtExitDirectBtn = document.getElementById('wt-exit-direct-btn');

    if (wtCloseBtn) {
        wtCloseBtn.addEventListener('click', () => {
            // Toggle exit menu visibility within the bubble
            if (wtExitMenu.style.display === 'none') {
                wtMainContent.style.display = 'none';
                wtExitMenu.style.display = 'flex';
                // Change close btn to "back" icon just in case they want to cancel exiting
                wtCloseBtn.className = 'fas fa-chevron-left';
            } else {
                wtExitMenu.style.display = 'none';
                wtMainContent.style.display = 'flex';
                wtCloseBtn.className = 'fas fa-times';
            }
        });
    }

    function endWatchTogether(charId) {
        if (!charId) return;
        let dm = tkState.dms.find(d => d.charId === charId);
        if (!dm) {
            dm = { charId: charId, messages: [] };
            tkState.dms.push(dm);
        }
        dm.messages.push({
            sender: 'system',
            text: '一起看视频已结束',
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        });
        if (window.tkPersistState) window.tkPersistState();
        if (currentChatCharId === charId && chatView.classList.contains('active')) {
            renderMessages();
        }
    }

    if (wtExitDirectBtn) {
        wtExitDirectBtn.addEventListener('click', () => {
            const charId = wtBubble.dataset.charId || window.currentWtCharId;
            endWatchTogether(charId);

            wtBubble.style.display = 'none';
            wtBubble.dataset.charId = '';
            window.currentWtCharId = null;
            wtBubble.dataset.isHidden = "true";
            wtChatHistory = [];
            // Reset state
            wtExitMenu.style.display = 'none';
            wtMainContent.style.display = 'flex';
            wtCloseBtn.className = 'fas fa-times';
        });
    }

    if (wtExitSummaryBtn) {
        wtExitSummaryBtn.addEventListener('click', async () => {
            const charId = wtBubble.dataset.charId || window.currentWtCharId;
            const char = window.tkGetChar(charId);
            if (!char) return;

            wtLoadingOverlay.style.display = 'flex';
            
            try {
                await generateWtSummary(char);
            } finally {
                endWatchTogether(charId);
                
                wtLoadingOverlay.style.display = 'none';
                wtBubble.style.display = 'none';
                wtBubble.dataset.charId = '';
                window.currentWtCharId = null;
                wtBubble.dataset.isHidden = "true";
                wtChatHistory = [];
                // Reset state
                wtExitMenu.style.display = 'none';
                wtMainContent.style.display = 'flex';
                wtCloseBtn.className = 'fas fa-times';
            }
        });
    }

    async function generateWtSummary(char) {
        if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
            window.showToast('请在系统设置中配置 API，无法保存总结');
            return;
        }

        if (wtChatHistory.length === 0) {
            window.showToast('暂无互动内容，已退出');
            return;
        }

        const now = new Date();
        const timeStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

        let chatHistoryStr = "";
        wtChatHistory.forEach(m => {
            chatHistoryStr += `[${m.sender === 'user' ? '我' : char.name}]: ${m.text}\n`;
        });

        const prompt = `
请总结这段"一起看视频"的连麦过程。
记录时间：${timeStr}
聊天记录：
${chatHistoryStr}

要求：
1. 提取真实的互动时间和内容。
2. 用精练、自然的第三人称日记视角来写（例如："2024年X月X日 XX:XX，我和某某一起连麦刷了会儿视频，聊了聊关于..."）。
3. 绝对不要胡编乱造没有发生过的事情，如果没有特定细节就一笔带过。真实的啥简化啥。
4. 返回严格的 JSON 格式，包含一个 summary 字段，不要有 markdown。格式：
{ "summary": "总结内容" }
`;

        try {
            let endpoint = window.apiConfig.endpoint;
            if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if(!endpoint.endsWith('/chat/completions')) {
                endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: window.apiConfig.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are an accurate summarizer.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3
                })
            });

            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json();
            let aiReply = data.choices[0].message.content;
            aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(aiReply);
            
            if (parsed.summary) {
                if (window.autoSaveSummaryToWorldBook) {
                    window.autoSaveSummaryToWorldBook(`和${char.name}的一起看记录 (${timeStr})`, parsed.summary);
                } else {
                    window.showToast('总结完成，但未保存');
                }
            }
        } catch (err) {
            console.error('Summary Error:', err);
            window.showToast('总结保存失败');
        }
    }


    // Connect Char Profile "讯息" button to open Chat View
    if (tkSubProfileMsgBtn) {
        tkSubProfileMsgBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const charId = window.currentTkSubProfileCharId;
            if (charId) {
                // Check if dm exists, if not create one
                let dm = tkState.dms.find(d => d.charId === charId);
                if (!dm) {
                    dm = { charId: charId, messages: [] };
                    tkState.dms.push(dm);
                    if (window.tkPersistState) window.tkPersistState();
                    if (window.tkRenderChat) window.tkRenderChat();
                }
                window.tkOpenChatView(charId);
            }
        });
    }

    window.tkOpenChatView = function(charId) {
        const char = window.tkGetChar(charId);
        if (!char || !chatView) return;
        currentChatCharId = charId;
        
        chatTitle.textContent = char.name || char.handle;

        // Update Avatar in new Chat Header
        const headerAvatar = document.getElementById('tk-dm-chat-avatar');
        const headerAvatarIcon = document.getElementById('tk-dm-chat-avatar-icon');
        if (char && char.avatar) {
            if (headerAvatar) {
                headerAvatar.src = char.avatar;
                headerAvatar.style.display = 'block';
            }
            if (headerAvatarIcon) headerAvatarIcon.style.display = 'none';
        } else {
            if (headerAvatar) headerAvatar.style.display = 'none';
            if (headerAvatarIcon) headerAvatarIcon.style.display = 'block';
        }

        renderMessages();
        window.openView(chatView);
    };

    function renderMessages() {
        if (!messagesContainer || !currentChatCharId) return;
        messagesContainer.innerHTML = '';
        
        let dm = tkState.dms.find(d => d.charId === currentChatCharId);
        if (!dm || dm.messages.length === 0) {
            messagesContainer.innerHTML = '<div style="text-align:center; color:#999; font-size:13px; margin-top:20px;">打个招呼吧</div>';
            return;
        }

        const char = window.tkGetChar(currentChatCharId);
        const charAvatar = (char && char.avatar) ? char.avatar : '';
        
        let lastSender = null;
        let lastTimeStr = null;

        dm.messages.forEach((msg, index) => {
            const isSelf = msg.sender === 'user';
            
            // Generate a simple timestamp if none exists
            const timeStr = msg.timestamp || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            
            // Render center time bubble if time changed or first message
            if (timeStr !== lastTimeStr) {
                const timeRow = document.createElement('div');
                timeRow.style.width = '100%';
                timeRow.style.display = 'flex';
                timeRow.style.justifyContent = 'center';
                timeRow.style.marginBottom = '15px';
                timeRow.style.marginTop = index === 0 ? '5px' : '15px';
                
                timeRow.innerHTML = `<span style="background: rgba(0,0,0,0.05); color: #999; font-size: 11px; padding: 2px 8px; border-radius: 8px;">${timeStr}</span>`;
                messagesContainer.appendChild(timeRow);
                lastTimeStr = timeStr;
                lastSender = null; // Reset sender so first msg after time always has avatar/normal spacing
            }

            // Look ahead to check if the next message is also from the same sender
            const hasNext = (index < dm.messages.length - 1 && dm.messages[index + 1].sender === msg.sender && dm.messages[index + 1].timestamp !== lastTimeStr /* approximation */);
            const isConsecutive = (lastSender === msg.sender);
            
            // Tight gap if there's a next message from same sender
            const marginBottom = hasNext ? '2px' : '15px';
            lastSender = msg.sender;

            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.width = '100%';
            row.style.marginBottom = marginBottom;
            
            // Build bubble style and content based on whether it's a shared video
            let bubbleStyle = `background: ${isSelf ? '#111' : '#f0f0f0'}; color: ${isSelf ? '#fff' : '#111'}; padding: 10px 14px; font-size: 15px; max-width: 75%; line-height: 1.4; word-break: break-word; position: relative;`;
            
            // Dynamic border radius for Red Note / WeChat style group bubbles
            let borderRadius = '20px';
            if (isSelf) {
                if (isConsecutive && hasNext) borderRadius = '20px 4px 4px 20px';
                else if (isConsecutive && !hasNext) borderRadius = '20px 4px 20px 20px';
                else if (!isConsecutive && hasNext) borderRadius = '20px 20px 4px 20px';
                else borderRadius = '20px 20px 4px 20px'; // isolated
            } else {
                if (isConsecutive && hasNext) borderRadius = '4px 20px 20px 4px';
                else if (isConsecutive && !hasNext) borderRadius = '4px 20px 20px 20px';
                else if (!isConsecutive && hasNext) borderRadius = '20px 20px 20px 4px';
                else borderRadius = '20px 20px 20px 4px'; // isolated
            }
            bubbleStyle += `border-radius: ${borderRadius};`;

            let msgContentHtml = msg.text;

            if (msg.sender === 'system') {
                const sysRow = document.createElement('div');
                sysRow.style.width = '100%';
                sysRow.style.display = 'flex';
                sysRow.style.justifyContent = 'center';
                sysRow.style.marginBottom = '15px';
                
                sysRow.innerHTML = `
                    <div style="background: rgba(0,0,0,0.05); color: #8e8e93; font-size: 12px; padding: 6px 12px; border-radius: 12px; font-weight: 500;">
                        ${msg.text}
                    </div>
                `;
                messagesContainer.appendChild(sysRow);
                return; // Skip normal bubble render
            }

            if (msg.sharedVideoId) {
                let sv = null;
                if (window.findVideoGlobal) {
                    const found = window.findVideoGlobal(msg.sharedVideoId);
                    if (found) sv = found.video;
                } else {
                    sv = tkState.videos.find(v => v.id === msg.sharedVideoId);
                }
                
                if (sv) {
                    const bgStyleStr = sv.bgImage ? `background: url('${sv.bgImage}') center/cover no-repeat;` : (sv.bgColor ? `background: ${sv.bgColor};` : `background: #ffffff;`);
                    
                    const cardTextHtml = sv.bgImage ? '' : (sv.desc ? `
                        <div style="background: #111111; color: #ffffff; padding: 12px 16px; border-radius: 16px; max-width: 85%; text-align: center; font-size: 12px; line-height: 1.4; word-break: break-word; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden;">
                            ${sv.desc}
                        </div>
                    ` : '');
                    
                    msgContentHtml = `
                        <div onclick="if(window.tkOpenFullscreenVideo){window.tkOpenFullscreenVideo('${sv.id}');}else{if(window.showToast)window.showToast('组件未就绪');}" style="width: 150px; height: 220px; border-radius: 16px; overflow: hidden; position: relative; cursor: pointer; ${bgStyleStr} display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #f0f0f0;">
                            ${cardTextHtml}
                            <div style="background: rgba(255,255,255,0.95); color: #111; padding: 8px 12px; font-size: 12px; font-weight: 500; width: 100%; position: absolute; bottom: 0; text-align: center; box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-top: 1px solid #f0f0f0;">
                                @${sv.authorName || 'User'}
                            </div>
                        </div>
                    `;
                    bubbleStyle = `padding: 0; background: transparent; border-radius: 16px;`;
                }
            }
            
            if (isSelf) {
                row.style.justifyContent = 'flex-end';
                row.style.alignItems = 'flex-end';
                row.innerHTML = `
                    <div style="${bubbleStyle}">
                        ${msgContentHtml}
                    </div>
                `;
            } else {
                let avatarHtml = '';
                if (!isConsecutive) {
                    avatarHtml = charAvatar
                        ? `<img src="${charAvatar}" style="width: 36px; height: 36px; border-radius: 50%; margin-right: 10px; object-fit: cover; background: #f0f0f0; flex-shrink: 0; align-self: flex-end;">`
                        : `<div style="width: 36px; height: 36px; border-radius: 50%; background: #f0f0f0; display: flex; justify-content: center; align-items: center; margin-right: 10px; color: #999; flex-shrink: 0; align-self: flex-end;"><i class="fas fa-user"></i></div>`;
                } else {
                    // Remove height constraint to avoid expanding the row unexpectedly
                    avatarHtml = `<div style="width: 36px; margin-right: 10px; flex-shrink: 0;"></div>`;
                }

                row.style.justifyContent = 'flex-start';
                // Align items flex-end makes the avatar anchor at the bottom of the group like real apps do
                row.style.alignItems = 'flex-end';
                row.innerHTML = `
                    ${avatarHtml}
                    <div style="${bubbleStyle}">
                        ${msgContentHtml}
                    </div>
                `;
            }
            messagesContainer.appendChild(row);
        });

        // Scroll to bottom
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
    }

    if (chatSendBtn && chatInput) {
        chatSendBtn.addEventListener('click', () => {
            if (!currentChatCharId) return;
            const text = chatInput.value.trim();
            if (!text) return;
            
            let dm = tkState.dms.find(d => d.charId === currentChatCharId);
            if (!dm) {
                dm = { charId: currentChatCharId, messages: [] };
                tkState.dms.push(dm);
            }
            
            dm.messages.push({
                sender: 'user',
                text: text,
                timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            });
            
            chatInput.value = '';
            if (window.tkPersistState) window.tkPersistState();
            renderMessages();
            if (window.tkRenderChat) window.tkRenderChat();
            
            // Reset input UI icons back to normal state
            chatSendBtn.style.display = 'none';
            if(chatMicBtn) chatMicBtn.style.display = 'block';
            const plusBtn = document.getElementById('tk-dm-plus-btn');
            if(plusBtn) plusBtn.style.display = 'block';
            
            // Note: Auto reply removed. Use the mic button for AI generation.
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                chatSendBtn.click();
            }
        });
        
        // Show send button when typing
        chatInput.addEventListener('input', () => {
            if (chatInput.value.trim().length > 0) {
                chatSendBtn.style.display = 'flex';
                if(chatMicBtn) chatMicBtn.style.display = 'none';
                document.getElementById('tk-dm-plus-btn').style.display = 'none';
            } else {
                chatSendBtn.style.display = 'none';
                if(chatMicBtn) chatMicBtn.style.display = 'block';
                document.getElementById('tk-dm-plus-btn').style.display = 'block';
            }
        });
    }

    let isChatGenerating = false;
    if (chatMicBtn) {
        chatMicBtn.addEventListener('click', async () => {
            if (!currentChatCharId) return;

            if (isChatGenerating) {
                if (window.showToast) window.showToast('对方正在输入中...');
                return;
            }
            
            if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
                if (window.showToast) window.showToast('请在系统设置中配置 API');
                return;
            }

            isChatGenerating = true;

            const char = window.tkGetChar(currentChatCharId);
            if(!char) return;

            let dm = tkState.dms.find(d => d.charId === currentChatCharId);
            if (!dm) {
                dm = { charId: currentChatCharId, messages: [] };
                tkState.dms.push(dm);
            }

            window.showToast('对方正在输入...');

            // Collect World Book info
            let wbContext = '';
            
            // 1. 全局世界书
            if (window.getWorldBooks) {
                const allWb = window.getWorldBooks();
                const globalWb = allWb.filter(b => b.isGlobal);
                if (globalWb.length > 0) {
                    wbContext += "世界观背景设定:\n";
                    globalWb.forEach(b => {
                        b.entries.forEach(e => {
                            wbContext += `- ${e.keyword}: ${e.content}\n`;
                        });
                    });
                    wbContext += "\n";
                }
            }

            // 2. 内置世界书
            if (window.getBuiltinWorldBooks) {
                const builtinWb = window.getBuiltinWorldBooks().filter(b => b.isGlobal);
                if (builtinWb.length > 0) {
                    wbContext += "内置设定:\n";
                    builtinWb.forEach(b => {
                        b.entries.forEach(e => {
                            wbContext += `- ${e.keyword}: ${e.content}\n`;
                        });
                    });
                    wbContext += "\n";
                }
            }

            // 3. 角色记忆
            if (char && char.memories && char.memories.length > 0) {
                wbContext += "角色记忆:\n";
                char.memories.forEach(m => {
                    wbContext += `- ${m.text}\n`;
                });
                wbContext += "\n";
            }

            // Setup User Persona context
            let userPersonaContext = '';
            if (window.userState && window.userState.persona) {
                userPersonaContext = `User的人设: ${window.userState.persona}\n`;
            }

            // Assemble Chat History (last 15 msgs)
            const recentMsgs = dm.messages.slice(-15);
            let chatHistory = "历史聊天记录:\n";
            let sharedVideoContext = "";

            recentMsgs.forEach(m => {
                let msgContent = m.text;
                if (m.sharedVideoId) {
                    let sv = null;
                    if (window.findVideoGlobal) {
                        const found = window.findVideoGlobal(m.sharedVideoId);
                        if (found) sv = found.video;
                    } else {
                        sv = tkState.videos.find(v => v.id === m.sharedVideoId);
                    }
                    if (sv) {
                        msgContent += ` (分享了视频：文案[${sv.desc || '无'}] 画面内容[${sv.sceneText || '无'}])`;
                        sharedVideoContext = `\n请注意，User 刚刚分享了一个视频，视频文案是：${sv.desc || '无'}，视频内容是：${sv.sceneText || '无'}。请针对这个视频的内容、文案或者可能产生的评论进行互动和反馈。`;
                    }
                }
                chatHistory += `[${m.sender === 'user' ? 'User' : 'Char'}]: ${msgContent}\n`;
            });

            const prompt = `
你现在的身份是：${char.name}
你的人设是：${char.persona}
请扮演该角色，与 User 开启沉浸式对话。${sharedVideoContext}

要求：
1. 一句一发，不要一大串。调用一次必须生成 3 到 6 条气泡回复。
2. 如果 User 分享了视频，请务必读取视频内容和文案进行针对性玩梗、感叹或讨论（视频的作者不一定是user，读取视频创作者名字）。
3. 绝对不要发emoji，也绝对不要使用句号结尾，要有十足的"活人感"和网感，就像真实朋友在连发微信一样。
4. 结合上下文和当前人设，语言简练自然。
5. 必须返回严格的 JSON 数组格式（不要带有 markdown 代码块标记），格式如下：
[
  "第一条回复内容",
  "第二条回复内容",
  "第三条回复内容"
]

${wbContext}
${userPersonaContext}
${chatHistory}
`;

            try {
                let endpoint = window.apiConfig.endpoint;
                if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
                if(!endpoint.endsWith('/chat/completions')) {
                    endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.apiConfig.apiKey}`
                    },
                    body: JSON.stringify({
                        model: window.apiConfig.model || 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: 'You are a roleplay character JSON generator.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: parseFloat(window.apiConfig.temperature) || 0.8
                    })
                });

                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                
                const data = await response.json();
                let aiReply = data.choices[0].message.content;
                
                aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
                
                let parsedMsgs = [];
                try {
                    const parsed = JSON.parse(aiReply);
                    if (Array.isArray(parsed)) {
                        parsedMsgs = parsed;
                    } else if (parsed.text) {
                        parsedMsgs = [parsed.text];
                    } else if (parsed.reply && Array.isArray(parsed.reply)) {
                        parsedMsgs = parsed.reply;
                    } else if (typeof parsed === 'object') {
                        parsedMsgs = Object.values(parsed).filter(v => typeof v === 'string');
                    }
                } catch (parseErr) {
                    console.warn('Chat JSON Parse failed, falling back to split', parseErr);
                    parsedMsgs = aiReply.split('\n').map(s => s.replace(/^[-*•\d.\[\]"'\s]+/, '').trim()).filter(s => s.length > 0);
                }
                
                if (parsedMsgs.length === 0) {
                    parsedMsgs = ["(微笑)"];
                }

                // Send messages sequentially with delay
                let delay = 0;
                parsedMsgs.forEach((msgText, index) => {
                    setTimeout(() => {
                        // double check we are still on the same chat if needed, but safe to push anyway
                        dm.messages.push({
                            sender: 'char',
                            text: msgText,
                            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                        });
                        if (window.tkPersistState) window.tkPersistState();
                        // Only re-render if we are still viewing this chat
                        if (currentChatCharId === char.id) {
                            renderMessages();
                        }
                        if (window.tkRenderChat) window.tkRenderChat();
                    }, delay);
                    // Add 1.5 - 2.5 seconds delay between each message
                    delay += 1500 + Math.random() * 1000;
                });

            } catch (error) {
                console.error('Chat Gen Error:', error);
                if (window.showToast) window.showToast('生成回复失败');
            } finally {
                isChatGenerating = false;
            }
        });
    }

});
