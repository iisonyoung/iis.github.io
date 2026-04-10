// ==========================================
// TIKTOK: 5. PROFILE TAB
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const avatarImg = document.getElementById('tk-profile-avatar-img');
    const avatarIcon = document.getElementById('tk-profile-avatar-icon');
    const statusBubble = document.getElementById('tk-profile-status-bubble');
    const nameEl = document.getElementById('tk-profile-name');
    const handleEl = document.getElementById('tk-profile-handle');
    const bioEl = document.getElementById('tk-profile-bio');
    
    const statFollowing = document.getElementById('tk-stat-following');
    const statFollowers = document.getElementById('tk-stat-followers');
    const statLikes = document.getElementById('tk-stat-likes');
    
    const editBtn = document.getElementById('tk-profile-edit-btn');
    const msgBtn = document.getElementById('tk-profile-msg-btn');
    const profileBackBtn = document.getElementById('tk-profile-back-btn');
    const editSheet = document.getElementById('tk-edit-profile-sheet');
    const saveProfileBtn = document.getElementById('tk-save-profile-btn');
    const tkAppView = document.getElementById('tiktok-view');
    const editCharSheet = document.getElementById('tk-edit-char-sheet');
    const subProfileEditTrigger = document.getElementById('tk-sub-profile-edit-trigger');
    
    // Edit Form Elements
    const editNameInput = document.getElementById('tk-edit-name');
    const editHandleInput = document.getElementById('tk-edit-handle');
    const editBioInput = document.getElementById('tk-edit-bio');
    const editPersonaInput = document.getElementById('tk-edit-persona');
    
    // Stats Form Elements
    const editFollowingInput = document.getElementById('tk-edit-following');
    const editFollowersInput = document.getElementById('tk-edit-followers');
    const editLikesInput = document.getElementById('tk-edit-likes');

    // Avatar Upload in Profile
    const avatarBtn = document.getElementById('tk-profile-avatar-btn');
    const avatarUpload = document.getElementById('tk-profile-avatar-upload');

    // Sub Profile Elements
    const subProfileView = document.getElementById('tk-sub-profile-view');
    const subProfileBackBtn = document.getElementById('tk-sub-profile-back-btn');
    const subProfileAvatarImg = document.getElementById('tk-sub-profile-avatar-img');
    const subProfileAvatarIcon = document.getElementById('tk-sub-profile-avatar-icon');
    const subProfileStatusBubble = document.getElementById('tk-sub-profile-status-bubble');
    const subProfileName = document.getElementById('tk-sub-profile-name');
    const subProfileHandle = document.getElementById('tk-sub-profile-handle');
    const subStatFollowing = document.getElementById('tk-sub-stat-following');
    const subStatFollowers = document.getElementById('tk-sub-stat-followers');
    const subStatLikes = document.getElementById('tk-sub-stat-likes');
    const subProfileBio = document.getElementById('tk-sub-profile-bio');
    const subProfileFollowBtn = document.getElementById('tk-sub-profile-follow-btn');
    const subProfileMsgBtn = document.getElementById('tk-sub-profile-msg-btn');
    const subProfileApiBtn = document.getElementById('tk-sub-profile-api-btn');
    const subProfileGrid = document.getElementById('tk-sub-profile-grid');
    
    let currentSubCharId = null;

    if (subProfileBackBtn && subProfileView) {
        subProfileBackBtn.addEventListener('click', () => {
            subProfileView.classList.remove('active');
            currentSubCharId = null;
        });
    }

    if (subProfileEditTrigger) {
        subProfileEditTrigger.addEventListener('click', () => {
            if (currentSubCharId) {
                // Open edit char sheet
                const title = document.getElementById('tk-char-sheet-title');
                if (title) title.textContent = '编辑角色';
                
                const charNameInput = document.getElementById('tk-char-name');
                const charStatusInput = document.getElementById('tk-char-status');
                const charPersonaInput = document.getElementById('tk-char-persona');
                const charBioInput = document.getElementById('tk-char-bio');
                const charFollowingInput = document.getElementById('tk-char-following');
                const charFollowersInput = document.getElementById('tk-char-followers');
                const charLikesInput = document.getElementById('tk-char-likes');
                const deleteCharBtn = document.getElementById('tk-delete-char-btn');
                const charAvatarImg = document.getElementById('tk-char-avatar-img');
                const charAvatarIcon = document.querySelector('#tk-char-avatar-preview i');
                
                const char = window.tkGetChar(currentSubCharId);
                if (char) {
                    if(charNameInput) charNameInput.value = char.name || '';
                    if(charStatusInput) charStatusInput.value = char.status || '';
                    if(charPersonaInput) charPersonaInput.value = char.persona || '';
                    if(charBioInput) charBioInput.value = char.bio || '';
                    if(charFollowingInput) charFollowingInput.value = char.following || 0;
                    if(charFollowersInput) charFollowersInput.value = char.followers || 0;
                    if(charLikesInput) charLikesInput.value = char.likes || 0;
                    
                    if(deleteCharBtn) deleteCharBtn.style.display = 'block';
                    
                    if (char.avatar) {
                        if(charAvatarImg) { charAvatarImg.src = char.avatar; charAvatarImg.style.display = 'block'; }
                        if(charAvatarIcon) charAvatarIcon.style.display = 'none';
                    } else {
                        if(charAvatarImg) { charAvatarImg.src = ''; charAvatarImg.style.display = 'none'; }
                        if(charAvatarIcon) charAvatarIcon.style.display = 'block';
                    }
                }
                
                // We need to set editingCharId in 4_chat.js context indirectly, or just trust the save button handles it.
                // A better way is to dispatch a custom event or call a global func.
                // Since 4_chat.js handles the save for this sheet, and relies on its own editingCharId scope, 
                // we should expose a global function in 4_chat.js to open it properly.
                if (window.tkOpenEditChar) {
                    window.tkOpenEditChar(currentSubCharId);
                } else {
                    window.openView(editCharSheet);
                }
            }
        });
    }

    // Open Sub Profile Function
    window.tkOpenSubProfile = function(charId) {
        const char = window.tkGetChar(charId);
        if (!char || !subProfileView) return;
        currentSubCharId = charId;
        window.currentTkSubProfileCharId = charId;

        // Render info
        subProfileName.textContent = char.name || 'User';
        subProfileHandle.textContent = '@' + (char.handle || charId);
        subProfileBio.textContent = char.bio || '暂无简介';
        
        if (char.status) {
            subProfileStatusBubble.style.display = 'block';
            subProfileStatusBubble.textContent = char.status;
        } else {
            subProfileStatusBubble.style.display = 'none';
        }

        subStatFollowing.textContent = char.following || 0;
        subStatFollowers.textContent = char.followers || 0;
        subStatLikes.textContent = char.likes || 0;

        if (char.avatar) {
            subProfileAvatarImg.src = char.avatar;
            subProfileAvatarImg.style.display = 'block';
            subProfileAvatarIcon.style.display = 'none';
        } else {
            subProfileAvatarImg.src = '';
            subProfileAvatarImg.style.display = 'none';
            subProfileAvatarIcon.style.display = 'block';
        }

        // Follow Btn State
        if (char.isFollowed) {
            subProfileFollowBtn.textContent = '已关注';
            subProfileFollowBtn.className = 'tk-btn-secondary';
        } else {
            subProfileFollowBtn.textContent = '关注';
            subProfileFollowBtn.className = 'tk-btn-primary';
        }

        // Render initially with "videos" target
        const activeTab = document.querySelector('#tk-sub-profile-view .tk-ptab.active');
        const target = activeTab ? activeTab.getAttribute('data-target') : 'videos';
        
        let charVideos = tkState.videos.filter(v => v.authorId === charId);
        let likedVideos = [];
        if (char.likedVideoIds) {
            likedVideos = tkState.videos.filter(v => char.likedVideoIds.includes(v.id));
        }
        
        if (subProfileGrid) {
            renderGrid(target, subProfileGrid, charVideos, likedVideos);
        }

        subProfileView.classList.add('active');
    };

    if (subProfileFollowBtn) {
        subProfileFollowBtn.addEventListener('click', () => {
            if (!currentSubCharId) return;
            const char = window.tkGetChar(currentSubCharId);
            if (char) {
                char.isFollowed = !char.isFollowed;
                if (window.tkPersistState) window.tkPersistState();
                if (char.isFollowed) {
                    subProfileFollowBtn.textContent = '已关注';
                    subProfileFollowBtn.className = 'tk-btn-secondary';
                    window.showToast('已关注');
                } else {
                    subProfileFollowBtn.textContent = '关注';
                    subProfileFollowBtn.className = 'tk-btn-primary';
                    window.showToast('已取消关注');
                }
                if (window.tkRenderHome) window.tkRenderHome();
                if (window.tkRenderChat) window.tkRenderChat();
            }
        });
    }

    if (subProfileApiBtn) {
        subProfileApiBtn.addEventListener('click', () => {
            if (!currentSubCharId) return;
            // Trigger API specifically for this char
            if (window.tkGenerateCharVideos) {
                window.tkGenerateCharVideos(currentSubCharId, () => {
                    // re-render after generation
                    window.tkOpenSubProfile(currentSubCharId);
                });
            } else {
                window.showToast('生成功能未绑定');
            }
        });
    }

    // Add tkGenerateCharVideos to global scope
    window.tkGenerateCharVideos = async function(charId, callback) {
        if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
            window.showToast('请在系统设置中配置 API');
            return;
        }

        const char = window.tkGetChar(charId);
        if(!char) return;

        window.showToast('正在生成角色主页内容...');
        
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

        // 2. 内置世界书 (如果存在)
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

        // 3. 角色记忆 (如果存在)
        if (char.memories && char.memories.length > 0) {
            wbContext += "角色记忆:\n";
            char.memories.forEach(m => {
                wbContext += `- ${m.text}\n`;
            });
            wbContext += "\n";
        }

        const prompt = `
你现在是一个 TikTok 视频内容生成器。请根据以下角色的设定和挂载的世界书/记忆，为该角色生成主页内容：至少 2 条发布的视频内容和至少 2 条点赞过的视频。
角色名字：${char.name}
角色设定：${char.persona}

要求：
1. 整体风格符合该角色的性格和人物设定，视频画面用文字描述，富有镜头感或气泡文字表现感，必须以第三人称视角描述简要的环境氛围、动作和语言描述，字数严格控制在 40-80 字之间。
2. 符合世界观，仿真实tk网络视频，内容多样化，文案要具有“活人感”（例如碎碎念、吐槽、玩梗,也可以是一句摘抄的文学语录），切忌机器播报感。
3. 务必为每个视频生成 3-5 条相关评论，且如果情景合适（比如@了朋友），请在评论中追加 \`replies\`（楼中楼回复）。
4. 返回严格的 JSON 格式（不要有 markdown 代码块标记，不要多余文字），格式必须如下：
{
  "posts": [
    {
      "desc": "视频文案（简短，带tag）",
      "sceneText": "画面内容文字描述（气泡内容或镜头描述）",
      "likes": 1234,
      "commentsCount": 5,
      "shares": 12,
      "comments": [
        { 
          "authorName": "评论者A", 
          "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=c1", 
          "text": "评论内容", 
          "likes": 12,
          "replies": [
            {
              "authorName": "回复者B",
              "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=c2",
              "text": "回复内容（如果情景合适）",
              "likes": 3
            }
          ]
        }
      ]
    }
  ],
  "likedVideos": [
    {
      "authorName": "随机创作者名",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=v1",
      "desc": "点赞视频文案",
      "sceneText": "点赞视频的画面内容",
      "likes": 5678,
      "commentsCount": 30,
      "shares": 20,
      "comments": [
        {
          "authorName": "评论者A",
          "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=c3",
          "text": "好有趣的视频！",
          "likes": 100,
          "replies": []
        }
      ]
    }
  ]
}

${wbContext}
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
                        { role: 'system', content: 'You are a helpful JSON data generator.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: parseFloat(window.apiConfig.temperature) || 0.8
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            let aiReply = data.choices[0].message.content;
            
            aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(aiReply);
            
            let hasNewContent = false;

            if (parsedData.posts && Array.isArray(parsedData.posts)) {
                parsedData.posts.forEach(v => {
                    tkState.videos.unshift({
                        id: 'v_' + Date.now() + Math.floor(Math.random() * 1000),
                        authorId: charId,
                        authorName: char.name,
                        authorAvatar: char.avatar || null,
                        desc: v.desc || '',
                        sceneText: v.sceneText || '',
                        likes: v.likes || Math.floor(Math.random() * 1000),
                        commentsCount: (v.comments && v.comments.length) || v.commentsCount || 0,
                        shares: v.shares || Math.floor(Math.random() * 100),
                        isLiked: false,
                        comments: v.comments || []
                    });
                });
                hasNewContent = true;
            }

            if (parsedData.likedVideos && Array.isArray(parsedData.likedVideos)) {
                if (!char.likedVideoIds) char.likedVideoIds = [];
                parsedData.likedVideos.forEach(v => {
                    const newId = 'v_liked_' + Date.now() + Math.floor(Math.random() * 1000);
                    tkState.videos.unshift({
                        id: newId,
                        authorId: 'user_' + Date.now() + Math.floor(Math.random() * 100),
                        authorName: v.authorName || 'User',
                        authorAvatar: v.authorAvatar || null,
                        desc: v.desc || '',
                        sceneText: v.sceneText || '',
                        likes: v.likes || Math.floor(Math.random() * 10000),
                        commentsCount: (v.comments && v.comments.length) || v.commentsCount || 0,
                        shares: v.shares || Math.floor(Math.random() * 100),
                        isLiked: false, // The *user* hasn't necessarily liked it, but the char has
                        comments: v.comments || []
                    });
                    char.likedVideoIds.push(newId);
                });
                hasNewContent = true;
            }

            if (hasNewContent) {
                if (window.tkPersistState) window.tkPersistState();
                if(window.tkRenderHome) window.tkRenderHome();
                window.showToast('生成成功');
                if(callback) callback();
            } else {
                throw new Error('No posts or likedVideos array in JSON');
            }

        } catch (error) {
            console.error('Gen Error:', error);
            window.showToast('生成失败，请检查 API 配置');
        }
    };

    window.tkRenderProfile = function() {
        const p = tkState.profile;
        
        // Render Info
        if (nameEl) nameEl.textContent = p.name || 'User';
        if (handleEl) handleEl.textContent = '@' + (p.handle || 'user123');
        if (bioEl) bioEl.textContent = p.bio || '点击添加个人简介';
        
        if (p.status) {
            if(statusBubble) {
                statusBubble.style.display = 'block';
                statusBubble.textContent = p.status;
            }
        } else {
            if(statusBubble) statusBubble.style.display = 'none';
        }

        statFollowing.textContent = p.following || 0;
        statFollowers.textContent = p.followers || 0;
        statLikes.textContent = p.likes || 0;

        // Render Avatar
        if (p.avatar) {
            avatarImg.src = p.avatar;
            avatarImg.style.display = 'block';
            avatarIcon.style.display = 'none';
        } else {
            avatarImg.src = '';
            avatarImg.style.display = 'none';
            avatarIcon.style.display = 'block';
        }

        // Render initially with "videos" target for main profile
        const activeTab = document.querySelector('#tk-profile-tab .tk-ptab.active');
        const target = activeTab ? activeTab.getAttribute('data-target') : 'videos';
        renderGrid(target, document.getElementById('tk-profile-grid'), tkState.profile.posts || [], tkState.videos.filter(v => v.isLiked));
    };

    // Edit Status
    if (statusBubble) {
        statusBubble.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.showCustomModal) {
                window.showCustomModal({
                    title: '设置状态',
                    type: 'prompt',
                    placeholder: '输入你的当前状态...',
                    defaultValue: tkState.profile.status,
                    onConfirm: (val) => {
                        tkState.profile.status = val;
                        if (window.tkPersistState) window.tkPersistState();
                        window.tkRenderProfile();
                        if (window.tkRenderChat) window.tkRenderChat(); // update chat self item
                    }
                });
            } else {
                const ns = prompt('输入你的当前状态:', tkState.profile.status);
                if (ns !== null) {
                    tkState.profile.status = ns;
                    if (window.tkPersistState) window.tkPersistState();
                    window.tkRenderProfile();
                }
            }
        });
    }

    // Avatar Upload Logic
    if (avatarBtn && avatarUpload) {
        avatarBtn.addEventListener('click', (e) => {
            // Prevent opening upload if clicked on status bubble or plus icon
            if (e.target === statusBubble || e.target.closest('.tk-avatar-plus')) {
                // If plus clicked, also trigger upload
                if (e.target.closest('.tk-avatar-plus')) {
                    avatarUpload.click();
                }
                return;
            }
            avatarUpload.click();
        });

        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    tkState.profile.avatar = event.target.result;
                    // Also sync to main emulator user state if needed
                    if (window.userState) {
                        window.userState.avatarUrl = event.target.result;
                    }
                    if (window.tkPersistState) window.tkPersistState();
                    window.tkRenderProfile();
                    if (window.tkRenderChat) window.tkRenderChat();
                    window.showToast('头像已更新');
                };
                reader.readAsDataURL(file);
            }
            e.target.value = '';
        });
    }

    // Top Left Button -> Add Character / Import
    if (profileBackBtn) {
        profileBackBtn.addEventListener('click', () => {
            if (tkAppView) {
                window.closeView(tkAppView);
            }
        });
    }

    // --- Global Event Delegation for Edit Profile & Actions (Bulletproof) ---
    if (!window.tkProfileDelegationBound) {
        window.tkProfileDelegationBound = true;
        document.addEventListener('click', (e) => {
            // 点击空白处关闭各种 sheet
            const sheets = [
                'tk-edit-profile-sheet',
                'tk-upload-video-sheet',
                'tk-edit-char-sheet',
                'tk-create-action-sheet'
            ];
            sheets.forEach(id => {
                const sheet = document.getElementById(id);
                if (sheet && sheet.classList.contains('active')) {
                    if (e.target === sheet) {
                        window.closeView(sheet);
                    }
                }
            });

            // 1. Edit Profile Button
            if (e.target.closest('#tk-profile-edit-btn')) {
                try {
                    const p = tkState.profile;
                    const elName = document.getElementById('tk-edit-name');
                    if(elName) elName.value = p.name || '';
                    const elHandle = document.getElementById('tk-edit-handle');
                    if(elHandle) elHandle.value = p.handle || '';
                    const elBio = document.getElementById('tk-edit-bio');
                    if(elBio) elBio.value = p.bio || '';
                    const elPersona = document.getElementById('tk-edit-persona');
                    if(elPersona) elPersona.value = p.persona || '';
                    
                    const elFollowing = document.getElementById('tk-edit-following');
                    if(elFollowing) elFollowing.value = p.following || 0;
                    const elFollowers = document.getElementById('tk-edit-followers');
                    if(elFollowers) elFollowers.value = p.followers || 0;
                    const elLikes = document.getElementById('tk-edit-likes');
                    if(elLikes) elLikes.value = p.likes || 0;
                    
                    const sheet = document.getElementById('tk-edit-profile-sheet');
                    if(sheet) window.openView(sheet);
                    else if(window.showToast) window.showToast('无法找到编辑面板容器');
                } catch(err) {
                    console.error('打开编辑资料报错:', err);
                    if(window.showToast) window.showToast('打开编辑失败:' + err.message);
                }
            }
            
            // Save Profile Button
            if (e.target.closest('#tk-save-profile-btn')) {
                const elName = document.getElementById('tk-edit-name');
                const elHandle = document.getElementById('tk-edit-handle');
                const elBio = document.getElementById('tk-edit-bio');
                const elPersona = document.getElementById('tk-edit-persona');
                
                const elFollowing = document.getElementById('tk-edit-following');
                const elFollowers = document.getElementById('tk-edit-followers');
                const elLikes = document.getElementById('tk-edit-likes');
                
                tkState.profile.name = elName ? elName.value.trim() : 'User';
                tkState.profile.handle = elHandle ? elHandle.value.trim() : 'user123';
                tkState.profile.bio = elBio ? elBio.value.trim() : '';
                tkState.profile.persona = elPersona ? elPersona.value.trim() : '';
                
                if(elFollowing) tkState.profile.following = elFollowing.value || 0;
                if(elFollowers) tkState.profile.followers = elFollowers.value || 0;
                if(elLikes) tkState.profile.likes = elLikes.value || 0;

                if (window.userState) {
                    window.userState.name = tkState.profile.name;
                }

                if (window.tkPersistState) window.tkPersistState();
                window.tkRenderProfile();
                const sheet = document.getElementById('tk-edit-profile-sheet');
                if(sheet) window.closeView(sheet);
                window.showToast('资料已保存');
            }
            
            // 2. Profile Create Trigger (the little caret)
            if (e.target.closest('#tk-profile-tab .tk-btn-icon')) {
                const sheet = document.getElementById('tk-create-action-sheet');
                if (sheet && window.openView) window.openView(sheet);
            }
            
            // Open Upload Video Sheet Button
            if (e.target.closest('#tk-btn-open-upload-video')) {
                const createActionSheet = document.getElementById('tk-create-action-sheet');
                if(createActionSheet) window.closeView(createActionSheet);
                
                const descInput = document.getElementById('tk-upload-desc-input');
                const sceneInput = document.getElementById('tk-upload-scene-input');
                const coverImg = document.getElementById('tk-upload-cover-img');
                const coverBtn = document.getElementById('tk-upload-cover-btn');
                
                if(descInput) descInput.value = '';
                if(sceneInput) sceneInput.value = '';
                if(coverImg) {
                    coverImg.src = '';
                    coverImg.style.display = 'none';
                }
                if(coverBtn) {
                    const div = coverBtn.querySelector('div');
                    if(div) div.style.display = 'flex';
                }
                
                const sheet = document.getElementById('tk-upload-video-sheet');
                if(sheet) window.openView(sheet);
            }

            // Confirm Upload Button
            if (e.target.closest('#tk-confirm-upload-btn')) {
                const descInput = document.getElementById('tk-upload-desc-input');
                const sceneInput = document.getElementById('tk-upload-scene-input');
                const coverImg = document.getElementById('tk-upload-cover-img');
                
                const desc = descInput ? descInput.value.trim() : '';
                const scene = sceneInput ? sceneInput.value.trim() : '';
                const cover = coverImg ? coverImg.src : null;

                if (!tkState.profile.posts) tkState.profile.posts = [];
                
                const newPost = {
                    id: 'post_' + Date.now(),
                    desc: desc,
                    sceneText: scene,
                    cover: (coverImg && coverImg.style.display === 'block') ? cover : null,
                    likes: 0,
                    comments: []
                };
                
                tkState.profile.posts.unshift(newPost);
                if (window.tkPersistState) window.tkPersistState();
                window.tkRenderProfile();
                const sheet = document.getElementById('tk-upload-video-sheet');
                if(sheet) window.closeView(sheet);
                window.showToast('视频已发布');
            }
            
            // 3. Sub Profile Edit Trigger
            if (e.target.closest('#tk-sub-profile-edit-trigger')) {
                const charId = window.currentTkSubProfileCharId;
                if (charId) {
                    const title = document.getElementById('tk-char-sheet-title');
                    if (title) title.textContent = '编辑角色';
                    
                    const charNameInput = document.getElementById('tk-char-name');
                    const charStatusInput = document.getElementById('tk-char-status');
                    const charPersonaInput = document.getElementById('tk-char-persona');
                    const charBioInput = document.getElementById('tk-char-bio');
                    const charFollowingInput = document.getElementById('tk-char-following');
                    const charFollowersInput = document.getElementById('tk-char-followers');
                    const charLikesInput = document.getElementById('tk-char-likes');
                    const deleteCharBtn = document.getElementById('tk-delete-char-btn');
                    const charAvatarImg = document.getElementById('tk-char-avatar-img');
                    const charAvatarIcon = document.querySelector('#tk-char-avatar-preview i');
                    
                    const char = window.tkGetChar(charId);
                    if (char) {
                        if(charNameInput) charNameInput.value = char.name || '';
                        if(charStatusInput) charStatusInput.value = char.status || '';
                        if(charPersonaInput) charPersonaInput.value = char.persona || '';
                        if(charBioInput) charBioInput.value = char.bio || '';
                        if(charFollowingInput) charFollowingInput.value = char.following || 0;
                        if(charFollowersInput) charFollowersInput.value = char.followers || 0;
                        if(charLikesInput) charLikesInput.value = char.likes || 0;
                        if(deleteCharBtn) deleteCharBtn.style.display = 'block';
                        
                        if (char.avatar) {
                            if(charAvatarImg) { charAvatarImg.src = char.avatar; charAvatarImg.style.display = 'block'; }
                            if(charAvatarIcon) charAvatarIcon.style.display = 'none';
                        } else {
                            if(charAvatarImg) { charAvatarImg.src = ''; charAvatarImg.style.display = 'none'; }
                            if(charAvatarIcon) charAvatarIcon.style.display = 'block';
                        }
                    }
                    if (window.tkOpenEditChar) window.tkOpenEditChar(charId);
                    else {
                        const s = document.getElementById('tk-edit-char-sheet');
                        if(s) window.openView(s);
                    }
                }
            }
        });
    }

    // Message Button Logic (Placeholder)
    if (msgBtn) {
        msgBtn.addEventListener('click', () => {
            document.querySelector('.tk-bottom-nav .tk-nav-item[data-target="tk-chat-tab"]').click();
        });
    }

    // Grid Tabs Logic - Main Profile
    const mainProfileTabs = document.querySelectorAll('#tk-profile-tab .tk-ptab');
    const mainIndicator = document.querySelector('#tk-profile-tab .tk-ptab-indicator');
    const mainGridContainer = document.getElementById('tk-profile-grid');

    mainProfileTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            mainProfileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            mainIndicator.style.transform = `translateX(${index * 100}%)`;
            
            const target = tab.getAttribute('data-target');
            renderGrid(target, mainGridContainer, tkState.profile.posts || [], tkState.videos.filter(v => v.isLiked));
        });
    });

    // Grid Tabs Logic - Sub Profile
    const subProfileTabs = document.querySelectorAll('#tk-sub-profile-view .tk-ptab');
    const subIndicator = document.querySelector('#tk-sub-profile-view .tk-ptab-indicator');
    const subGridContainer = document.getElementById('tk-sub-profile-grid');

    subProfileTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            subProfileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            subIndicator.style.transform = `translateX(${index * 100}%)`;
            
            const target = tab.getAttribute('data-target');
            let charVideos = [];
            let likedVideos = [];
            if (currentSubCharId) {
                const char = window.tkGetChar(currentSubCharId);
                charVideos = tkState.videos.filter(v => v.authorId === currentSubCharId);
                if (char && char.likedVideoIds) {
                    likedVideos = tkState.videos.filter(v => char.likedVideoIds.includes(v.id));
                }
            }
            renderGrid(target, subGridContainer, charVideos, likedVideos);
        });
    });

    function renderGrid(target = 'videos', container, videosList = [], likedList = []) {
        if (!container) return;
        container.innerHTML = '';
        
        let items = [];
        if (target === 'videos') {
            items = videosList;
        } else if (target === 'liked') {
            items = likedList;
        }
        
        if (items.length === 0) {
            container.innerHTML = '<div style="grid-column: span 3; padding: 40px 0; text-align: center; color: #999; font-size: 13px;">暂无内容</div>';
            return;
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'tk-grid-item';
            
            if (item.cover || item.bgImage) {
                let imgUrl = item.cover ? item.cover : item.bgImage;
                el.innerHTML = `
                    <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="tk-grid-views" style="text-shadow: none;"><i class="fas fa-play" style="text-shadow: none;"></i> ${item.likes || Math.floor(Math.random()*1000)}</div>
                `;
            } else {
                let bgStyleStr = item.bgColor ? item.bgColor : '#ffffff';

                el.innerHTML = `
                    <div class="tk-grid-text" style="position: relative; left: 0; top: 0; transform: none; background: ${bgStyleStr}; color:#111111; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 8px; width: 100%; height: 100%; box-sizing: border-box; border: none; box-shadow: none !important; text-shadow: none;">
                        ${item.sceneText ? item.sceneText.substring(0, 15) + '...' : (item.desc ? item.desc.substring(0, 15) + '...' : '视频')}
                    </div>
                    <div class="tk-grid-views" style="color: #fff; text-shadow: none;"><i class="fas fa-play" style="text-shadow: none;"></i> ${item.likes || Math.floor(Math.random()*1000)}</div>
                `;
            }
            
            el.addEventListener('click', () => {
                if (window.tkOpenFullscreenVideo) {
                    window.tkOpenFullscreenVideo(item.id);
                } else {
                    console.error("tkOpenFullscreenVideo 不存在");
                    if (window.showToast) window.showToast('错误: 全屏视频组件未就绪');
                }
            });
            
            container.appendChild(el);
        });
    }

    // Upload Video Logic (Cover Button remaining functionality)
    const coverBtn = document.getElementById('tk-upload-cover-btn');
    const coverInput = document.getElementById('tk-upload-cover-input');
    const coverImg = document.getElementById('tk-upload-cover-img');

    if (coverBtn && coverInput) {
        coverBtn.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') coverInput.click();
        });
        
        coverInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (coverImg) {
                        coverImg.src = ev.target.result;
                        coverImg.style.display = 'block';
                    }
                    const div = coverBtn.querySelector('div');
                    if (div) div.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
            e.target.value = '';
        });
    }

    // 强行绑定编辑按钮，防止委托失效或者层级拦截
    setInterval(() => {
        const editBtn = document.getElementById('tk-profile-edit-btn');
        if (editBtn && !editBtn.dataset.forceBound) {
            editBtn.dataset.forceBound = "true";
            editBtn.onclick = (e) => {
                e.stopPropagation();
                try {
                    const p = tkState.profile;
                    const elName = document.getElementById('tk-edit-name');
                    if(elName) elName.value = p.name || '';
                    const elHandle = document.getElementById('tk-edit-handle');
                    if(elHandle) elHandle.value = p.handle || '';
                    const elBio = document.getElementById('tk-edit-bio');
                    if(elBio) elBio.value = p.bio || '';
                    const elPersona = document.getElementById('tk-edit-persona');
                    if(elPersona) elPersona.value = p.persona || '';
                    
                    const elFollowing = document.getElementById('tk-edit-following');
                    if(elFollowing) elFollowing.value = p.following || 0;
                    const elFollowers = document.getElementById('tk-edit-followers');
                    if(elFollowers) elFollowers.value = p.followers || 0;
                    const elLikes = document.getElementById('tk-edit-likes');
                    if(elLikes) elLikes.value = p.likes || 0;
                    
                    const sheet = document.getElementById('tk-edit-profile-sheet');
                    if(sheet) window.openView(sheet);
                } catch(err) {
                    console.error('打开编辑资料报错:', err);
                }
            };
        }
    }, 1000);

});
