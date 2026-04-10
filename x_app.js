document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // X (Twitter) App Logic
    // ==========================================
    const xView = document.getElementById('x-view');
    const xDrawer = document.getElementById('x-drawer');
    const xDrawerOverlay = document.getElementById('x-drawer-overlay');
    const xUserProfileView = document.getElementById('x-user-profile-view');

    // Tabs & Nav
    const xTabsContainer = document.getElementById('x-tabs-container');
    const xBottomNavItems = document.querySelectorAll('.x-bottom-nav .x-nav-item');
    const xNavIndicator = document.getElementById('x-nav-indicator');
    const xProfileTabs = document.querySelectorAll('#x-profile-tabs .x-profile-tab');
    const xProfileTabIndicator = document.getElementById('x-profile-tab-indicator');
    const xProfileActions = document.querySelector('.x-profile-actions');

    // Super Topic
    const xSuperTopicView = document.getElementById('x-super-topic-view');
    const xSuperTopicBackBtn = document.getElementById('x-super-topic-back-btn');
    const xSuperTopicTabs = document.querySelectorAll('#x-super-topic-tabs .x-super-topic-tab');
    const xSuperTopicTabIndicator = document.getElementById('x-super-topic-tab-indicator');
    const xSuperTopicFollowBtn = document.getElementById('x-super-topic-follow-btn');
    const xSuperTopicFeed = document.getElementById('x-super-topic-feed');
    const xSuperTopicAvatarCard = document.getElementById('x-super-topic-avatar-card');
    const xSuperTopicTitle = document.getElementById('x-super-topic-title');
    const xSuperTopicCert = document.getElementById('x-super-topic-cert');
    const xSuperTopicStats = document.getElementById('x-super-topic-stats');
    const xSuperTopicIntroPill = document.getElementById('x-super-topic-intro-pill');
    const xSuperTopicVisibleDescPill = document.getElementById('x-super-topic-visible-desc-pill');

    // Super Post Modal
    const xSuperPostModal = document.getElementById('x-super-post-modal');
    const xSuperPostModalClose = document.getElementById('x-super-post-modal-close');
    const xSuperPostModalBody = document.getElementById('x-super-post-modal-body');

    // Feed Containers
    const xHomeFeed = document.getElementById('x-home-feed');
    const xSuperFeedList = document.getElementById('x-super-feed-list');
    const xSuperFollowList = document.getElementById('x-super-follow-list');
    const xSuperTopicAddBtn = document.getElementById('x-super-topic-add-btn');
    const xChatEmpty = document.querySelector('.x-chat-empty');

    // Topic Create Modal
    const xTopicCreateModal = document.getElementById('x-topic-create-modal');
    const xTopicCreateModalClose = document.getElementById('x-topic-create-modal-close');
    const xTopicSearchInput = document.getElementById('x-topic-search-input');
    const xTopicAvatarUploadTrigger = document.getElementById('x-topic-avatar-upload-trigger');
    const xTopicAvatarUpload = document.getElementById('x-topic-avatar-upload');
    const xTopicAvatarPreviewImg = document.getElementById('x-topic-avatar-preview-img');
    const xTopicAvatarPreviewIcon = document.getElementById('x-topic-avatar-preview-icon');
    const xTopicNameInput = document.getElementById('x-topic-name-input');
    const xTopicIntroInput = document.getElementById('x-topic-intro-input');
    const xTopicVisibleDescInput = document.getElementById('x-topic-visible-desc-input');
    const xTopicAiDescInput = document.getElementById('x-topic-ai-desc-input');
    const xTopicCreateConfirmBtn = document.getElementById('x-topic-create-confirm-btn');
    const xTopicCreatedList = document.getElementById('x-topic-created-list');

    // Tweet Detail View
    const xTweetDetailView = document.getElementById('x-tweet-detail-view');
    const xDetailBackBtn = document.getElementById('x-detail-back-btn');
    const xDetailContent = document.getElementById('x-detail-content');

    // Headers
    const xHeaderAvatarBtn = document.getElementById('x-header-avatar-btn');

    // Sheets
    const xEditProfileSheet = document.getElementById('x-edit-profile-sheet');
    const xVisitorsSheet = document.getElementById('x-visitors-sheet');

    // World Modal
    const xWorldModal = document.getElementById('x-world-modal');
    const xWorldModalClose = document.getElementById('x-world-modal-close');
    const xWorldAttachBtn = document.getElementById('x-world-attach-btn');
    const xWorldbookPicker = document.getElementById('x-worldbook-picker');
    const xWorldbookPickerClose = document.getElementById('x-worldbook-picker-close');
    const xWorldbookPickerList = document.getElementById('x-worldbook-picker-list');

    // State
    let currentTab = 0;
    let currentSuperTopicId = null;
    let topicAvatarTemp = '';
    let autoTopicIdSeed = 3;
    let currentViewedProfile = null;

    const defaultExternalTopics = [
        {
            id: 'suggested-1',
            name: '电影超话',
            avatar: '',
            intro: '默认候选超话',
            visibleDescription: '默认候选超话，不自动关注',
            description: '默认候选超话，仅占位给 AI 参考',
            followed: false,
            creator: 'system',
            cert: '超话',
            stats: '12 帖子 | 30 粉丝',
            notice: '电影超话公告展示位',
            posts: []
        },
        {
            id: 'suggested-2',
            name: '旅行超话',
            avatar: '',
            intro: '默认候选超话',
            visibleDescription: '默认候选超话，不自动关注',
            description: '默认候选超话，仅占位给 AI 参考',
            followed: false,
            creator: 'system',
            cert: '超话',
            stats: '6 帖子 | 15 粉丝',
            notice: '旅行超话公告展示位',
            posts: []
        }
    ];

    const sampleHomePosts = [
        {
            id: 'home-1',
            topicName: '主页动态',
            author: '示例用户',
            badge: '主页',
            info: '3分钟前 · 来自 iPhone',
            text: '示例内容',
            comments: 12,
            likes: 25,
            reposts: 3
        },
        {
            id: 'home-2',
            topicName: '主页动态',
            author: '内容模板',
            badge: '默认',
            info: '12分钟前',
            text: '示例内容',
            comments: 8,
            likes: 17,
            reposts: 1
        }
    ];

    // --- 1. App Open/Close & Initialization ---
    const appXBtn = document.getElementById('app-x-btn') || document.querySelector('.x-app');
    if (appXBtn) {
        appXBtn.addEventListener('click', () => {
            if (window.isJiggleMode || window.preventAppClick) return;
            syncXUserData();
            ensureXTopicState();
            renderAllXTopicUI();
            if (window.openView) window.openView(xView);
        });
    }

    // --- 2. User Data Sync ---
    function getDefaultXData() {
        return {
            name: window.userState?.name || 'User',
            handle: '@user',
            bio: '点击编辑资料添加简介',
            location: '',
            following: '0',
            followers: '0',
            persona: '',
            avatar: '',
            banner: ''
        };
    }

    function getXState() {
        const state = window.getAppState ? window.getAppState('x') : null;
        return state && typeof state === 'object' ? state : {};
    }

    function updateXState(updater, options = {}) {
        const current = getXState();
        const draft = typeof structuredClone === 'function'
            ? structuredClone(current)
            : JSON.parse(JSON.stringify(current || {}));
        const nextState = typeof updater === 'function' ? (updater(draft) ?? draft) : updater;

        if (window.setAppState) {
            return window.setAppState('x', nextState, options);
        }

        return nextState;
    }

    function getXData() {
        const state = getXState();
        const raw = state && state.xData && typeof state.xData === 'object' ? state.xData : {};
        return {
            ...getDefaultXData(),
            ...raw
        };
    }

    function getXTopics() {
        const state = getXState();
        return Array.isArray(state.xTopics) ? state.xTopics : [];
    }

    function getXHomeBannerUrl() {
        const state = getXState();
        return typeof state.xHomeBannerUrl === 'string' ? state.xHomeBannerUrl : '';
    }

    function getXSearchBannerUrl() {
        const state = getXState();
        return typeof state.xSearchBannerUrl === 'string' ? state.xSearchBannerUrl : '';
    }

    function applyBannerImage(containerSelector, imageUrl) {
        const container = typeof containerSelector === 'string'
            ? document.querySelector(containerSelector)
            : containerSelector;

        if (!container) return;

        const image = container.tagName === 'IMG' ? container : container.querySelector('img');
        const placeholder = container.querySelector('.x-banner-placeholder');

        if (imageUrl) {
            if (image) {
                image.src = imageUrl;
                image.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            return;
        }

        if (image) {
            image.src = '';
            image.style.display = 'none';
        }
        if (placeholder) placeholder.style.display = 'block';
    }

    function syncXUserData() {
        const x = getXData();

        setText('x-drawer-name', x.name);
        setText('x-drawer-handle', x.handle);
        updateAvatar('x-drawer-avatar-img', 'x-drawer-avatar-icon', x.avatar);

        const drawerStats = document.querySelectorAll('.x-drawer-stat span');
        if (drawerStats.length >= 2) {
            drawerStats[0].textContent = x.following;
            drawerStats[1].textContent = x.followers;
        }

        updateAvatar('x-header-avatar-img', 'x-header-avatar-icon', x.avatar);
        setText('x-profile-name-large', x.name);
        setText('x-profile-handle-large', x.handle);
        setText('x-profile-bio', x.bio || '点击编辑资料添加简介');
        setText('x-stat-following', x.following);
        setText('x-stat-followers', x.followers);

        const locEl = document.getElementById('x-profile-location');
        if (locEl) {
            if (x.location) {
                locEl.style.display = 'flex';
                const span = locEl.querySelector('span');
                if (span) span.textContent = x.location;
            } else {
                locEl.style.display = 'none';
            }
        }

        const largeAvatarImg = document.getElementById('x-profile-avatar-large-img');
        if (largeAvatarImg) {
            if (x.avatar) {
                largeAvatarImg.src = x.avatar;
                largeAvatarImg.style.display = 'block';
            } else {
                largeAvatarImg.style.display = 'none';
            }
        }

        const profileBannerImg = document.getElementById('x-profile-banner-img');
        if (profileBannerImg) {
            applyBannerImage(profileBannerImg, x.banner);
        }

        applyBannerImage('#x-search-banner', getXSearchBannerUrl());
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text || '';
    }

    function updateAvatar(imgId, iconId, url) {
        const img = document.getElementById(imgId);
        const icon = document.getElementById(iconId);
        if (url) {
            if (img) {
                img.src = url;
                img.style.display = 'block';
            }
            if (icon) icon.style.display = 'none';
        } else {
            if (img) img.style.display = 'none';
            if (icon) icon.style.display = 'block';
        }
    }

    // --- X Topic State ---
    function ensureXTopicState() {
        const topics = getXTopics();
        if (!topics.length) {
            updateXState((state) => {
                state.xTopics = [
                    {
                        id: 'custom-1',
                        name: '我的超话',
                        avatar: '',
                        intro: '简介',
                        visibleDescription: '介绍文案',
                        description: '超话描述',
                        followed: true,
                        creator: 'user',
                        cert: '超话',
                        stats: '2 帖子 | 1 粉丝',
                        notice: '置顶公告',
                        posts: [
                            {
                                id: 'custom-1-post-1',
                                topicName: '我的超话',
                                author: '楼主',
                                badge: '已关注',
                                info: '刚刚 · 来自 iPhone',
                                text: '示例内容',
                                comments: 5,
                                likes: 9,
                                reposts: 1
                            },
                            {
                                id: 'custom-1-post-2',
                                topicName: '我的超话',
                                author: '超话成员',
                                badge: '动态',
                                info: '1小时前',
                                text: '帖子详情。',
                                comments: 11,
                                likes: 20,
                                reposts: 2
                            }
                        ]
                    }
                ];
                return state;
            }, { save: false });
        }
        const nextTopics = getXTopics();
        if (!currentSuperTopicId) {
            const firstFollowed = nextTopics.find(topic => topic.followed);
            currentSuperTopicId = firstFollowed ? firstFollowed.id : nextTopics[0]?.id || null;
        }
    }

    function getAllXTopics() {
        ensureXTopicState();
        return [...getXTopics(), ...defaultExternalTopics];
    }

    function getFollowedXTopics() {
        ensureXTopicState();
        return getXTopics().filter(topic => topic.followed);
    }

    function findTopicById(topicId) {
        return getAllXTopics().find(topic => topic.id === topicId) || null;
    }

    function getCurrentTopic() {
        return findTopicById(currentSuperTopicId);
    }

    function getTrendingPosts() {
        const followedTopics = getFollowedXTopics();
        const posts = followedTopics.flatMap(topic => {
            const topicPosts = Array.isArray(topic.posts) ? topic.posts : [];
            return topicPosts.map(post => ({ ...post, topicId: topic.id, topicName: topic.name }));
        });
        if (posts.length) return posts;
        return [
            {
                id: 'empty-hot-1',
                topicId: '',
                topicName: '超话广场',
                author: '暂无热门内容',
                badge: '空状态',
                info: '现在',
                text: '热门帖子',
                comments: 0,
                likes: 0,
                reposts: 0
            }
        ];
    }

    function getDefaultNotificationAvatar() {
        return '<div class="x-super-notify-avatar"><i class="fas fa-user"></i></div>';
    }

    function getNotifyItems() {
        const followedTopics = getFollowedXTopics();
        const notices = followedTopics.flatMap(topic => {
            const topicPosts = Array.isArray(topic.posts) ? topic.posts : [];
            return topicPosts.slice(0, 2).map((post, index) => ({
                id: `notify-${topic.id}-${post.id}-${index}`,
                actor: post.author || topic.name || '默认用户',
                action: '评论了你的帖子',
                time: post.info || '刚刚',
                topicName: topic.name || '超话'
            }));
        });

        if (notices.length) return notices;

        return [
            {
                id: 'notify-empty-1',
                actor: '默认用户',
                action: '评论了你的帖子',
                time: '刚刚',
                topicName: '消息通知'
            },
            {
                id: 'notify-empty-2',
                actor: '默认用户',
                action: '评论了你的帖子',
                time: '1分钟前',
                topicName: '消息通知'
            }
        ];
    }

    function getMessageItems() {
        const followedTopics = getFollowedXTopics();
        const inboxItems = followedTopics.slice(0, 4).map((topic, index) => {
            const latestPost = Array.isArray(topic.posts) ? topic.posts[0] : null;
            return {
                id: `message-${topic.id}-${index}`,
                name: topic.name || `聊天对象${index + 1}`,
                handle: `@${String(topic.name || `chat${index + 1}`).replace(/\s+/g, '').toLowerCase()}`,
                preview: latestPost?.text || '这里会显示最新消息预览。',
                time: latestPost?.info || `${index + 1}分钟前`,
                unread: index === 0 ? 2 : index === 1 ? 1 : 0
            };
        });

        if (inboxItems.length) return inboxItems;

        return [
            {
                id: 'message-empty-1',
                name: '默认会话',
                handle: '@demo',
                preview: '消息页已改成独立白色界面，列表统一为浅灰圆角气泡。',
                time: '刚刚',
                unread: 1
            },
            {
                id: 'message-empty-2',
                name: '系统通知',
                handle: '@system',
                preview: '后续这里可以继续接入真实私信、超话通知或角色聊天入口。',
                time: '2分钟前',
                unread: 0
            }
        ];
    }

    // --- Render Helpers ---
    function getInitialText(name) {
        return (name || '?').trim().slice(0, 1).toUpperCase() || '?';
    }

    function renderTopicAvatar(topic, className = '') {
        if (topic?.avatar) {
            return `<div class="${className}"><img src="${topic.avatar}" alt="${topic.name || ''}"></div>`;
        }
        return `<div class="${className}">${getInitialText(topic?.name)}</div>`;
    }

    function buildNoticeCardHtml(topic) {
        return `
            <div class="x-super-post-card x-super-post-card--notice">
                <div class="x-super-post-notice-tag">置顶公告</div>
                <div class="x-super-post-notice-title">${escapeHtml(topic?.notice || '创建超话后会显示置顶公告')}</div>
            </div>
        `;
    }

    function buildWeiboPostCardHtml(post) {
        return `
            <div class="x-super-post-card x-super-post-card--weibo" data-super-post-id="${escapeHtml(post.id || '')}" data-super-topic-id="${escapeHtml(post.topicId || '')}">
                <div class="x-super-weibo-head">
                    <div class="x-super-weibo-user">
                        <div class="x-super-weibo-avatar x-super-weibo-avatar--button" data-author-name="${escapeHtml(post.author || '用户')}">${getInitialText(post.author)}</div>
                        <div class="x-super-weibo-user-meta">
                            <div class="x-super-weibo-name-row">
                                <span class="x-super-weibo-name">${escapeHtml(post.author || '用户')}</span>
                                <span class="x-super-weibo-badge">${escapeHtml(post.badge || '动态')}</span>
                            </div>
                            <div class="x-super-weibo-info">${escapeHtml(post.info || '刚刚')}</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="x-super-weibo-text">
                    <span class="x-super-weibo-topic">${escapeHtml(post.topicName || '超话')}</span>
                    ${escapeHtml(post.text || '')}
                </div>
                <div class="x-super-weibo-actions">
                    <span><i class="fas fa-share-square"></i> ${escapeHtml(String(post.reposts ?? 0))}</span>
                    <span><i class="far fa-comment"></i> ${escapeHtml(String(post.comments ?? 0))}</span>
                    <span><i class="far fa-thumbs-up"></i> ${escapeHtml(String(post.likes ?? 0))}</span>
                </div>
            </div>
        `;
    }

    function buildPostDetailCardHtml(post) {
        return `
            <div class="x-super-post-card x-super-post-card--detail">
                <div class="x-super-weibo-head">
                    <div class="x-super-weibo-user">
                        <div class="x-super-weibo-avatar x-super-weibo-avatar--button" data-author-name="${escapeHtml(post.author || '用户')}">${getInitialText(post.author)}</div>
                        <div class="x-super-weibo-user-meta">
                            <div class="x-super-weibo-name-row">
                                <span class="x-super-weibo-name">${escapeHtml(post.author || '用户')}</span>
                                <span class="x-super-weibo-badge">${escapeHtml(post.badge || '动态')}</span>
                            </div>
                            <div class="x-super-weibo-info">${escapeHtml(post.info || '刚刚')}</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="x-super-weibo-text">
                    <span class="x-super-weibo-topic">${escapeHtml(post.topicName || '超话')}</span>
                    ${escapeHtml(post.text || '')}
                </div>
            </div>
        `;
    }

    function buildExternalProfile(authorName) {
        const safeName = authorName || '用户';
        return {
            name: safeName,
            handle: `@${String(safeName).replace(/\s+/g, '').toLowerCase() || 'user'}`,
            bio: `${safeName} 的个人主页占位内容，后续可继续接入真实资料。`,
            location: '',
            following: '24',
            followers: '131',
            avatar: '',
            banner: '',
            isFollowing: false
        };
    }

    function renderProfileActionButtons(mode, profile) {
        if (!xProfileActions) return;
        if (mode === 'self') {
            xProfileActions.innerHTML = '<button class="x-profile-btn" id="x-profile-edit-btn">编辑资料</button>';
            const nextEditBtn = document.getElementById('x-profile-edit-btn');
            if (nextEditBtn) {
                nextEditBtn.addEventListener('click', () => {
                    populateEditSheet();
                    openSheet(xEditProfileSheet);
                });
            }
            return;
        }

        xProfileActions.innerHTML = `
            <div class="x-profile-action-group">
                <button class="x-profile-btn x-profile-btn--dark" id="x-external-follow-btn">${profile?.isFollowing ? '已关注' : '关注'}</button>
                <button class="x-profile-btn" id="x-external-message-btn">私信</button>
                <button class="x-profile-icon-btn" id="x-external-api-btn"><i class="fas fa-wand-magic-sparkles"></i></button>
            </div>
        `;

        const followBtn = document.getElementById('x-external-follow-btn');
        const messageBtn = document.getElementById('x-external-message-btn');
        const apiBtn = document.getElementById('x-external-api-btn');

        followBtn?.addEventListener('click', () => {
            if (!currentViewedProfile) return;
            currentViewedProfile.isFollowing = !currentViewedProfile.isFollowing;
            renderProfileActionButtons('external', currentViewedProfile);
        });

        messageBtn?.addEventListener('click', () => {
            window.showToast?.('私信功能预留');
        });

        apiBtn?.addEventListener('click', () => {
            window.showToast?.('API 按钮预留');
        });
    }

    function renderUserProfileView(profile, mode = 'self') {
        if (!profile) return;

        setText('x-profile-name-large', profile.name || 'User');
        setText('x-profile-handle-large', profile.handle || '@user');
        setText('x-profile-bio', profile.bio || '点击编辑资料添加简介');
        setText('x-stat-following', profile.following || '0');
        setText('x-stat-followers', profile.followers || '0');

        const locEl = document.getElementById('x-profile-location');
        if (locEl) {
            if (profile.location) {
                locEl.style.display = 'flex';
                const span = locEl.querySelector('span');
                if (span) span.textContent = profile.location;
            } else {
                locEl.style.display = 'none';
            }
        }

        updateAvatar('x-profile-avatar-large-img', '', profile.avatar || '');
        const largeAvatarImg = document.getElementById('x-profile-avatar-large-img');
        if (largeAvatarImg && !profile.avatar) {
            largeAvatarImg.style.display = 'none';
        }

        const profileBannerImg = document.getElementById('x-profile-banner-img');
        if (profileBannerImg) {
            if (profile.banner) {
                profileBannerImg.src = profile.banner;
                profileBannerImg.style.display = 'block';
            } else {
                profileBannerImg.style.display = 'none';
            }
        }

        renderProfileActionButtons(mode, profile);
    }

    function openExternalProfile(authorName) {
        currentViewedProfile = buildExternalProfile(authorName);
        openUserProfile(currentViewedProfile, 'external');
    }

    function buildNotifyCardHtml(item) {
        return `
            <div class="x-super-notify-card" data-notify-id="${escapeHtml(item.id || '')}">
                ${getDefaultNotificationAvatar()}
                <div class="x-super-notify-body">
                    <div class="x-super-notify-line">
                        <span class="x-super-notify-name">${escapeHtml(item.actor || '默认用户')}</span>
                        <span class="x-super-notify-action">${escapeHtml(item.action || '评论了你的帖子')}</span>
                    </div>
                    <div class="x-super-notify-meta">${escapeHtml(item.topicName || '消息通知')} · ${escapeHtml(item.time || '刚刚')}</div>
                </div>
            </div>
        `;
    }

    function buildMessageCardHtml(item) {
        return `
            <div class="x-message-card" data-message-id="${escapeHtml(item.id || '')}">
                <div class="x-message-avatar">${escapeHtml(getInitialText(item.name || '私'))}</div>
                <div class="x-message-body">
                    <div class="x-message-topline">
                        <div class="x-message-name-wrap">
                            <span class="x-message-name">${escapeHtml(item.name || '默认会话')}</span>
                            <span class="x-message-handle">${escapeHtml(item.handle || '@user')}</span>
                        </div>
                        <span class="x-message-time">${escapeHtml(item.time || '刚刚')}</span>
                    </div>
                    <div class="x-message-preview">${escapeHtml(item.preview || '这里会显示消息预览')}</div>
                </div>
                ${(item.unread ?? 0) > 0
                    ? `<div class="x-message-badge">${escapeHtml(String(item.unread))}</div>`
                    : '<div class="x-message-badge x-message-badge--ghost"></div>'}
            </div>
        `;
    }

    function buildSuperTopicMetaCardHtml(title, desc, icon = 'fa-layer-group') {
        return `
            <div class="x-super-meta-card">
                <div class="x-super-meta-icon"><i class="fas ${escapeHtml(icon)}"></i></div>
                <div class="x-super-meta-body">
                    <div class="x-super-meta-title">${escapeHtml(title)}</div>
                    <div class="x-super-meta-desc">${escapeHtml(desc)}</div>
                </div>
            </div>
        `;
    }

    function getActiveSuperTopicTabKey() {
        const activeTab = Array.from(xSuperTopicTabs).find(tab => tab.classList.contains('active'));
        return (activeTab?.textContent || '热门').trim();
    }

    function buildSuperTopicTabContent(topic, activeTabLabel) {
        const posts = Array.isArray(topic?.posts) ? topic.posts : [];
        const mappedPosts = posts.map(post => ({ ...post, topicId: topic.id, topicName: topic.name }));

        if (activeTabLabel === '最新') {
            const latestPosts = mappedPosts.length
                ? [...mappedPosts].reverse()
                : [{
                    id: `${topic.id}-latest-empty`,
                    topicId: topic.id,
                    topicName: topic.name,
                    author: '超话管理员',
                    badge: '最新',
                    info: '刚刚',
                    text: '这里显示该超话的最新动态，后续可继续接入真实排序逻辑。',
                    comments: 0,
                    likes: 0,
                    reposts: 0
                }];

            return latestPosts.map(buildWeiboPostCardHtml).join('');
        }

        if (activeTabLabel === '名人动态') {
            const authorSet = [...new Set(mappedPosts.map(post => post.author).filter(Boolean))];
            const celebrityItems = authorSet.length
                ? authorSet.map((author, index) => buildSuperTopicMetaCardHtml(
                    author,
                    `${topic.name} 内的活跃作者 ${index + 1}，后续可接入更完整的人物动态流。`,
                    'fa-user-astronaut'
                ))
                : [buildSuperTopicMetaCardHtml('暂无名人动态', '当前还没有可展示的人物动态内容。', 'fa-star')];

            return celebrityItems.join('');
        }

        if (activeTabLabel === '精选') {
            const selectedPosts = mappedPosts.length
                ? mappedPosts.slice(0, 2).map(post => `
                    <div class="x-super-selected-card">
                        <div class="x-super-selected-tag">精选</div>
                        <div class="x-super-selected-title">${escapeHtml(post.author || '超话成员')}</div>
                        <div class="x-super-selected-text">${escapeHtml(post.text || '这里显示精选内容摘要。')}</div>
                        <div class="x-super-selected-meta">${escapeHtml(post.info || '刚刚')} · ${escapeHtml(topic.name || '超话')}</div>
                    </div>
                `)
                : [`
                    <div class="x-super-selected-card">
                        <div class="x-super-selected-tag">精选</div>
                        <div class="x-super-selected-title">暂无精选内容</div>
                        <div class="x-super-selected-text">这里会显示超话整理后的精选帖子与亮点内容。</div>
                        <div class="x-super-selected-meta">精选内容面板</div>
                    </div>
                `];

            return selectedPosts.join('');
        }

        return [
            buildNoticeCardHtml(topic),
            ...(mappedPosts.length
                ? mappedPosts.map(buildWeiboPostCardHtml)
                : [
                    buildWeiboPostCardHtml({
                        id: `${topic.id}-empty`,
                        topicId: topic.id,
                        topicName: topic.name,
                        author: '超话管理员',
                        badge: '提示',
                        info: '刚刚',
                        text: '当前还没有帖子内容，之后 API 生成的帖子会直接置入这个框架里。',
                        comments: 0,
                        likes: 0,
                        reposts: 0
                    })
                ])
        ].join('');
    }

    function buildPostDetailStatsHtml(post, activeKey = 'comments') {
        const tabs = [
            { key: 'reposts', label: '转发' },
            { key: 'comments', label: '评论' },
            { key: 'likes', label: '点赞' }
        ];

        return `
            <div class="x-super-post-detail-tabs">
                ${tabs.map(tab => `
                    <div class="x-super-post-detail-tab ${tab.key === activeKey ? 'active' : ''}" data-detail-tab-key="${escapeHtml(tab.key)}">
                        <span class="x-super-post-detail-tab-label">${escapeHtml(tab.label)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function buildPostDetailActionRowHtml() {
        const actions = [
            { key: 'like', icon: 'far fa-heart', label: '点赞' },
            { key: 'comment', icon: 'far fa-comment', label: '评论' },
            { key: 'repost', icon: 'fas fa-retweet', label: '转发' }
        ];

        return `
            <div class="x-super-post-action-row">
                ${actions.map(action => `
                    <button class="x-super-post-action-btn" type="button" data-detail-action="${escapeHtml(action.key)}" aria-label="${escapeHtml(action.label)}">
                        <i class="${escapeHtml(action.icon)}"></i>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function buildCommentHtml(itemOrIndex) {
        const comment = typeof itemOrIndex === 'number'
            ? {
                author: `评论用户${itemOrIndex + 1}`,
                handle: `@user${itemOrIndex + 1}`,
                time: `${itemOrIndex + 1}小时`,
                text: '这里是帖子详情底部弹窗中的评论区占位内容，用于继续往下滑动浏览。'
            }
            : {
                author: itemOrIndex?.author || '评论用户',
                handle: itemOrIndex?.handle || '@user',
                time: itemOrIndex?.time || '刚刚',
                text: itemOrIndex?.text || '这里是帖子详情底部弹窗中的评论区占位内容，用于继续往下滑动浏览。'
            };

        return `
            <div class="x-comment-item">
                <div class="x-comment-avatar x-comment-avatar--button" data-author-name="${escapeHtml(comment.author)}">${escapeHtml(getInitialText(comment.author))}</div>
                <div class="x-comment-content">
                    <div class="x-comment-header">
                        <span class="x-comment-name">${escapeHtml(comment.author)}</span>
                        <span class="x-comment-handle">${escapeHtml(comment.handle)}</span>
                        <span class="x-comment-time">· ${escapeHtml(comment.time)}</span>
                    </div>
                    <div class="x-comment-text">${escapeHtml(comment.text)}</div>
                    <div class="x-comment-actions">
                        <span><i class="far fa-comment"></i> 回复</span>
                        <span><i class="fas fa-retweet"></i> 转发</span>
                        <span><i class="far fa-heart"></i> 点赞</span>
                    </div>
                </div>
            </div>
        `;
    }

    function buildDetailUserListHtml(type, post) {
        const typeMap = {
            comments: {
                title: '评论区',
                itemBuilder: (_, index) => buildCommentHtml(index)
            },
            reposts: {
                title: '转发',
                itemBuilder: (_, index) => {
                    const author = `转发用户${index + 1}`;
                    return `
                        <div class="x-super-detail-user-item">
                            <div class="x-super-detail-user-avatar x-super-detail-user-avatar--button" data-author-name="${escapeHtml(author)}">${escapeHtml(getInitialText(author))}</div>
                            <div class="x-super-detail-user-body">
                                <div class="x-super-detail-user-line">
                                    <span class="x-super-detail-user-name">${escapeHtml(author)}</span>
                                    <span class="x-super-detail-user-handle">@repost${index + 1}</span>
                                </div>
                                <div class="x-super-detail-user-text">转发了这条帖子</div>
                            </div>
                        </div>
                    `;
                }
            },
            likes: {
                title: '赞',
                itemBuilder: (_, index) => {
                    const author = `点赞用户${index + 1}`;
                    return `
                        <div class="x-super-detail-user-item">
                            <div class="x-super-detail-user-avatar x-super-detail-user-avatar--button" data-author-name="${escapeHtml(author)}">${escapeHtml(getInitialText(author))}</div>
                            <div class="x-super-detail-user-body">
                                <div class="x-super-detail-user-line">
                                    <span class="x-super-detail-user-name">${escapeHtml(author)}</span>
                                    <span class="x-super-detail-user-handle">@like${index + 1}</span>
                                </div>
                                <div class="x-super-detail-user-text">赞了这条帖子</div>
                            </div>
                        </div>
                    `;
                }
            }
        };

        const config = typeMap[type] || typeMap.comments;
        const total = Number(post?.[type] ?? 0);
        const count = Math.max(3, Math.min(total || 3, 6));

        return `
            <div class="x-super-post-detail-panel" data-detail-panel-key="${escapeHtml(type)}">
                <div class="x-super-post-detail-comments">
                    <div class="x-super-post-detail-comments-title">${escapeHtml(config.title)}</div>
                    ${Array.from({ length: count }, (_, index) => config.itemBuilder(post, index)).join('')}
                </div>
            </div>
        `;
    }

    function buildPostDetailSectionHtml(post, activeKey = 'comments') {
        return `
            <div class="x-super-post-detail-panels x-super-post-detail-panels--static">
                ${buildDetailUserListHtml(activeKey, post)}
            </div>
        `;
    }

    function escapeHtml(text) {
        return String(text ?? '')
            .replace(/&/g, '\u0026amp;')
            .replace(/</g, '\u0026lt;')
            .replace(/>/g, '\u0026gt;')
            .replace(/"/g, '\u0026quot;')
            .replace(/'/g, '\u0026#39;');
    }

    function renderHomeFeed() {
        if (!xHomeFeed) return;
        xHomeFeed.innerHTML = sampleHomePosts.map(buildWeiboPostCardHtml).join('');
        bindWeiboPostCards(xHomeFeed);
    }

    function renderFollowStrip() {
        if (!xSuperFollowList) return;
        const followedTopics = getFollowedXTopics();
        xSuperFollowList.innerHTML = followedTopics.map(topic => `
            <div class="x-super-follow-channel ${topic.id === currentSuperTopicId ? 'active' : ''}" data-topic-id="${escapeHtml(topic.id)}">
                ${renderTopicAvatar(topic, 'x-super-follow-channel-avatar')}
                <div class="x-super-follow-channel-name">${escapeHtml(topic.name)}</div>
            </div>
        `).join('');

        xSuperFollowList.querySelectorAll('.x-super-follow-channel').forEach(item => {
            item.addEventListener('click', () => {
                const topicId = item.dataset.topicId;
                if (!topicId) return;
                currentSuperTopicId = topicId;
                renderFollowStrip();
                renderSuperTopicView();
                openSuperTopicView();
            });
        });
    }

    function renderTrendingFeed() {
        if (!xSuperFeedList) return;
        const notices = getNotifyItems();
        xSuperFeedList.innerHTML = notices.map(buildNotifyCardHtml).join('');
    }

    function renderSuperTopicView() {
        const topic = getCurrentTopic();
        if (!topic) return;

        if (xSuperTopicAvatarCard) {
            if (topic.avatar) {
                xSuperTopicAvatarCard.innerHTML = `<img src="${topic.avatar}" alt="${escapeHtml(topic.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:22px;">`;
            } else {
                xSuperTopicAvatarCard.textContent = getInitialText(topic.name);
            }
        }
        if (xSuperTopicTitle) xSuperTopicTitle.textContent = topic.name || '未命名超话';
        if (xSuperTopicCert) xSuperTopicCert.textContent = topic.cert || '超话';
        if (xSuperTopicStats) xSuperTopicStats.textContent = topic.stats || '0 帖子 | 0 粉丝';
        if (xSuperTopicIntroPill) {
            xSuperTopicIntroPill.textContent = '描述仅供 AI 使用';
            xSuperTopicIntroPill.style.display = 'none';
        }
        if (xSuperTopicVisibleDescPill) {
            xSuperTopicVisibleDescPill.textContent = '';
            xSuperTopicVisibleDescPill.style.display = 'none';
        }

        if (xSuperTopicFollowBtn) {
            xSuperTopicFollowBtn.classList.toggle('following', !!topic.followed);
            xSuperTopicFollowBtn.textContent = topic.followed ? '已关注' : '关注';
        }

        if (xSuperTopicFeed) {
            xSuperTopicFeed.innerHTML = buildSuperTopicTabContent(topic, getActiveSuperTopicTabKey());
            bindWeiboPostCards(xSuperTopicFeed);
        }

        requestAnimationFrame(() => updateSuperTopicTabIndicator(getActiveSuperTopicTabIndex()));
    }

    function getTopicCreateSearchKeyword() {
        return (xTopicSearchInput?.value || '').trim();
    }

    function renderCreatedTopicList() {
        if (!xTopicCreatedList) return;
        const keyword = getTopicCreateSearchKeyword().toLowerCase();
        const allTopics = getXTopics();
        const filtered = keyword
            ? allTopics.filter(topic =>
                (topic.name || '').toLowerCase().includes(keyword) ||
                (topic.description || '').toLowerCase().includes(keyword))
            : allTopics;

        xTopicCreatedList.innerHTML = filtered.map(topic => `
            <div class="x-topic-created-item" data-topic-open-id="${escapeHtml(topic.id)}">
                <div class="x-topic-created-item-avatar">
                    ${topic.avatar ? `<img src="${topic.avatar}" alt="${escapeHtml(topic.name)}">` : escapeHtml(getInitialText(topic.name))}
                </div>
                <div class="x-topic-created-item-body">
                    <div class="x-topic-created-item-name">${escapeHtml(topic.name)}</div>
                    <div class="x-topic-created-item-meta">${escapeHtml(topic.description || '暂无描述')}</div>
                </div>
            </div>
        `).join('');

        xTopicCreatedList.querySelectorAll('[data-topic-open-id]').forEach(item => {
            item.addEventListener('click', () => {
                const topicId = item.dataset.topicOpenId;
                if (!topicId) return;
                currentSuperTopicId = topicId;
                closeTopicCreateModal();
                renderAllXTopicUI();
                openSuperTopicView();
            });
        });
    }

    function renderAllXTopicUI() {
        ensureXTopicState();
        renderHomeFeed();
        renderFollowStrip();
        renderTrendingFeed();
        renderSuperTopicView();
        renderCreatedTopicList();
    }

    // --- Drawer Logic ---
    function openDrawer() {
        xDrawer?.classList.add('active');
        xDrawerOverlay?.classList.add('active');
    }

    function closeDrawer() {
        xDrawer?.classList.remove('active');
        xDrawerOverlay?.classList.remove('active');
    }

    if (xHeaderAvatarBtn) {
        xHeaderAvatarBtn.addEventListener('click', e => {
            e.stopPropagation();
            openDrawer();
        });
    }
    xDrawerOverlay?.addEventListener('click', closeDrawer);

    const drawerProfileArea = document.querySelector('.x-drawer-header');
    if (drawerProfileArea) {
        drawerProfileArea.addEventListener('click', e => {
            if (e.target.closest('#x-visitors-btn')) return;
            closeDrawer();
            openUserProfile();
        });
    }

    const worldMenuBtn = document.getElementById('x-menu-world');
    if (worldMenuBtn) {
        worldMenuBtn.addEventListener('click', () => {
            closeDrawer();
            openXWorldModal();
        });
    }

    const visitorsBtn = document.getElementById('x-visitors-btn');
    if (visitorsBtn) {
        visitorsBtn.addEventListener('click', () => {
            closeDrawer();
            openSheet(xVisitorsSheet);
        });
    }

    const exitAppBtn = document.getElementById('x-exit-app-btn');
    if (exitAppBtn) {
        exitAppBtn.addEventListener('click', () => {
            closeDrawer();
            if (window.closeView) {
                window.closeView(xView);
            } else {
                xView?.classList.remove('active');
            }
        });
    }

    // --- User Profile View Logic ---
    function openUserProfile(profileOverride = null, mode = 'self') {
        renderUserProfileView(profileOverride || getXData(), mode);
        xUserProfileView?.classList.add('active');
    }
    function closeUserProfile() {
        currentViewedProfile = null;
        xUserProfileView?.classList.remove('active');
    }

    const profileBackBtn = document.getElementById('x-profile-back-btn');
    profileBackBtn?.addEventListener('click', closeUserProfile);


    // --- Edit Profile Sheet Logic ---
    function populateEditSheet() {
        const x = getXData();
        document.getElementById('x-edit-name').value = x.name || '';
        document.getElementById('x-edit-handle').value = x.handle || '';
        document.getElementById('x-edit-bio').value = x.bio || '';
        document.getElementById('x-edit-location').value = x.location || '';
        document.getElementById('x-edit-following').value = x.following || '0';
        document.getElementById('x-edit-followers').value = x.followers || '0';
        document.getElementById('x-edit-persona').value = x.persona || '';

        const bannerPreview = document.getElementById('x-edit-banner-img');
        if (bannerPreview) {
            if (x.banner) {
                bannerPreview.src = x.banner;
                bannerPreview.style.display = 'block';
            } else {
                bannerPreview.style.display = 'none';
            }
        }

        const avatarPreview = document.getElementById('x-edit-avatar-img');
        if (avatarPreview) {
            if (x.avatar) {
                avatarPreview.src = x.avatar;
                avatarPreview.style.display = 'block';
            } else {
                avatarPreview.style.display = 'none';
            }
        }
    }

    const xBannerBtn = document.getElementById('x-edit-banner-btn');
    const xBannerInput = document.getElementById('x-banner-upload');
    if (xBannerBtn && xBannerInput) {
        xBannerBtn.addEventListener('click', () => xBannerInput.click());
        xBannerInput.addEventListener('change', e => handleImageUpload(e, 'x-edit-banner-img'));
    }

    const xAvatarBtn = document.getElementById('x-edit-avatar-wrapper');
    const xAvatarInput = document.getElementById('x-avatar-upload');
    if (xAvatarBtn && xAvatarInput) {
        xAvatarBtn.addEventListener('click', () => xAvatarInput.click());
        xAvatarInput.addEventListener('change', e => handleImageUpload(e, 'x-edit-avatar-img'));
    }

    function handleImageUpload(event, imgId) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.getElementById(imgId);
            if (img) {
                img.src = e.target.result;
                img.style.display = 'block';
                img.dataset.tempSrc = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }

    const xSaveProfileBtn = document.getElementById('x-save-profile-btn');
    if (xSaveProfileBtn) {
        xSaveProfileBtn.addEventListener('click', () => {
            const nextX = {
                ...getXData(),
                name: document.getElementById('x-edit-name').value,
                handle: document.getElementById('x-edit-handle').value,
                bio: document.getElementById('x-edit-bio').value,
                location: document.getElementById('x-edit-location').value,
                following: document.getElementById('x-edit-following').value,
                followers: document.getElementById('x-edit-followers').value,
                persona: document.getElementById('x-edit-persona').value
            };

            const bannerImg = document.getElementById('x-edit-banner-img');
            if (bannerImg?.dataset.tempSrc) {
                nextX.banner = bannerImg.dataset.tempSrc;
                delete bannerImg.dataset.tempSrc;
            }

            const avatarImg = document.getElementById('x-edit-avatar-img');
            if (avatarImg?.dataset.tempSrc) {
                nextX.avatar = avatarImg.dataset.tempSrc;
                delete avatarImg.dataset.tempSrc;
            }

            updateXState((state) => {
                state.xData = nextX;
                return state;
            });

            syncXUserData();
            closeSheet(xEditProfileSheet);
        });
    }

    // --- Navigation & Tabs ---
    xBottomNavItems.forEach((item, index) => {
        item.addEventListener('click', () => switchTab(index));
    });

    function updateXNavIndicator(index) {
        if (!xNavIndicator || !xBottomNavItems[index]) return;
        const activeItem = xBottomNavItems[index];
        const currentLeft = activeItem.offsetLeft;
        const initialOffset = 10;
        xNavIndicator.style.transform = `translateX(${currentLeft - initialOffset}px)`;
    }

    function updateProfileTabIndicator(index) {
        if (!xProfileTabIndicator || !xProfileTabs[index]) return;
        xProfileTabIndicator.style.transform = `translateX(${index * 100}%)`;
    }

    function setupProfileTabs() {
        if (!xProfileTabs.length) return;
        xProfileTabs.forEach((tab, idx) => {
            tab.addEventListener('click', () => {
                xProfileTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                updateProfileTabIndicator(idx);
            });
        });
        updateProfileTabIndicator(0);
    }

    function switchTab(index) {
        currentTab = index;
        xBottomNavItems.forEach((nav, i) => {
            const icon = nav.querySelector('i');
            if (i === index) {
                nav.classList.add('active');
                if (icon) {
                    if (i === 0) icon.className = 'fas fa-home';
                    if (i === 1) icon.className = 'fas fa-search';
                    if (i === 2) icon.className = 'fas fa-bell';
                    if (i === 3) icon.className = 'fas fa-envelope';
                }
            } else {
                nav.classList.remove('active');
                if (icon) {
                    if (i === 0) icon.className = 'fas fa-home';
                    if (i === 1) icon.className = 'fas fa-search';
                    if (i === 2) icon.className = 'far fa-bell';
                    if (i === 3) icon.className = 'far fa-envelope';
                }
            }
        });

        if (xTabsContainer) {
            xTabsContainer.style.transform = `translateX(-${index * 25}%)`;
        }
        updateXNavIndicator(index);
    }

    function setupInnerTabs(prefix) {
        const tabs = document.querySelectorAll(`#${prefix}-top-tabs .x-top-tab`);
        const tabsContainer = document.getElementById(`${prefix}-top-tabs`);
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (tabsContainer) {
                    const scrollLeft = tab.offsetLeft - (tabsContainer.offsetWidth / 2) + (tab.offsetWidth / 2);
                    tabsContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            });
        });
    }

    setupInnerTabs('x-home');
    setupInnerTabs('x-search');

    // --- Super Topic View ---
    function openSuperTopicView() {
        xSuperTopicView?.classList.add('active');
        requestAnimationFrame(() => updateSuperTopicTabIndicator(getActiveSuperTopicTabIndex()));
    }

    function closeSuperTopicView() {
        xSuperTopicView?.classList.remove('active');
    }

    function getActiveSuperTopicTabIndex() {
        return Array.from(xSuperTopicTabs).findIndex(tab => tab.classList.contains('active'));
    }

    function updateSuperTopicTabIndicator(index) {
        if (!xSuperTopicTabIndicator || !xSuperTopicTabs[index]) return;
        const activeTab = xSuperTopicTabs[index];
        const tabsWrap = document.getElementById('x-super-topic-tabs');
        if (!tabsWrap) return;
        const left = activeTab.offsetLeft + (activeTab.offsetWidth - xSuperTopicTabIndicator.offsetWidth) / 2;
        xSuperTopicTabIndicator.style.transform = `translateX(${left}px)`;
    }

    function setupSuperTopicTabs() {
        if (!xSuperTopicTabs.length) return;
        xSuperTopicTabs.forEach((tab, idx) => {
            tab.addEventListener('click', () => {
                xSuperTopicTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                updateSuperTopicTabIndicator(idx);
                renderSuperTopicView();
            });
        });
        requestAnimationFrame(() => updateSuperTopicTabIndicator(0));
    }

    function toggleCurrentTopicFollow() {
        const topics = getXTopics();
        const topic = topics.find(item => item.id === currentSuperTopicId);
        if (!topic) return;

        topic.followed = !topic.followed;

        if (!topic.followed) {
            const nextFollowedTopic = topics.find(item => item.followed);
            currentSuperTopicId = nextFollowedTopic?.id || topics?.[0]?.id || null;
        }

        updateXState((state) => {
            state.xTopics = topics;
            return state;
        });
        renderAllXTopicUI();
    }

    function setupSuperTopicFollowButton() {
        if (!xSuperTopicFollowBtn) return;
        xSuperTopicFollowBtn.addEventListener('click', toggleCurrentTopicFollow);
    }

    if (xSuperTopicBackBtn) {
        xSuperTopicBackBtn.addEventListener('click', closeSuperTopicView);
    }

    // --- Topic Create Modal ---
    function openTopicCreateModal() {
        xTopicCreateModal?.classList.add('active');
        renderCreatedTopicList();
    }

    function closeTopicCreateModal() {
        xTopicCreateModal?.classList.remove('active');
    }

    function resetTopicCreateForm() {
        topicAvatarTemp = '';
        if (xTopicAvatarPreviewImg) {
            xTopicAvatarPreviewImg.src = '';
            xTopicAvatarPreviewImg.style.display = 'none';
        }
        if (xTopicAvatarPreviewIcon) xTopicAvatarPreviewIcon.style.display = 'block';
        if (xTopicSearchInput) xTopicSearchInput.value = '';
        if (xTopicNameInput) xTopicNameInput.value = '';
        if (xTopicIntroInput) xTopicIntroInput.value = '';
        if (xTopicVisibleDescInput) xTopicVisibleDescInput.value = '';
        if (xTopicAiDescInput) xTopicAiDescInput.value = '';
    }

    if (xSuperTopicAddBtn) {
        xSuperTopicAddBtn.addEventListener('click', openTopicCreateModal);
    }

    if (xTopicCreateModalClose) {
        xTopicCreateModalClose.addEventListener('click', closeTopicCreateModal);
    }

    if (xTopicCreateModal) {
        xTopicCreateModal.addEventListener('click', e => {
            if (e.target === xTopicCreateModal) closeTopicCreateModal();
        });
    }

    if (xTopicAvatarUploadTrigger && xTopicAvatarUpload) {
        xTopicAvatarUploadTrigger.addEventListener('click', () => xTopicAvatarUpload.click());
        xTopicAvatarUpload.addEventListener('change', e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = evt => {
                topicAvatarTemp = evt.target.result;
                if (xTopicAvatarPreviewImg) {
                    xTopicAvatarPreviewImg.src = topicAvatarTemp;
                    xTopicAvatarPreviewImg.style.display = 'block';
                }
                if (xTopicAvatarPreviewIcon) xTopicAvatarPreviewIcon.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    xTopicSearchInput?.addEventListener('input', renderCreatedTopicList);

    if (xTopicCreateConfirmBtn) {
        xTopicCreateConfirmBtn.addEventListener('click', () => {
            const name = getTopicCreateSearchKeyword() || xTopicNameInput?.value.trim();
            if (!name) return;

            const description = xTopicAiDescInput?.value.trim() || '这里是给 AI 读取的内部描述';
            const newTopic = {
                id: `custom-${Date.now()}-${autoTopicIdSeed++}`,
                name,
                avatar: topicAvatarTemp || '',
                intro: '',
                visibleDescription: '',
                description,
                followed: true,
                creator: 'user',
                cert: '超话',
                stats: '2 帖子 | 1 粉丝',
                notice: `置顶公告 ${name} 的公告展示位`,
                posts: [
                    {
                        id: `${name}-post-1`,
                        topicName: name,
                        author: name,
                        badge: '已创建',
                        info: '刚刚',
                        text: `${name} 已创建成功，后续调用 API 生成的内容会直接置入这个超话框架里。`,
                        comments: 0,
                        likes: 0,
                        reposts: 0
                    }
                ]
            };

            ensureXTopicState();
            const topics = getXTopics();
            topics.unshift(newTopic);
            currentSuperTopicId = newTopic.id;

            updateXState((state) => {
                state.xTopics = topics;
                return state;
            });

            resetTopicCreateForm();
            renderAllXTopicUI();
            closeTopicCreateModal();
            openSuperTopicView();
        });
    }

    // --- Super Post Fullscreen Detail ---
    function renderFullscreenPostDetail(post, activeKey = 'comments') {
        if (!xDetailContent || !post) return;
        xDetailContent.innerHTML = `
            <div class="x-super-post-detail-wrap x-super-post-detail-wrap--fullscreen">
                ${buildPostDetailCardHtml(post)}
                ${buildPostDetailActionRowHtml()}
                ${buildPostDetailStatsHtml(post, activeKey)}
                ${buildPostDetailSectionHtml(post, activeKey)}
            </div>
        `;
        bindPostAuthorAvatarClicks(xDetailContent);
        bindPostDetailTabs(xDetailContent, post);
    }

    function openSuperPostModal(post) {
        if (!xTweetDetailView || !post) return;
        xSuperPostModal?.classList.remove('active');
        renderFullscreenPostDetail(post, 'comments');
        xTweetDetailView.classList.add('active');
    }

    function closeSuperPostModal() {
        xSuperPostModal?.classList.remove('active');
        xTweetDetailView?.classList.remove('active');
    }

    function bindPostAuthorAvatarClicks(container) {
        if (!container) return;
        const avatars = container.querySelectorAll('.x-super-weibo-avatar--button, .x-comment-avatar--button, .x-super-detail-user-avatar--button');
        avatars.forEach(avatar => {
            avatar.addEventListener('click', e => {
                e.stopPropagation();
                const authorName = avatar.dataset.authorName || '用户';
                openExternalProfile(authorName);
            });
        });
    }

    function bindPostDetailTabs(container, post) {
        if (!container || !post) return;
        const tabs = Array.from(container.querySelectorAll('.x-super-post-detail-tab'));
        if (!tabs.length) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const activeKey = tab.dataset.detailTabKey || 'comments';
                renderFullscreenPostDetail(post, activeKey);
            });
        });
    }

    function bindWeiboPostCards(container) {
        if (!container) return;
        const cards = container.querySelectorAll('.x-super-post-card--weibo');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const postId = card.dataset.superPostId;
                const topicId = card.dataset.superTopicId;
                const topic = topicId ? findTopicById(topicId) : null;
                const topicPosts = topic?.posts || getTrendingPosts();
                const post = topicPosts.find(item => item.id === postId) || sampleHomePosts.find(item => item.id === postId);
                if (!post) return;
                openSuperPostModal({
                    ...post,
                    topicId: topicId || '',
                    topicName: post.topicName || topic?.name || '超话'
                });
            });
        });
        bindPostAuthorAvatarClicks(container);
    }

    xSuperPostModalClose?.addEventListener('click', closeSuperPostModal);
    xSuperPostModal?.addEventListener('click', e => {
        if (e.target === xSuperPostModal) closeSuperPostModal();
    });

    // --- Compose Modal Logic ---
    const xComposeModal = document.getElementById('x-compose-modal');
    const xComposeCancel = document.getElementById('x-compose-cancel');
    const xFabs = document.querySelectorAll('.x-fab');

    if (xComposeModal) {
        xFabs.forEach(fab => {
            fab.addEventListener('click', e => {
                e.stopPropagation();
                xComposeModal.classList.add('active');
                const composeAvatar = document.getElementById('x-compose-avatar-img');
                const x = getXData();
                if (composeAvatar) {
                    if (x.avatar) {
                        composeAvatar.src = x.avatar;
                        composeAvatar.style.display = 'block';
                    } else {
                        composeAvatar.style.display = 'none';
                    }
                }
            });
        });

        xComposeCancel?.addEventListener('click', () => xComposeModal.classList.remove('active'));
        xComposeModal.addEventListener('click', e => {
            if (e.target === xComposeModal) xComposeModal.classList.remove('active');
        });

        const xComposePost = document.getElementById('x-compose-post');
        if (xComposePost) {
            xComposePost.addEventListener('click', () => {
                const textarea = document.querySelector('.x-compose-textarea');
                if (textarea) textarea.value = '';
                xComposeModal.classList.remove('active');
            });
        }
    }

    // --- Home/Search Banner upload ---
    const homeBanner = document.getElementById('x-home-banner');
    if (homeBanner) {
        homeBanner.addEventListener('click', () => {
            triggerImageUpload(url => {
                updateXState((state) => {
                    state.xHomeBannerUrl = url;
                    return state;
                });
                applyBannerImage(homeBanner, url);
            });
        });
    }

    const searchBanner = document.getElementById('x-search-banner');
    if (searchBanner) {
        searchBanner.addEventListener('click', () => {
            triggerImageUpload(url => {
                updateXState((state) => {
                    state.xSearchBannerUrl = url;
                    return state;
                });
                applyBannerImage(searchBanner, url);
            });
        });
    }

    function triggerImageUpload(callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = evt => callback(evt.target.result);
            reader.readAsDataURL(file);
        };
        input.click();
    }

    // --- World Modal Helpers ---
    function openXWorldModal() {
        xWorldModal?.classList.add('active');
    }

    function closeXWorldModal() {
        xWorldModal?.classList.remove('active');
    }

    function openXWorldbookPicker() {
        renderXWorldbookPicker();
        xWorldbookPicker?.classList.add('active');
    }

    function closeXWorldbookPicker() {
        xWorldbookPicker?.classList.remove('active');
    }

    function renderXWorldbookPicker() {
        if (!xWorldbookPickerList) return;
        const books = Array.isArray(window.worldBooks) ? window.worldBooks : [];
        if (!books.length) {
            xWorldbookPickerList.innerHTML = '<div class="x-worldbook-empty">暂无世界书</div>';
            return;
        }

        xWorldbookPickerList.innerHTML = books.map(book => {
            const entryCount = Array.isArray(book.entries) ? book.entries.length : 0;
            return `
                <div class="x-worldbook-item">
                    <div class="x-worldbook-item-icon"><i class="fas fa-book"></i></div>
                    <div>
                        <div class="x-worldbook-item-name">${escapeHtml(book.name || '未命名世界书')}</div>
                        <div class="x-worldbook-item-meta">${escapeHtml(book.group || '未分组')} · ${entryCount} 个词条</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    xWorldModalClose?.addEventListener('click', closeXWorldModal);
    xWorldModal?.addEventListener('click', e => {
        if (e.target === xWorldModal) closeXWorldModal();
    });
    xWorldAttachBtn?.addEventListener('click', openXWorldbookPicker);
    xWorldbookPickerClose?.addEventListener('click', closeXWorldbookPicker);
    xWorldbookPicker?.addEventListener('click', e => {
        if (e.target === xWorldbookPicker) closeXWorldbookPicker();
    });

    // --- Sheet Helpers ---
    function openSheet(sheet) {
        if (!sheet) return;
        const overlay = sheet.closest('.bottom-sheet-overlay') || sheet;
        overlay.classList.add('active');
        const sheetContent = overlay.querySelector('.bottom-sheet');
        if (sheetContent) sheetContent.classList.add('active');
    }

    function closeSheet(sheet) {
        if (!sheet) return;
        const overlay = sheet.closest('.bottom-sheet-overlay') || sheet;
        overlay.classList.remove('active');
        const sheetContent = overlay.querySelector('.bottom-sheet');
        if (sheetContent) sheetContent.classList.remove('active');
    }

    document.querySelectorAll('.bottom-sheet-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeSheet(overlay);
        });
    });

    xDetailBackBtn?.addEventListener('click', () => xTweetDetailView?.classList.remove('active'));

    // Initialize
    setTimeout(() => {
        ensureXTopicState();
        syncXUserData();
        renderAllXTopicUI();
        updateXNavIndicator(currentTab);
        updateProfileTabIndicator(0);
        setupProfileTabs();
        setupSuperTopicTabs();
        setupSuperTopicFollowButton();
    }, 100);
});
