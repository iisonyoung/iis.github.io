// ==========================================
// TIKTOK: 3. HOME TAB & VIDEO FEED
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const feedContainer = document.getElementById('tk-feed-container');
    const apiGenBtn = document.getElementById('tk-api-generate-btn');
    let currentEditingVideoId = null;

    // Custom Background Upload bindings
    const bgBtn = document.getElementById('tk-edit-video-bg-btn');
    const bgUpload = document.getElementById('tk-edit-video-bg-upload');
    const bgImg = document.getElementById('tk-edit-video-bg-img');

    if (bgBtn && bgUpload) {
        bgBtn.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') bgUpload.click();
        });
        bgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    bgImg.src = ev.target.result;
                    bgImg.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
            e.target.value = '';
        });
    }

    const resetBgBtn = document.getElementById('reset-tk-video-bg-btn');
    if (resetBgBtn) {
        resetBgBtn.addEventListener('click', () => {
            if (bgImg) {
                bgImg.src = '';
                bgImg.style.display = 'none';
            }
        });
    }

    const confirmEditVideoBtn = document.getElementById('tk-confirm-edit-video-btn');
    if (confirmEditVideoBtn) {
        confirmEditVideoBtn.addEventListener('click', () => {
            if (!currentEditingVideoId) return;
            
            // Allow editing videos from both global feed and user profile posts
            let targetVideo = null;
            if (window.findVideoGlobal) {
                const found = window.findVideoGlobal(currentEditingVideoId);
                if (found) targetVideo = found.video;
            } else {
                targetVideo = tkState.videos.find(v => v.id === currentEditingVideoId);
            }
            
            if (targetVideo) {
                // Determine if we should save to bgImage or cover based on original field (fallback to bgImage)
                if (targetVideo.cover !== undefined && targetVideo.cover !== null) {
                    targetVideo.cover = (bgImg && bgImg.style.display === 'block') ? bgImg.src : null;
                } else {
                    targetVideo.bgImage = (bgImg && bgImg.style.display === 'block') ? bgImg.src : null;
                }
                targetVideo.bgColor = null;
                targetVideo.desc = document.getElementById('tk-edit-video-desc-input').value.trim();
                targetVideo.sceneText = document.getElementById('tk-edit-video-scene-input').value.trim();
                
                if (window.tkPersistState) window.tkPersistState();
                window.tkRenderHome();
                if (window.tkRenderProfile) window.tkRenderProfile();
                
                // If currently viewing in fullscreen, update it
                const fsView = document.getElementById('tk-fullscreen-video-view');
                if (fsView && fsView.classList.contains('active') && fsView.dataset.videoId === targetVideo.id) {
                    window.tkOpenFullscreenVideo(targetVideo.id); // re-trigger to update DOM
                }
                
                window.closeView(document.getElementById('tk-edit-single-video-sheet'));
                window.showToast('已保存修改');
            }
        });
    }

    // Render Home Feed
    window.tkRenderHome = function() {
        if (!feedContainer) return;
        
        // Determine active tab
        const activeTabEl = document.querySelector('.tk-topbar-tab.active');
        const isActiveTabFollowing = activeTabEl && activeTabEl.textContent === '关注';
        
        // Filter videos based on tab
        let displayVideos = [];
        if (isActiveTabFollowing) {
            displayVideos = tkState.videos.filter(v => {
                const char = window.tkGetChar(v.authorId);
                return char && char.isFollowed;
            });
        } else {
            // "推荐" tab - 过滤掉已关注的视频，只显示未关注的或系统的
            displayVideos = tkState.videos.filter(v => {
                const char = window.tkGetChar(v.authorId);
                return !char || !char.isFollowed;
            });
        }
        
        // Render videos
        feedContainer.innerHTML = '';
        
        if (displayVideos.length === 0) {
            if (isActiveTabFollowing) {
                feedContainer.innerHTML = '<div class="tk-empty-feed"><p style="color: #999; font-size: 14px;">暂无关注的内容，快去探索吧</p></div>';
            } else {
                feedContainer.innerHTML = `
                    <div class="tk-empty-feed">
                        <div class="tk-magic-btn-large" id="tk-api-generate-btn-empty" onclick="window.tkTriggerApiGenerate(event)">
                            <i class="fas fa-magic"></i>
                            <span>生成内容</span>
                        </div>
                        <p style="color: #999; font-size: 13px; margin-top: 10px;">点击魔法棒生成 TikTok 视频流</p>
                    </div>
                `;
            }
            return;
        }
        
        displayVideos.forEach((video, index) => {
            const char = window.tkGetChar(video.authorId);
            const isFollowed = char ? char.isFollowed : false;
            const authorName = char ? (char.name || char.handle) : video.authorName;
            const avatarHtml = (char && char.avatar) 
                ? `<img src="${char.avatar}">` 
                : (video.authorAvatar ? `<img src="${video.authorAvatar}">` : `<i class="fas fa-user"></i>`);

            // Format hashtags in description
            let formattedDesc = video.desc || '';
            formattedDesc = formattedDesc.replace(/#([\w\u4e00-\u9fa5]+)/g, '<span class="tk-hashtag" onclick="window.tkOpenHashtag(\'$1\', event)">#$1</span>');

            const card = document.createElement('div');
            card.className = 'tk-video-card';
            card.dataset.videoId = video.id; // Store ID for retrieving current video later
            
            let bgStyleStr = 'background: #ffffff;';
            let cardContentHtml = '';
            
            // 独立背景区域：固定 4:3 (或 3:4) 宽高比例居中，稍微上移避免和底部名字重叠 (top: 45%)
            if (video.cover || video.bgImage) {
                let imgUrl = video.cover ? video.cover : video.bgImage;
                cardContentHtml += `
                    <div style="width: 100%; aspect-ratio: 3/4; position: absolute; top: 45%; transform: translateY(-50%); display: flex; justify-content: center; align-items: center; overflow: hidden;">
                        <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                `;
            } else if (video.bgColor) {
                cardContentHtml += `
                    <div style="width: 100%; aspect-ratio: 3/4; background: ${video.bgColor}; position: absolute; top: 45%; transform: translateY(-50%);"></div>
                `;
            }

            // 独立气泡区域：悬浮其上，大小自适应文本内容，不全屏
            if (video.sceneText) {
                let textContainerBg = '#111111';
                if (video.cover || video.bgImage) {
                    textContainerBg = 'rgba(17,17,17,0.8)';
                } else if (video.bgColor) {
                    textContainerBg = '#111111';
                }

                cardContentHtml += `
                    <div style="background: ${textContainerBg}; color: #ffffff; padding: 20px 24px; border-radius: 20px; max-width: 85%; margin: 0 auto; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 16px; line-height: 1.6; word-break: break-word; font-weight: 500; position: relative; z-index: 2; transform: translateY(-5vh);">
                        ${video.sceneText}
                    </div>
                `;
            } else if (!video.cover && !video.bgImage && !video.bgColor) {
                // 什么都没有的空视频保底
                cardContentHtml += `
                    <div style="background: #111111; color: #ffffff; padding: 20px 24px; border-radius: 20px; max-width: 85%; margin: 0 auto; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 16px; line-height: 1.6; word-break: break-word; font-weight: 500; position: relative; z-index: 2; transform: translateY(-5vh);">
                        暂无内容
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="tk-video-text-content" style="${bgStyleStr} display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; position: relative;">
                    ${cardContentHtml}
                </div>

                <div class="tk-right-actions">
                    <div class="tk-avatar-action" onclick="window.tkHandleProfileClick('${video.authorId}', event)">
                        ${avatarHtml}
                        <div class="tk-action-plus ${isFollowed ? 'followed' : ''}" onclick="window.tkHandleFollow('${video.authorId}', event)">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                    
                    <div class="tk-action-item ${video.isLiked ? 'liked' : ''}" onclick="window.tkHandleLike('${video.id}', this, event)">
                        <i class="fas fa-heart"></i>
                        <span>${video.likes || 0}</span>
                    </div>
                    
                    <div class="tk-action-item" onclick="window.tkOpenComments('${video.id}', event)">
                        <i class="fas fa-comment-dots"></i>
                        <span>${video.commentsCount || 0}</span>
                    </div>
                    
            <div class="tk-action-item" onclick="window.tkOpenShare('${video.id}', event)">
                <i class="fas fa-share" style="transform: scaleX(-1);"></i>
                <span id="share-count-${video.id}">${video.shares || 0}</span>
            </div>

                    <div class="tk-music-disc" onclick="window.tkOpenMusic(event)">
                        <i class="fas fa-music"></i>
                    </div>
                </div>

                <div class="tk-bottom-info">
                    <div class="tk-video-author">@${authorName}</div>
                    <div class="tk-video-desc">${formattedDesc}</div>
                </div>
            `;
            feedContainer.appendChild(card);
        });
    };

    // Make sure fullscreen music icon also opens music view
    setTimeout(() => {
        const fsMusicDisc = document.querySelector('#tk-fullscreen-video-view .tk-music-disc');
        if (fsMusicDisc) {
            const newDisc = fsMusicDisc.cloneNode(true);
            fsMusicDisc.parentNode.replaceChild(newDisc, fsMusicDisc);
            newDisc.addEventListener('click', (e) => window.tkOpenMusic(e));
        }
    }, 500);

    // Fullscreen Custom Video Player Logic
    const fsView = document.getElementById('tk-fullscreen-video-view');
    const backBtn = document.getElementById('tk-fs-video-back-btn');
    const magicBtn = document.getElementById('tk-fs-video-magic-btn');
    
    if (backBtn && fsView) {
        backBtn.addEventListener('click', () => {
            fsView.classList.remove('active');
            const coverEl = document.getElementById('tk-fs-video-cover');
            if (coverEl) coverEl.style.display = 'block'; // Reset
            document.getElementById('tk-fs-video-container').style.background = 'transparent';
        });
    }

    // Expose Helper to find video anywhere so other scripts can use it if needed
    window.findVideoGlobal = function(videoId) {
        let video = null;
        let author = null;
        let isUser = false;

        // 1. 尝试在用户自建的 posts 列表中查找
        if (tkState.profile && tkState.profile.posts) {
            video = tkState.profile.posts.find(v => v.id === videoId);
            if (video) {
                author = tkState.profile;
                isUser = true;
            }
        }

        // 2. 尝试在全局视频流中查找
        if (!video && tkState.videos) {
            video = tkState.videos.find(v => v.id === videoId);
            if (video) {
                author = window.tkGetChar(video.authorId);
                // 可能是 user 的点赞视频
                if (!author && video.authorId && video.authorId.startsWith('user_')) {
                    author = {
                        handle: video.authorName || 'user',
                        persona: '一个未知的 TikTok 用户',
                        avatar: video.authorAvatar
                    };
                } else if (!author) {
                    // Fallback for missing characters or weird data
                    author = {
                        handle: video.authorName || 'unknown',
                        persona: '未知用户',
                        avatar: video.authorAvatar || null
                    };
                }
            }
        }

        return { video, author, isUser };
    };

    // Global variable for sharing
    window.currentShareVideoId = null;

    // Attach fsShareBtn once globally
    setTimeout(() => {
        const fsAvatarBtn = document.querySelector('#tk-fullscreen-video-view .tk-avatar-action');
        if (fsAvatarBtn && !fsAvatarBtn.dataset.bound) {
            fsAvatarBtn.dataset.bound = "true";
            fsAvatarBtn.addEventListener('click', (e) => {
                const vid = document.getElementById('tk-fullscreen-video-view').dataset.videoId;
                if (vid) {
                    const { video } = window.findVideoGlobal(vid);
                    if (video && window.tkHandleProfileClick) {
                        window.tkHandleProfileClick(video.authorId, e);
                    }
                }
            });
        }

        const fsShareBtn = document.getElementById('tk-fs-video-share-btn');
        if (fsShareBtn && !fsShareBtn.dataset.bound) {
            fsShareBtn.dataset.bound = "true";
            fsShareBtn.addEventListener('click', (e) => {
                const vid = document.getElementById('tk-fullscreen-video-view').dataset.videoId;
                if (window.tkOpenShare && vid) window.tkOpenShare(vid, e);
            });
        }

        // Connect Comments button inside custom video player once globally
        const fsCommentBtn = document.getElementById('tk-fs-video-comment-btn');
        if (fsCommentBtn && !fsCommentBtn.dataset.bound) {
            fsCommentBtn.dataset.bound = "true";
            fsCommentBtn.addEventListener('click', (e) => {
                const vid = document.getElementById('tk-fullscreen-video-view').dataset.videoId;
                if (window.tkOpenComments && vid) {
                    // Update tkState.videos if it's a user post before opening
                    const { video, isUser } = window.findVideoGlobal(vid);
                    if (video && isUser) {
                        const existing = tkState.videos.find(v => v.id === video.id);
                        if (!existing) {
                            tkState.videos.push({
                                id: video.id,
                                comments: video.comments || [],
                                commentsCount: video.comments ? video.comments.length : 0
                            });
                        } else {
                            existing.comments = video.comments;
                            existing.commentsCount = video.comments ? video.comments.length : 0;
                        }
                    }
                    window.tkOpenComments(vid, e);
                }
            });
        }

        // Connect Like button inside custom video player once globally
        const fsLikeBtn = document.getElementById('tk-fs-video-like-btn');
        if (fsLikeBtn && !fsLikeBtn.dataset.bound) {
            fsLikeBtn.dataset.bound = "true";
            fsLikeBtn.addEventListener('click', (e) => {
                const vid = document.getElementById('tk-fullscreen-video-view').dataset.videoId;
                if (window.tkHandleLike && vid) {
                    window.tkHandleLike(vid, fsLikeBtn, e);
                }
            });
        }
    }, 500);

    // Handle share actions via global function
    window.tkHandleShareAction = function(action) {
        const sheetOverlay = document.getElementById('tk-share-sheet');
        window.closeView(sheetOverlay);
        
        if (!window.currentShareVideoId) return;
        const { video } = window.findVideoGlobal(window.currentShareVideoId);
        if (!video) return;

        if (action === 'save') {
            video.isSaved = !video.isSaved;
            if (window.tkPersistState) window.tkPersistState();
            window.showToast(video.isSaved ? '已收藏' : '已取消收藏');
        } else if (action === 'edit') {
            currentEditingVideoId = window.currentShareVideoId;
            const bgImgEl = document.getElementById('tk-edit-video-bg-img');
            if (bgImgEl) {
                // 回显背景，包括用户发布时使用的 cover
                const editBg = video.bgImage || video.cover;
                if (editBg) {
                    bgImgEl.src = editBg;
                    bgImgEl.style.display = 'block';
                } else {
                    bgImgEl.src = '';
                    bgImgEl.style.display = 'none';
                }
            }
            const descInput = document.getElementById('tk-edit-video-desc-input');
            if(descInput) descInput.value = video.desc || '';
            
            const sceneInput = document.getElementById('tk-edit-video-scene-input');
            if(sceneInput) sceneInput.value = video.sceneText || '';
            
            window.openView(document.getElementById('tk-edit-single-video-sheet'));
        } else if (action === 'delete') {
            if (confirm('确定要彻底删除这个视频吗？')) {
                const vId = window.currentShareVideoId;
                tkState.videos = tkState.videos.filter(v => v.id !== vId);
                if (tkState.profile && tkState.profile.posts) {
                    tkState.profile.posts = tkState.profile.posts.filter(v => v.id !== vId);
                }
                tkState.chars.forEach(c => {
                    if (c.likedVideoIds) {
                        c.likedVideoIds = c.likedVideoIds.filter(id => id !== vId);
                    }
                });
                if (window.tkPersistState) window.tkPersistState();
                window.tkRenderHome();
                if (window.tkRenderProfile) window.tkRenderProfile();
                
                const fsView = document.getElementById('tk-fullscreen-video-view');
                if (fsView && fsView.classList.contains('active') && fsView.dataset.videoId === vId) {
                    fsView.classList.remove('active');
                }
                window.showToast('已删除');
            }
        }
    };

    window.tkOpenFullscreenVideo = function(videoId) {
        let { video, author, isUser } = window.findVideoGlobal(videoId);
        
        if (!video) {
            console.error("tkOpenFullscreenVideo: Video not found for id", videoId);
            if (window.showToast) window.showToast('无法加载该视频');
            return;
        }
        
        if (!author) {
            author = { handle: 'unknown', avatar: null };
        }
        
        if (!fsView) {
            console.error("tkOpenFullscreenVideo: fsView not found");
            if (window.showToast) window.showToast('错误: 全屏视频容器未加载');
            return;
        }

        try {
            const coverEl = document.getElementById('tk-fs-video-cover');
            const fsVideoContainer = document.getElementById('tk-fs-video-container');
            
            if (fsVideoContainer) {
                let textBubble = document.getElementById('tk-fs-video-text-bubble');
                if (!textBubble) {
                    textBubble = document.createElement('div');
                    textBubble.id = 'tk-fs-video-text-bubble';
                    textBubble.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; width: 100%; display: flex; justify-content: center; align-items: center;';
                    fsVideoContainer.insertBefore(textBubble, fsVideoContainer.firstChild); // 放在容器里，垫在控件下面
                }

                if (coverEl) {
                    coverEl.style.objectFit = 'contain';
                    coverEl.style.boxShadow = 'none';
                }

                if (video.cover) {
                    if (coverEl) {
                        coverEl.src = video.cover;
                        coverEl.style.display = 'block';
                    }
                    fsVideoContainer.style.background = '#ffffff';
                    textBubble.innerHTML = '';
                    textBubble.style.display = 'none';
                } else {
                    if (coverEl) {
                        // Using cover element to display the background image, just like the actual cover
                        if (video.bgImage) {
                            coverEl.src = video.bgImage;
                            coverEl.style.display = 'block';
                        } else {
                            coverEl.style.display = 'none';
                        }
                    }
                    
                    // Fullscreen container is always white, to support "no background places are white"
                    fsVideoContainer.style.background = '#ffffff';
                    
                    // Inject text bubble (without destroying the entire container!)
                    if (video.sceneText) {
                        if (video.bgImage) {
                            textBubble.innerHTML = `
                                <div style="background: rgba(17,17,17,0.8); color: #ffffff; padding: 20px 24px; border-radius: 20px; max-width: 85%; margin: 0 auto; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 16px; line-height: 1.6; word-break: break-word; font-weight: 500; transform: translateY(-5vh);">
                                    ${video.sceneText}
                                </div>
                            `;
                        } else {
                            let textContainerBg = video.bgColor ? video.bgColor : '#111111';
                            textBubble.innerHTML = `
                                <div style="background: ${textContainerBg}; color: #ffffff; padding: 20px 24px; border-radius: 20px; max-width: 85%; margin: 0 auto; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 16px; line-height: 1.6; word-break: break-word; font-weight: 500; transform: translateY(-5vh);">
                                    ${video.sceneText}
                                </div>
                            `;
                        }
                        textBubble.style.display = 'flex';
                        textBubble.style.justifyContent = 'center';
                        textBubble.style.alignItems = 'center';
                        textBubble.style.width = '100%';
                        textBubble.style.height = '100%';
                    } else {
                        textBubble.innerHTML = '';
                        textBubble.style.display = 'none';
                    }
                }
            }
            
            const descText = video.desc ? video.desc : (video.sceneText || '');
            const descEl = document.getElementById('tk-fs-video-desc');
            if (descEl) {
                descEl.textContent = descText;
                descEl.style.color = '#111111'; // Set to black
            }
            
            const authorEl = document.getElementById('tk-fs-video-author');
            if (authorEl) {
                authorEl.textContent = '@' + (author.handle || author.id || 'user');
                authorEl.style.color = '#111111'; // Set to black
            }
            
            const avatarEl = document.getElementById('tk-fs-video-avatar');
            const iconEl = document.getElementById('tk-fs-video-avatar-icon');
            if (author.avatar) {
                if (avatarEl) { avatarEl.src = author.avatar; avatarEl.style.display = 'block'; }
                if (iconEl) iconEl.style.display = 'none';
            } else {
                if (avatarEl) avatarEl.style.display = 'none';
                if (iconEl) iconEl.style.display = 'block';
            }

            const likesEl = document.getElementById('tk-fs-video-likes');
            if (likesEl) likesEl.textContent = video.likes || 0;
            
            // Update icons color to black in JS just in case CSS misses it
            const fsRightActions = document.querySelectorAll('#tk-fullscreen-video-view .tk-action-item i, #tk-fullscreen-video-view .tk-action-item span');
            fsRightActions.forEach(el => {
                if(el.tagName === 'SPAN' || !el.parentElement.classList.contains('liked')) {
                    el.style.color = '#111111';
                    el.style.textShadow = 'none';
                }
            });

            // Set initial like state
            const fsLikeBtn = document.getElementById('tk-fs-video-like-btn');
            if (fsLikeBtn) {
                if (video.isLiked) {
                    fsLikeBtn.classList.add('liked');
                    const i = fsLikeBtn.querySelector('i');
                    if(i) i.style.color = '#ff4b4b'; // Keep red for liked
                } else {
                    fsLikeBtn.classList.remove('liked');
                    const i = fsLikeBtn.querySelector('i');
                    if(i) i.style.color = '#111111';
                }
            }
            
            const commentsEl = document.getElementById('tk-fs-video-comments');
            if (commentsEl) commentsEl.textContent = video.comments ? video.comments.length : (video.commentsCount || 0);

            fsView.dataset.videoId = videoId;
            fsView.classList.add('active');
            
        } catch(e) {
            console.error("tkOpenFullscreenVideo DOM报错:", e);
            if(window.showToast) window.showToast('打开视频失败: ' + e.message);
        }
    };

    if (magicBtn) {
        magicBtn.addEventListener('click', async () => {
            const videoId = fsView.dataset.videoId;
            const { video, author, isUser } = window.findVideoGlobal(videoId);
            if (!video) return;

            if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
                window.showToast('请在系统设置中配置 API');
                return;
            }

            window.showToast('AI 正在生成互动数据...');

            let followedCharsContext = '';
            if (isUser && tkState && tkState.chars) {
                const friends = tkState.chars.filter(c => c.isFollowed).slice(0, 3);
                if (friends.length > 0) {
                    followedCharsContext = "\n博主(User)有以下几个已关注的好友（你可以安排他们中的1-2个来评论）：\n" + 
                        friends.map(c => `- CharID: ${c.id}, 名字: ${c.name}, 人设: ${c.persona}`).join('\n') +
                        "\n如果使用了好友的评论，请把他们的 CharID 填在 authorId 字段中，名字填在 authorName 字段。";
                }
            }

            const prompt = `
你现在是一个 TikTok 互动模拟器。
用户（也就是发视频的博主）的人设是：${author.persona || '普通人'}
刚发布的视频内容或背景描述是：${video.scene || video.desc || video.sceneText || '一段有趣的日常视频'}
${followedCharsContext}

请为这个视频生成一些观众的互动数据。评论要具有活人感、网感，如果是朋友的评论要符合朋友的人设语气。
要求返回严格的 JSON 格式（不要有多余文字或 markdown），格式如下：
{
  "newLikes": 850,
  "newComments": [
    { "authorId": "可能的话填入好友的CharID，否则留空", "authorName": "观众A或好友名字", "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=123", "text": "太有趣了吧！" }
  ]
}
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
                            { role: 'system', content: 'You are a JSON generator.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: parseFloat(window.apiConfig.temperature) || 0.8
                    })
                });

                if (!response.ok) throw new Error('API Error');
                
                const data = await response.json();
                let aiReply = data.choices[0].message.content;
                aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
                
                const parsed = JSON.parse(aiReply);
                
                video.likes = (video.likes || 0) + (parsed.newLikes || Math.floor(Math.random()*500));
                
                if (!video.comments) video.comments = [];
                if (parsed.newComments && Array.isArray(parsed.newComments)) {
                    parsed.newComments.forEach(c => {
                        let finalAvatar = c.authorAvatar || null;
                        if (c.authorId) {
                            const char = window.tkGetChar(c.authorId);
                            if (char && char.avatar) finalAvatar = char.avatar;
                        }
                        
                        video.comments.unshift({
                            id: 'cmt_' + Date.now() + Math.random(),
                            authorId: c.authorId || null,
                            authorName: c.authorName || 'User',
                            authorAvatar: finalAvatar,
                            text: c.text,
                            likes: Math.floor(Math.random()*50)
                        });
                    });
                }
                video.commentsCount = video.comments.length;
                
                if (window.tkPersistState) window.tkPersistState();
                
                // Refresh UI
                document.getElementById('tk-fs-video-likes').textContent = video.likes;
                document.getElementById('tk-fs-video-comments').textContent = video.comments.length;
                window.showToast('互动数据生成完毕！');

                // If on main profile grid, re-render
                if (window.tkRenderProfile) window.tkRenderProfile();

            } catch (err) {
                console.error(err);
                window.showToast('生成互动失败，请检查 API');
            }
        });
    }

    // Global Handlers for DOM inline events
    window.tkHandleProfileClick = function(authorId, e) {
        e.stopPropagation();
        const char = window.tkGetChar(authorId);
        if (char) {
            if (window.tkOpenSubProfile) {
                window.tkOpenSubProfile(authorId);
            }
        } else {
            // Auto create basic char if not exists so we can view profile
            const video = tkState.videos.find(v => v.authorId === authorId);
            if (video) {
                window.tkSaveChar({
                    id: authorId,
                    name: video.authorName,
                    handle: authorId,
                    avatar: video.authorAvatar || null,
                    status: '',
                    persona: '谢谢你的关注',
                    isFollowed: false
                });
                if (window.tkOpenSubProfile) {
                    window.tkOpenSubProfile(authorId);
                }
            }
        }
    };

    window.tkHandleFollow = function(authorId, e) {
        e.stopPropagation();
        const char = window.tkGetChar(authorId);
        if (char && !char.isFollowed) {
            char.isFollowed = true;
            if (window.tkPersistState) window.tkPersistState();
            window.tkRenderHome();
            if (window.tkRenderChat) window.tkRenderChat(); // Update following bar
            window.showToast('已关注');
        } else if (!char) {
            // Auto create char if not exists
            const video = tkState.videos.find(v => v.authorId === authorId);
            if (video) {
                window.tkSaveChar({
                    id: authorId,
                    name: video.authorName,
                    handle: authorId,
                    avatar: video.authorAvatar || null,
                    status: '刚刚发布了视频',
                    persona: '谢谢你的关注',
                    isFollowed: true
                });
                window.tkRenderHome();
                if (window.tkRenderChat) window.tkRenderChat();
                window.showToast('已关注');
            }
        }
    };

    window.tkHandleLike = function(videoId, el, e) {
        e.stopPropagation();
        const video = tkState.videos.find(v => v.id === videoId);
        if (video) {
            video.isLiked = !video.isLiked;
            video.likes += video.isLiked ? 1 : -1;
            if (window.tkPersistState) window.tkPersistState();
            
            if (video.isLiked) {
                el.classList.add('liked');
            } else {
                el.classList.remove('liked');
            }
            el.querySelector('span').textContent = video.likes;
        }
    };

    let currentCommentVideoId = null;
    let currentReplyToCommentId = null; // Store parent comment ID if replying

    function renderCommentsList(video) {
        const list = document.getElementById('tk-comments-list');
        const title = document.getElementById('tk-comments-title');
        if (!list || !title) return;

        let totalComments = video.comments ? video.comments.length : 0;
        // Also count replies roughly
        if (video.comments) {
            video.comments.forEach(c => {
                if(c.replies) totalComments += c.replies.length;
            });
        }

        title.textContent = `评论 (${totalComments})`;
        list.innerHTML = '';

        if (video.comments && video.comments.length > 0) {
            video.comments.forEach((c, index) => {
                // Ensure ID exists
                if(!c.id) c.id = 'cmt_' + Date.now() + '_' + index;
                const authorId = c.authorId || `commenter_${Math.floor(Math.random()*1000)}`;
                const authorName = c.authorName || 'User';
                const avatarHtml = c.authorAvatar 
                    ? `<img src="${c.authorAvatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
                    : `<i class="fas fa-user"></i>`;
                
                const item = document.createElement('div');
                item.className = 'tk-comment-item';
                item.innerHTML = `
                    <div class="tk-avatar-small" onclick="window.tkOpenCommentUserModal('${authorId}', '${authorName}', event)" style="cursor:pointer;">${avatarHtml}</div>
                    <div class="tk-comment-content" style="cursor:pointer;">
                        <div class="tk-comment-name" onclick="window.tkOpenCommentUserModal('${authorId}', '${authorName}', event); event.stopPropagation();" style="cursor:pointer;">${authorName}</div>
                        <div class="tk-comment-text" onclick="window.tkReplyToComment('${c.id}', '${authorName}', event)">${c.text}</div>
                        <div class="tk-comment-meta">
                            <span>刚刚</span>
                            <span onclick="window.tkReplyToComment('${c.id}', '${authorName}', event)">回复</span>
                        </div>
                        
                        <!-- Replies Container -->
                        <div class="tk-comment-replies" id="replies-${c.id}" style="margin-top: 10px; display: none;">
                        </div>
                        
                        ${c.replies && c.replies.length > 0 ? `
                        <div class="tk-comment-expand" onclick="window.tkToggleReplies('${c.id}', event)" style="font-size: 12px; color: #888; margin-top: 8px; font-weight: 500;">
                            <span id="expand-text-${c.id}">展开 ${c.replies.length} 条回复 <i class="fas fa-chevron-down" style="font-size:10px;"></i></span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="tk-comment-like ${c.isLiked ? 'liked' : ''}" onclick="window.tkToggleCommentLike('${video.id}', '${c.id}', this, event)">
                        <i class="fas fa-heart"></i>
                        <span>${c.likes || 0}</span>
                    </div>
                `;
                list.appendChild(item);

                // Render replies if they exist
                if (c.replies && c.replies.length > 0) {
                    const repliesContainer = item.querySelector(`#replies-${c.id}`);
                    c.replies.forEach(reply => {
                        const rItem = document.createElement('div');
                        rItem.style.display = 'flex';
                        rItem.style.gap = '10px';
                        rItem.style.marginBottom = '12px';
                        
                        const rName = reply.authorName || 'User';
                        const rAvatarHtml = reply.authorAvatar 
                            ? `<img src="${reply.authorAvatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
                            : `<i class="fas fa-user"></i>`;
                        const rText = reply.text;
                        
                        rItem.innerHTML = `
                            <div class="tk-avatar-small" style="width: 24px; height: 24px; font-size: 12px;">${rAvatarHtml}</div>
                            <div style="flex:1;">
                                <div style="font-size:12px; color:#888; font-weight:500; margin-bottom:2px;">${rName}</div>
                                <div style="font-size:13px; color:#111; line-height:1.4;">${rText}</div>
                            </div>
                        `;
                        repliesContainer.appendChild(rItem);
                    });
                }
            });
        } else {
            list.innerHTML = '<div style="text-align:center; padding: 40px; color: #999; font-size: 13px;">暂无评论，快来抢沙发吧</div>';
        }
    }

    window.tkOpenComments = function(videoId, e) {
        if(e) e.stopPropagation();
        currentCommentVideoId = videoId;
        currentReplyToCommentId = null; // reset
        
        const video = tkState.videos.find(v => v.id === videoId);
        if (!video) return;

        const sheetOverlay = document.getElementById('tk-video-detail-sheet');
        if (!sheetOverlay) return;

        // Render list
        renderCommentsList(video);

        // Reset input
        const inputEl = sheetOverlay.querySelector('#tk-comment-input');
        if (inputEl) {
            inputEl.value = '';
            inputEl.placeholder = '留下你的精彩评论';
        }

        window.openView(sheetOverlay);

        // Setup blanket close once
        if (!sheetOverlay.dataset.boundClose) {
            sheetOverlay.dataset.boundClose = "true";
            sheetOverlay.addEventListener('click', (e) => {
                if (e.target === sheetOverlay) {
                    window.closeView(sheetOverlay);
                    currentCommentVideoId = null;
                }
            });
        }

        const sendBtn = sheetOverlay.querySelector('#tk-comment-send-btn');
        const newInputEl = sheetOverlay.querySelector('#tk-comment-input');
        
        if (sendBtn && newInputEl) {
            // Unbind old events to prevent duplicate sends by cloning btn or setting a new reference
            const newSendBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
            const sendBtnRef = newSendBtn;

            const sendComment = () => {
                const text = newInputEl.value.trim();
                if(!text) return;

                const vid = tkState.videos.find(v => v.id === currentCommentVideoId);
                if (!vid) return;

                if (!vid.comments) vid.comments = [];

                if (currentReplyToCommentId) {
                    // It's a reply
                    const parentCmt = vid.comments.find(c => c.id === currentReplyToCommentId);
                    if (parentCmt) {
                        if (!parentCmt.replies) parentCmt.replies = [];
                        parentCmt.replies.push({
                            authorName: window.userState ? window.userState.name : '我',
                            authorAvatar: (tkState.profile && tkState.profile.avatar) ? tkState.profile.avatar : null,
                            text: text,
                            likes: 0
                        });
                        // Auto expand parent
                        setTimeout(() => {
                            const repliesContainer = document.getElementById(`replies-${currentReplyToCommentId}`);
                            if(repliesContainer) {
                                repliesContainer.style.display = 'block';
                                const expandText = document.getElementById(`expand-text-${currentReplyToCommentId}`);
                                if (expandText) {
                                    expandText.innerHTML = `收起 <i class="fas fa-chevron-up" style="font-size:10px;"></i>`;
                                }
                            }
                        }, 50);
                    }
                } else {
                    // It's a root comment
                    vid.comments.unshift({
                        id: 'cmt_' + Date.now(),
                        authorName: window.userState ? window.userState.name : '我',
                        authorAvatar: (tkState.profile && tkState.profile.avatar) ? tkState.profile.avatar : null,
                        text: text,
                        likes: 0,
                        replies: []
                    });
                }
                
                vid.commentsCount = (vid.commentsCount || 0) + 1;
                if (window.tkPersistState) window.tkPersistState();
                
                // Re-render
                renderCommentsList(vid);
                window.tkRenderHome(); // update count on home feed

                newInputEl.value = '';
                newInputEl.placeholder = '留下你的精彩评论';
                currentReplyToCommentId = null; // reset reply target after send
                window.showToast('评论已发送');
            };

            sendBtnRef.addEventListener('click', sendComment);
            // We use keyup directly on inputEl (no clone here, just bind once, but since it accumulates we must clean it)
            // A better way is inline or named function. For now, since input gets typed, cloning input is bad (loses focus).
            // Let's rely on just button click for simplicity to avoid memory leaks, or attach onkeydown safely:
            newInputEl.onkeypress = (e) => {
                if (e.key === 'Enter') sendComment();
            };
        }
    };

    window.tkReplyToComment = function(commentId, authorName, e) {
        if(e) e.stopPropagation();
        currentReplyToCommentId = commentId;
        const inputEl = document.getElementById('tk-comment-input');
        if(inputEl) {
            inputEl.placeholder = `回复 @${authorName}`;
            // If they already started typing, maybe prepend @, but cleaner to just use placeholder to indicate reply target.
            // If they explicitly want text: inputEl.value = `@${authorName} `;
            inputEl.value = `@${authorName} `;
            inputEl.focus();
        }
    };

    window.tkToggleCommentLike = function(videoId, commentId, el, e) {
        if(e) e.stopPropagation();
        const video = tkState.videos.find(v => v.id === videoId);
        if (!video || !video.comments) return;
        
        const cmt = video.comments.find(c => c.id === commentId);
        if (cmt) {
            cmt.isLiked = !cmt.isLiked;
            cmt.likes = (cmt.likes || 0) + (cmt.isLiked ? 1 : -1);
            if (window.tkPersistState) window.tkPersistState();
            
            if (cmt.isLiked) {
                el.classList.add('liked');
            } else {
                el.classList.remove('liked');
            }
            el.querySelector('span').textContent = cmt.likes;
        }
    };

    window.tkToggleReplies = function(commentId, e) {
        if(e) e.stopPropagation();
        const container = document.getElementById(`replies-${commentId}`);
        const expandText = document.getElementById(`expand-text-${commentId}`);
        if (!container || !expandText) return;

        if (container.style.display === 'none') {
            container.style.display = 'block';
            expandText.innerHTML = `收起 <i class="fas fa-chevron-up" style="font-size:10px;"></i>`;
        } else {
            container.style.display = 'none';
            // Count replies roughly
            const count = container.children.length;
            expandText.innerHTML = `展开 ${count} 条回复 <i class="fas fa-chevron-down" style="font-size:10px;"></i>`;
        }
    };
    
    // Share functionality
    window.tkOpenShare = function(videoId, e) {
        if(e) e.stopPropagation();
        window.currentShareVideoId = videoId;
        const shareSheet = document.getElementById('tk-share-sheet');
        const shareList = document.getElementById('tk-share-list');
        if (!shareSheet || !shareList) return;

        // Inject friends into share list
        shareList.innerHTML = '';
        const followedChars = tkState.chars.filter(c => c.isFollowed);
        if (followedChars.length === 0) {
            shareList.innerHTML = '<div style="padding: 10px 15px; color: #999; font-size: 13px;">暂无好友可转发</div>';
        } else {
            followedChars.forEach(char => {
                const item = document.createElement('div');
                item.className = 'tk-share-friend-item';
                
                const avatarHtml = char.avatar 
                    ? `<img src="${char.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
                    : `<i class="fas fa-user"></i>`;
                
                item.innerHTML = `
                    <div class="tk-avatar-small" style="width: 48px; height: 48px;">${avatarHtml}</div>
                    <span style="font-size: 11px; color: #555; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${char.name || char.handle}</span>
                `;
                
                item.addEventListener('click', () => {
                    window.showToast('已转发给 ' + (char.name || char.handle));
                    window.closeView(document.getElementById('tk-share-sheet'));
                    
                    // Add mock message to DM with sharedVideoId
                    let dm = tkState.dms.find(d => d.charId === char.id);
                    if (!dm) {
                        dm = { charId: char.id, messages: [] };
                        tkState.dms.push(dm);
                    }
                    dm.messages.push({
                        sender: 'user',
                        text: '[分享了视频]',
                        sharedVideoId: window.currentShareVideoId
                    });

                    // Update shares count
                    const { video } = window.findVideoGlobal(window.currentShareVideoId);
                    if (video) {
                        video.shares = (video.shares || 0) + 1;
                        // update UI if on home feed
                        const shareCountEl = document.getElementById(`share-count-${video.id}`);
                        if (shareCountEl) {
                            shareCountEl.innerHTML = `已分享`;
                            shareCountEl.style.color = '#ffb300';
                            shareCountEl.previousElementSibling.style.color = '#ffb300';
                        }
                    }

                    if (window.tkPersistState) window.tkPersistState();
                    if (window.tkRenderChat) window.tkRenderChat();
                    
                    // Auto jump to chat
                    const chatTabBtn = document.querySelector('.tk-bottom-nav .tk-nav-item[data-target="tk-chat-tab"]');
                    if (chatTabBtn) chatTabBtn.click();
                    
                    setTimeout(() => {
                        if (window.tkOpenChatView) {
                            window.tkOpenChatView(char.id);
                        }
                    }, 300);
                });
                
                shareList.appendChild(item);
            });
        }
        
        // Setup bottom actions
        const actionsRow = document.querySelector('.tk-share-actions-row');
        if (actionsRow) {
            actionsRow.innerHTML = `
                <div class="tk-share-action-item" onclick="window.tkHandleShareAction('save')">
                    <div class="tk-share-action-icon"><i class="fas fa-bookmark" id="tk-share-save-icon"></i></div>
                    <span>收藏</span>
                </div>
                <div class="tk-share-action-item" onclick="window.tkHandleShareAction('edit')">
                    <div class="tk-share-action-icon"><i class="fas fa-pen"></i></div>
                    <span>编辑</span>
                </div>
                <div class="tk-share-action-item" onclick="window.tkHandleShareAction('delete')">
                    <div class="tk-share-action-icon" style="color: #ff3b30;"><i class="fas fa-trash-alt"></i></div>
                    <span style="color: #ff3b30;">删除</span>
                </div>
                <div class="tk-share-action-item" onclick="window.showToast('链接已复制'); window.closeView(document.getElementById('tk-share-sheet'));">
                    <div class="tk-share-action-icon"><i class="fas fa-link"></i></div>
                    <span>复制链接</span>
                </div>
            `;
        }
        
        // Prevent duplicate bindings on share actions by doing it only once
        if (shareSheet && !shareSheet.dataset.boundActions) {
            shareSheet.dataset.boundActions = "true";
            
            // Blanket close
            shareSheet.addEventListener('click', (ev) => {
                if (ev.target === shareSheet) window.closeView(shareSheet);
            });
            
            // Close btn
            const closeBtn = shareSheet.querySelector('#tk-close-share-btn');
            if(closeBtn) {
                closeBtn.addEventListener('click', () => window.closeView(shareSheet));
            }
        }
        
        // Before opening, dynamically color the save button if already saved
        const saveIcon = document.getElementById('tk-share-save-icon');
        if (saveIcon && window.currentShareVideoId) {
            const { video } = window.findVideoGlobal(window.currentShareVideoId);
            if (video && video.isSaved) {
                saveIcon.style.color = '#ffb300';
            } else {
                saveIcon.style.color = '';
            }
        }
        
        window.openView(shareSheet);
    };

    window.tkOpenHashtag = function(tag, e) {
        if(e) e.stopPropagation();
        
        const hashtagView = document.getElementById('tk-hashtag-view');
        const titleEl = document.getElementById('tk-hashtag-title');
        const gridEl = document.getElementById('tk-hashtag-grid');
        
        if (!hashtagView || !titleEl || !gridEl) return;
        
        titleEl.textContent = '#' + tag;
        
        // Filter videos containing this tag
        const tagVideos = tkState.videos.filter(v => v.desc && v.desc.includes('#' + tag));
        
        gridEl.innerHTML = '';
        if (tagVideos.length > 0) {
            tagVideos.forEach(item => {
                const el = document.createElement('div');
                el.className = 'tk-grid-item';
                let bgStyleStr = '#ffffff';
                if (item.bgImage) bgStyleStr = `url('${item.bgImage}') center/cover no-repeat`;
                else if (item.bgColor) bgStyleStr = item.bgColor;
                
                el.innerHTML = `
                    <div class="tk-grid-text" style="position: relative; left: 0; top: 0; transform: none; background: ${bgStyleStr}; color:#111; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 8px; width: 100%; height: 100%; box-sizing: border-box; border: none; box-shadow: none !important;">
                        ${item.sceneText ? item.sceneText.substring(0, 15) + '...' : '视频片段'}
                    </div>
                    <div class="tk-grid-views" style="color: #fff; text-shadow: none;"><i class="fas fa-play"></i> ${item.likes || Math.floor(Math.random()*1000)}</div>
                `;
                el.addEventListener('click', () => {
                    if (window.tkOpenFullscreenVideo) window.tkOpenFullscreenVideo(item.id);
                });
                gridEl.appendChild(el);
            });
        } else {
            gridEl.innerHTML = '<div style="grid-column: span 3; padding: 40px 0; text-align: center; color: #999; font-size: 13px;">暂无相关视频</div>';
        }
        
        window.openView(hashtagView);

        // Allow blank area click to close (Bind once)
        if (!hashtagView.dataset.boundClose) {
            hashtagView.dataset.boundClose = "true";
            hashtagView.addEventListener('click', (ev) => {
                if (ev.target === hashtagView) window.closeView(hashtagView);
            });
        }
    };

    window.tkOpenMusic = function(e) {
        if(e) e.stopPropagation();
        
        const musicView = document.getElementById('tk-music-view');
        const gridEl = document.getElementById('tk-music-grid');
        
        if (!musicView || !gridEl) return;

        // Randomly pick a few videos to simulate a music feed
        const musicVideos = [...tkState.videos].sort(() => 0.5 - Math.random()).slice(0, 8);
        
        gridEl.innerHTML = '';
        if (musicVideos.length > 0) {
            musicVideos.forEach(item => {
                const el = document.createElement('div');
                el.className = 'tk-grid-item';
                let bgStyleStr = '#ffffff';
                if (item.bgImage) bgStyleStr = `url('${item.bgImage}') center/cover no-repeat`;
                else if (item.bgColor) bgStyleStr = item.bgColor;
                
                el.innerHTML = `
                    <div class="tk-grid-text" style="position: relative; left: 0; top: 0; transform: none; background: ${bgStyleStr}; color:#111; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 8px; width: 100%; height: 100%; box-sizing: border-box; border: none; box-shadow: none !important;">
                        ${item.sceneText ? item.sceneText.substring(0, 15) + '...' : '视频片段'}
                    </div>
                    <div class="tk-grid-views" style="color: #fff; text-shadow: none;"><i class="fas fa-play"></i> ${item.likes || Math.floor(Math.random()*1000)}</div>
                `;
                el.addEventListener('click', () => {
                    if (window.tkOpenFullscreenVideo) window.tkOpenFullscreenVideo(item.id);
                });
                gridEl.appendChild(el);
            });
        } else {
            gridEl.innerHTML = '<div style="grid-column: span 3; padding: 40px 0; text-align: center; color: #999; font-size: 13px;">暂无相关视频</div>';
        }
        
        window.openView(musicView);

        // Allow blank area click to close (Bind once)
        if (!musicView.dataset.boundClose) {
            musicView.dataset.boundClose = "true";
            musicView.addEventListener('click', (ev) => {
                if (ev.target === musicView) window.closeView(musicView);
            });
        }
    };

    // Global variable for current user modal
    window.currentCommentModalAuthorId = null;

    // Comment User Modal Logic
    window.tkOpenCommentUserModal = function(authorId, authorName, e) {
        if(e) e.stopPropagation();
        const modal = document.getElementById('tk-comment-user-modal');
        const nameEl = document.getElementById('tk-comment-modal-name');
        const homeBtn = document.getElementById('tk-comment-modal-home-btn');
        
        if (!modal) return;
        
        nameEl.textContent = authorName;
        window.currentCommentModalAuthorId = authorId;
        window.currentCommentModalAuthorName = authorName;
        
        // Bind button once globally
        if (!homeBtn.dataset.bound) {
            homeBtn.dataset.bound = "true";
            homeBtn.addEventListener('click', () => {
                const aId = window.currentCommentModalAuthorId;
                const aName = window.currentCommentModalAuthorName;
                if(!aId) return;

                window.closeView(modal);
                window.closeView(document.getElementById('tk-video-detail-sheet'));
                
                let char = window.tkGetChar(aId);
                if (!char) {
                    if (window.tkGenerateCharVideos) {
                        window.tkGenerateCharVideos(aId, () => {
                            window.tkOpenSubProfile(aId);
                        });
                    } else {
                        window.tkSaveChar({
                            id: aId,
                            name: aName,
                            handle: aId,
                            persona: '谢谢你的关注',
                            isFollowed: false
                        });
                        window.tkOpenSubProfile(aId);
                    }
                } else {
                    window.tkOpenSubProfile(aId);
                }
            });
        }
        
        // Blank area close for modal (Bind once)
        if (!modal.dataset.boundClose) {
            modal.dataset.boundClose = "true";
            modal.addEventListener('click', (ev) => {
                if (ev.target === modal) window.closeView(modal);
            });
        }
        
        window.openView(modal);
    };

    window.tkTriggerApiGenerate = function(e) {
        if(e) e.stopPropagation();
        generateVideos();
    };

    // Replace Search Icon with Magic Wand directly in Top Bar
    setTimeout(() => {
        const topbarRight = document.querySelector('.tk-home-topbar .tk-topbar-right');
        if (topbarRight) {
            topbarRight.innerHTML = '<i class="fas fa-magic" style="color: #111; cursor: pointer; font-size: 20px;"></i>';
            topbarRight.addEventListener('click', generateVideos);
        }
    }, 100);

    // Top Bar Tabs logic
    const topTabs = document.querySelectorAll('.tk-topbar-tab');
    topTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            topTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Re-render home feed based on active tab
            window.tkRenderHome();
        });
    });

    // API Logic
    async function generateVideos() {
        if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
            window.showToast('请在系统设置中配置 API');
            return;
        }

        window.showToast('正在生成内容...');
        
        // Collect World Book info if any exist globally
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

        // 3. (首页随机流暂不需要特定角色记忆，但可以预留)

        // Setup User Persona context
        let userPersonaContext = '';
        if (window.userState && window.userState.persona) {
            userPersonaContext = `用户(当前浏览者)人设: ${window.userState.persona}\n`;
        }

        const prompt = `
你现在是一个 TikTok 视频内容生成器。请根据挂载的世界书与user人设，生成 3-5 条 TikTok 视频数据。
要求：
1. 整体风格符合世界观，仿真实tk网络视频，内容多样化，文案具有网感。
2. 视频内容(sceneText)是由气泡包裹展现的文字，必须以第三人称视角描述简要的环境氛围、动作和语言描述，字数严格控制在 40-80 字之间。
3. 务必为每个视频生成 3-5 条相关评论，每条评论要包含随机生成的在线头像URL (authorAvatar) 和评论者名字。评论内容与视频内容相关，具有活人感与网感，可以玩梗。**如果情景合适（比如互相@或者接话），请在评论中追加 \`replies\` 数组（楼中楼回复）。**
4. 视频发布者及评论者的头像 (authorAvatar) 需要多样化，不一定全是人，可以是风景、宠物、动漫等，符合人设。请混合使用不同类型的随机图片API，例如：
   - 随机风景/动物/物品：https://picsum.photos/150/150?random=随机数字
5. 返回严格的 JSON 格式（不要有 markdown 代码块标记，不要多余文字），格式如下：
[
  {
    "authorName": "用户昵称",
    "handle": "user_id",
    "authorAvatar": "https://picsum.photos/150/150?random=1",
    "desc": "视频文案（简短，带0-3个tag，活人感）",
    "sceneText": "[傍晚的咖啡馆，暖黄色的灯光洒在桌面上，镜头拉近] 视频中的男子围着棕色围巾，一边搅拌着拿铁，一边叹气：哎呀今天真是累死我了，这下班高峰期怎么这么堵啊！",
    "likes": 1234,
    "commentsCount": 5,
    "shares": 12,
    "comments": [
      { 
        "authorName": "评论者A", 
        "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=def", 
        "text": "真的！堵麻了", 
        "likes": 12,
        "replies": [
           {
             "authorName": "回复者B",
             "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=xyz",
             "text": "回复内容",
             "likes": 3
           }
        ]
      }
    ]
  }
]

${wbContext}
${userPersonaContext}
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
            
            // Clean markdown blocks if present
            aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const parsedVideos = JSON.parse(aiReply);
            
            if (Array.isArray(parsedVideos)) {
                // Prepend to feed
                parsedVideos.forEach(v => {
                    tkState.videos.unshift({
                        id: 'v_' + Date.now() + Math.floor(Math.random() * 1000),
                        authorId: v.handle || ('user_' + Date.now()),
                        authorName: v.authorName || 'User',
                        authorAvatar: v.authorAvatar || null,
                        desc: v.desc || '',
                        sceneText: v.sceneText || '',
                        likes: v.likes || Math.floor(Math.random() * 1000),
                        commentsCount: (v.comments && v.comments.length) || v.commentsCount || 0,
                        shares: v.shares || Math.floor(Math.random() * 100),
                        isLiked: false,
                        comments: v.comments || []
                    });
                });
                
                if (window.tkPersistState) window.tkPersistState();
                window.tkRenderHome();
                window.showToast('内容生成成功');
            } else {
                throw new Error('JSON is not an array');
            }

        } catch (error) {
            console.error('Gen Error:', error);
            window.showToast('生成失败，请检查 API 配置或返回格式');
        }
    }

});
