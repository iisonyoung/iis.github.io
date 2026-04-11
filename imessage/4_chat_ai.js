// ==========================================
// IMESSAGE: 4_chat_ai.js
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const { apiConfig, userState } = window;
    window.imChat = window.imChat || {};
    const imChat = window.imChat;

    function getLiveFriendById(friendId) {
        return (window.imData.friends || []).find((item) => String(item.id) === String(friendId)) || null;
    }

    function scheduleFriendPersistence(friendId, options = {}) {
        if (friendId == null) return false;

        if (window.imApp.scheduleFriendSave) {
            return window.imApp.scheduleFriendSave(friendId, options);
        }

        if (window.imApp.markFriendDirty) {
            window.imApp.markFriendDirty(friendId);
        }

        if (window.imApp.scheduleGlobalSave) {
            return window.imApp.scheduleGlobalSave({
                delay: options.delay,
                silent: options.silent !== false
            });
        }

        return false;
    }

    async function flushFriendPersistence(friendId, options = {}) {
        if (friendId == null) return false;

        if (window.imApp.flushFriendSave) {
            return window.imApp.flushFriendSave(friendId, options);
        }

        if (window.imApp.commitFriendsChange) {
            return window.imApp.commitFriendsChange(() => {}, {
                silent: options.silent !== false,
                friendId
            });
        }

        return false;
    }

    async function handleSend(friend, inputEl, container) {
        const text = inputEl.value.trim();
        if (!text) return;

        const liveFriend = getLiveFriendById(friend.id) || friend;
        const now = Date.now();
        const lastMsg = liveFriend.messages && liveFriend.messages.length > 0
            ? liveFriend.messages[liveFriend.messages.length - 1]
            : null;

        if (!lastMsg || (now - (lastMsg.timestamp || 0) > 300000)) {
            window.imChat.renderTimestamp(now, container);
        }

        const replyToText = window.imData.currentReplyText || null;

        const msgObj = {
            id: window.imChat.createMessageId('msg'),
            role: 'user',
            content: text,
            timestamp: now,
            replyTo: replyToText
        };

        window.imChat.renderUserBubble(text, container, now, replyToText, null, false, msgObj.id);
        inputEl.value = '';

        const saved = window.imApp.appendFriendMessage
            ? await window.imApp.appendFriendMessage(friend.id, msgObj, { silent: true })
            : (window.imApp.commitFriendChange
                ? await window.imApp.commitFriendChange(friend.id, (targetFriend) => {
                    if (!targetFriend) return;
                    if (!targetFriend.messages) targetFriend.messages = [];
                    targetFriend.messages.push(msgObj);

                    if (window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(targetFriend.id)) {
                        window.imData.currentActiveFriend = targetFriend;
                    }
                }, {
                    silent: true,
                    immediate: false,
                    delay: 400
                })
                : (window.imApp.commitFriendsChange
                    ? await window.imApp.commitFriendsChange(() => {
                        const targetFriend = window.imData.friends.find((item) => String(item.id) === String(friend.id));
                        if (!targetFriend) return;
                        if (!targetFriend.messages) targetFriend.messages = [];
                        targetFriend.messages.push(msgObj);
                    }, {
                        silent: true,
                        friendId: friend.id,
                        immediate: false,
                        delay: 400
                    })
                    : false));

        if (!saved) {
            const activeContainer = container || document.querySelector(`#chat-interface-${friend.id} .ins-chat-messages`);
            const latestFriend = getLiveFriendById(friend.id) || friend;
            if (activeContainer && window.imChat.rerenderChatContainer) {
                window.imChat.rerenderChatContainer(latestFriend, activeContainer, { scroll: true });
            }
            if (window.showToast) window.showToast('消息保存失败');
            return;
        }

        window.imData.currentReplyText = null;
        const page = document.getElementById(`chat-interface-${friend.id}`);
        if (page) {
            const preview = page.querySelector('.reply-preview-container');
            if (preview) preview.style.display = 'none';
        }
    }

    function extractTaggedBlock(text, tagName) {
        if (!text || !tagName) return null;
        const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
        const match = String(text).match(regex);
        return match ? match[1].trim() : null;
    }

    function removeTaggedBlock(text, tagName) {
        if (!text || !tagName) return text;
        const regex = new RegExp(`<${tagName}>[\\s\\S]*?<\\/${tagName}>`, 'i');
        return String(text).replace(regex, '').trim();
    }

    function parseJsonArrayFromText(rawText) {
        if (!rawText || typeof rawText !== 'string') return null;
        let cleanText = rawText.trim();

        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }

        cleanText = cleanText.trim();
        if (!cleanText) return null;

        try {
            const parsed = JSON.parse(cleanText);
            return Array.isArray(parsed) ? parsed : null;
        } catch (e) {
            return null;
        }
    }

    function normalizeProfilePanelPayload(rawText) {
        if (!rawText || typeof rawText !== 'string') return null;

        let cleanText = rawText.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }

        cleanText = cleanText.trim();
        if (!cleanText) return null;

        try {
            const parsed = JSON.parse(cleanText);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

            const safeEvents = Array.isArray(parsed.events)
                ? parsed.events.map((eventItem, index) => {
                    const safeType = typeof eventItem?.type === 'string' && eventItem.type.trim()
                        ? eventItem.type.trim()
                        : 'note';
                    const safeId = eventItem?.id != null ? eventItem.id : `event-${Date.now()}-${index}`;
                    const safeRequestText = typeof eventItem?.requestText === 'string'
                        ? eventItem.requestText.trim()
                        : '';
                    const safeDetail = typeof eventItem?.detail === 'string'
                        ? eventItem.detail.trim()
                        : '';
                    const safeTitle = typeof eventItem?.title === 'string' && eventItem.title.trim()
                        ? eventItem.title.trim()
                        : (safeType === 'memory_request' ? '请求记住' : '新的事件');

                    const safeMemoryPayload = eventItem?.memoryPayload && typeof eventItem.memoryPayload === 'object'
                        ? {
                            title: typeof eventItem.memoryPayload.title === 'string' && eventItem.memoryPayload.title.trim()
                                ? eventItem.memoryPayload.title.trim()
                                : safeTitle,
                            content: typeof eventItem.memoryPayload.content === 'string' && eventItem.memoryPayload.content.trim()
                                ? eventItem.memoryPayload.content.trim()
                                : (safeRequestText || (typeof eventItem?.description === 'string' ? eventItem.description.trim() : '')),
                            detail: typeof eventItem.memoryPayload.detail === 'string'
                                ? eventItem.memoryPayload.detail.trim()
                                : safeDetail,
                            reason: typeof eventItem.memoryPayload.reason === 'string'
                                ? eventItem.memoryPayload.reason.trim()
                                : '',
                            sourceEventId: typeof eventItem.memoryPayload.sourceEventId === 'string' && eventItem.memoryPayload.sourceEventId.trim()
                                ? eventItem.memoryPayload.sourceEventId.trim()
                                : String(safeId),
                            createdAt: typeof eventItem.memoryPayload.createdAt === 'string'
                                ? eventItem.memoryPayload.createdAt.trim()
                                : (typeof eventItem?.time === 'string' ? eventItem.time.trim() : ''),
                            sourceThought: typeof eventItem.memoryPayload.sourceThought === 'string'
                                ? eventItem.memoryPayload.sourceThought.trim()
                                : ''
                        }
                        : null;

                    return {
                        id: safeId,
                        title: safeTitle,
                        description: typeof eventItem?.description === 'string' ? eventItem.description.trim() : '',
                        time: typeof eventItem?.time === 'string' ? eventItem.time.trim() : '',
                        type: safeType,
                        status: typeof eventItem?.status === 'string' && eventItem.status.trim()
                            ? eventItem.status.trim()
                            : 'pending',
                        requestText: safeRequestText,
                        detail: safeDetail,
                        confirmText: typeof eventItem?.confirmText === 'string' && eventItem.confirmText.trim()
                            ? eventItem.confirmText.trim()
                            : '确认',
                        cancelText: typeof eventItem?.cancelText === 'string' && eventItem.cancelText.trim()
                            ? eventItem.cancelText.trim()
                            : '取消',
                        memoryPayload: safeMemoryPayload
                    };
                })
                : [];

            return {
                thought: typeof parsed.thought === 'string' && parsed.thought.trim() ? parsed.thought.trim() : '',
                location: typeof parsed.location === 'string' && parsed.location.trim() ? parsed.location.trim() : '',
                action: typeof parsed.action === 'string' && parsed.action.trim() ? parsed.action.trim() : '',
                mood: typeof parsed.mood === 'string' && parsed.mood.trim() ? parsed.mood.trim() : '',
                expression: typeof parsed.expression === 'string' && parsed.expression.trim() ? parsed.expression.trim() : '',
                affectionChange: typeof parsed.affectionChange === 'number' ? Math.max(-5, Math.min(5, parsed.affectionChange)) : 0,
                status: 'online',
                events: safeEvents
            };
        } catch (e) {
            return null;
        }
    }

    async function handleAiReply(friend, container, btnEl) {
        if (!apiConfig.endpoint || !apiConfig.apiKey) {
            if(window.showToast) window.showToast('请先在设置中配置 API');
            return;
        }

        const typingRow = document.createElement('div');
        typingRow.className = 'chat-row ai-row typing-row';
        typingRow.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
        `;
        container.appendChild(typingRow);
        window.imChat.scrollToBottom(container);

        if(btnEl) btnEl.style.opacity = '0.5';

        friend.memory = window.imApp.normalizeFriendData(friend).memory;

        let shouldSummarizeThisTurn = false;
        const summaryLimit = parseInt(friend.memory.summary?.limit, 10) || 80;
        const lastCount = friend.memory.lastSummaryMessageCount || 0;
        const messagesSinceSummary = (friend.messages || []).length - lastCount;

        if (summaryLimit > 0 && messagesSinceSummary >= summaryLimit) {
            if (friend.memory.summary?.enabled) {
                shouldSummarizeThisTurn = true;
            } else if (messagesSinceSummary === summaryLimit && !friend.memory.summary?.enabled) {
                const userAgreed = await new Promise(resolve => {
                    if (window.showCustomModal) {
                        window.showCustomModal({
                            title: '是否生成记忆总结？',
                            message: '当前对话条数已达到设定的阈值，是否让 AI 生成一段总结并存入长期记忆？',
                            confirmText: '生成总结',
                            cancelText: '暂不生成',
                            onConfirm: () => resolve(true),
                            onCancel: () => resolve(false)
                        });
                    } else if (confirm('当前对话条数已达到设定的阈值，是否让 AI 生成一段总结并存入长期记忆？')) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });

                if (userAgreed) {
                    shouldSummarizeThisTurn = true;
                } else {
                    if (window.imApp.commitScopedFriendChange) {
                        await window.imApp.commitScopedFriendChange(friend.id, (targetFriend) => {
                            if (!targetFriend) return;
                            if (!targetFriend.memory) targetFriend.memory = {};
                            targetFriend.memory.lastSummaryMessageCount = (targetFriend.messages || []).length;
                        }, { silent: true, metaOnly: true });
                        friend.memory.lastSummaryMessageCount = (friend.messages || []).length;
                    }
                }
            }
        }

        const isSleeping = window.imApp.isCharacterSleeping(friend);

        const relationshipText = friend.memory.relationships && friend.memory.relationships.length > 0
            ? friend.memory.relationships.map(rel => {
                const npc = window.imData.friends.find(item => String(item.id) === String(rel.npcId));
                return `${npc ? npc.nickname : 'Unknown NPC'}: ${rel.relation}`;
            }).join('\n')
            : 'None';

        const commonMemorySections = [
            friend.memory.overview ? `Overview:\n${friend.memory.overview}` : '',
            friend.memory.longTerm ? `Long-term Memory:\n${friend.memory.longTerm}` : '',
            friend.memory.context?.notes ? `Extra Context Notes:\n${friend.memory.context.notes}` : '',
            friend.memory.summary?.enabled && friend.memory.summary?.prompt ? `Auto Summary Prompt:\n${friend.memory.summary.prompt}` : '',
            `Relationship Network:\n${relationshipText}`,
            (() => {
                const mounted = friend.mountedStickers || [];
                if (mounted.length === 0) return '';
                const allStickers = window.imData.stickers || [];
                const stickerLines = [];
                mounted.forEach(catName => {
                    const cat = allStickers.find(c => c.categoryName === catName);
                    if (cat && cat.items.length > 0) {
                        const names = cat.items.map(s => s.name).join(', ');
                        stickerLines.push(`[${catName}]: ${names}`);
                    }
                });
                if (stickerLines.length === 0) return '';
                return `Available Stickers (both you and user can use, describe sticker usage with {{sticker:name}} format):\n${stickerLines.join('\n')}`;
            })(),
            (() => {
                const panel = window.imChat.getProfilePanelData
                    ? window.imChat.getProfilePanelData(friend)
                    : (friend.profilePanel || null);
                if (!panel) return '';

                const eventSummary = Array.isArray(panel.events) && panel.events.length > 0
                    ? panel.events.slice(-3).map((eventItem, index) => {
                        const title = eventItem?.title || `事件${index + 1}`;
                        const description = eventItem?.description || '';
                        const time = eventItem?.time || '';
                        return `- ${title}${time ? ` (${time})` : ''}${description ? `: ${description}` : ''}`;
                    }).join('\n')
                    : 'None';

                const affection = typeof panel.affection === 'number' ? panel.affection : 50;

                return `Current Profile Panel Snapshot:\nOnline Status: ${isSleeping ? 'offline' : 'online'}\nLocation: ${panel.location || '未知位置'}\nAction: ${panel.action || '暂无动作'}\nMood: ${panel.mood || '平静'}\nExpression: ${panel.expression || '自然'}\nAffection(好感度): ${affection}\nThought: ${panel.thought || '暂无心声'}\nRecent Events:\n${eventSummary}`;
            })()
        ].filter(Boolean).join('\n\n');

        const profilePanelRequirement = friend.type === 'group'
            ? ''
            : `\n\nProfile Panel Requirement:\n- 在正常聊天气泡之外，你必须额外输出 1 个 <profile_panel>...</profile_panel>\n- <profile_panel> 内必须是合法 JSON，不能有 markdown 代码块，不能有额外解释文字\n- JSON 必须包含字段：thought、location、action、mood、expression、affectionChange、events\n- thought 必须是 45-60 字左右，严格基于当前聊天上下文，使用第一人称，像角色此刻没有说出口的心声\n- location 必须是 2-16 字，表示角色此刻所处的位置或场景\n- action 必须是 2-10 字，表示角色此刻正在做的动作或状态\n- mood 必须是 2-10 字，表示角色此刻的心情\n- expression 必须是 2-10 字，表示角色此刻的面部表情或神态\n- affectionChange 必须是整数（范围 -5 到 5），表示你对用户好感度因本轮对话产生的增减变化\n- 不要输出 online 或类似在线文案，在线状态由系统统一控制\n- events 必须是 JSON 数组；如果当前没有新的事件就输出 []；如果有事件，最多 3 条\n- 普通事件格式为 {"title":"事件标题","description":"事件描述","time":"时间或留空","type":"note"}\n- 如果你认为刚刚这段聊天是你在意的、想记住的，必须额外加入 1 条记忆请求事件，type 必须为 "memory_request"\n- 记忆请求事件格式为 {"title":"想记住某件事","description":"一句简短说明","time":"时间或留空","type":"memory_request","requestText":"想要记住的具体事情","detail":"为什么想记住或补充细节","confirmText":"确认","cancelText":"取消","memoryPayload":{"title":"珍视回忆标题","content":"要记住的内容","detail":"更多细节","reason":"想记住的原因","createdAt":"时间或留空","sourceThought":"可留空"}}\n- 只有当你真的觉得值得记住时才输出 memory_request，不能每次都输出\n- thought、location、action、mood、expression、events 必须和当前聊天内容连贯，不能复读，不能脱离角色人设`;

        let systemPrompt = '';
        const effectiveUserPersona = window.imApp?.getEffectivePersonaForFriend
            ? window.imApp.getEffectivePersonaForFriend(friend)
            : (userState.persona || '');
        const systemDepthWorldBookContext = window.getGlobalWorldBookContextByPosition
            ? window.getGlobalWorldBookContextByPosition('system_depth')
            : '';
        const beforeRoleWorldBookContext = window.getGlobalWorldBookContextByPosition
            ? window.getGlobalWorldBookContextByPosition('before_role')
            : '';
        const afterRoleWorldBookContext = window.getGlobalWorldBookContextByPosition
            ? window.getGlobalWorldBookContextByPosition('after_role')
            : '';

        if (friend.type === 'group') {
            const groupMembers = window.imChat.getGroupMemberFriends(friend);
            const allowedSpeakerNames = groupMembers.map(member => member.nickname).filter(Boolean);
            
            // 处理成员的挂载单聊记忆
            const groupMemorySettings = friend.memory?.mountSettings || {};
            const membersInfo = groupMembers.length > 0
                ? groupMembers.map(member => {
                    let infoStr = `Name: ${member.nickname}\nPersona: ${member.persona || 'None'}\nOverview: ${member.memory?.overview || 'None'}`;
                    
                    // 如果开启了挂载单聊记忆，并且有单聊上下文
                    if (groupMemorySettings[member.id] && window.imApp.getRecentContextMessages) {
                        const contextMessages = window.imApp.getRecentContextMessages(member) || [];
                        if (contextMessages.length > 0) {
                            const formattedContext = contextMessages.map(msg => {
                                const role = msg.role === 'user' ? (userState.name || 'User') : member.nickname;
                                return `${role}: ${msg.content || msg.text || ''}`;
                            }).join('\n');
                            infoStr += `\n该成员当前的单聊上下文(仅 ${member.nickname} 可见并可参考，其他成员不可知):\n${formattedContext}`;
                        }
                    }
                    
                    return infoStr;
                }).join('\n\n')
                : 'None';

            systemPrompt = `${systemDepthWorldBookContext ? `系统深度规则（最高优先级）：\n${systemDepthWorldBookContext}\n\n` : ''}${beforeRoleWorldBookContext ? `角色前规则：\n${beforeRoleWorldBookContext}\n\n` : ''}你正在模拟一个名为 "${friend.nickname}" 的群聊。
你正在与 ${userState.name} 聊天，其人设为: ${effectiveUserPersona || '一个普通用户'}。

此群内允许发言的成员名单（除用户外）：
${membersInfo}

只允许以下这些成员发言：
${allowedSpeakerNames.length > 0 ? allowedSpeakerNames.join('、') : 'None'}${afterRoleWorldBookContext ? `\n\n角色后规则：\n${afterRoleWorldBookContext}` : ''}

群聊特定规则：
1. 请根据上下文和群成员性格进行回复，所有群员都必须参与回复，除非群聊人数大于10人则挑选5-8人回复。
2. 你会在下面看到带说话人标记的最近聊天记录。你必须认真参考“谁刚刚说了什么”，不能忽略成员自己的上一轮发言，不能像失忆一样重复、改口或无缘无故换立场。
3. 同一个成员如果刚刚自己表达过观点、情绪、计划、态度、称呼对象，本轮继续发言时必须与其最近发言保持连续性，除非有明确的新消息让他改变想法。
4. 回复时优先承接最近几条消息中的具体对象、话题、称呼、问题和情绪，不要只对最后一条做泛泛回应。
5. 【强限制】：严禁使用名单之外的名字发言，严禁虚构新成员，严禁让 User 冒充群成员发言。
6. 【输出格式】：必须把聊天气泡放在 <chat_json> 和 </chat_json> 标签内，标签内只能是合法 JSON 数组，不能有 markdown 代码块，不能有解释文字。
7. 【重要】如果群员想要发红包，或者你觉得气氛到了该发红包了，可以输出红包对象格式：{"type":"red_packet","speaker":"发红包的成员名","amount":100,"count":5,"description":"红包封面语"}。
8. 普通文本气泡格式必须为 {"type":"text","speaker":"成员名","text":"气泡内容","translation":"中文翻译或空字符串","quote":"被引用内容或空字符串"}。
9. speaker 必须且只能使用以上允许发言名单中的完整准确名字。
10. translation 只能翻译当前这一条 text；如果 text 本身是中文，translation 必须是空字符串。
11. quote 只有在你确实想引用用户或上一条消息时才填写，否则必须是空字符串。
群聊的背景与关系记忆:
${commonMemorySections || 'None'}`;

        } else {
            const currentTime = new Date();
            const timeString = `${currentTime.getFullYear()}年${currentTime.getMonth() + 1}月${currentTime.getDate()}日 ${currentTime.getHours()}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
            
            const sleepPrompt = isSleeping ? `\n【作息限制】：角色当前正在睡觉。如果用户发来消息，你必须强制保持离线状态并在所有回复内容（text 字段）的开头添加 "[自动回复] " 前缀，模拟已睡着或离线时的自动响应。心声和面板状态也要符合睡着的情境。` : '';

            systemPrompt = `${systemDepthWorldBookContext ? `System Depth Rules (Highest Priority):\n${systemDepthWorldBookContext}\n\n` : ''}${beforeRoleWorldBookContext ? `Before Role Rules:\n${beforeRoleWorldBookContext}\n\n` : ''}You are playing the role of ${friend.realName || friend.nickname}. 
【核心设定/Core Persona】：${friend.persona || 'No specific persona'}。
You are talking to ${userState.name}, whose persona is: ${effectiveUserPersona || 'A normal user'}。
【强制要求】：你必须在接下来的每一句对话、动作和心声中，深刻且精准地体现出你自己的【核心设定】，同时充分关注并根据用户的设定做出互动，绝对不能偏离人设！
当前系统时间是：${timeString}。请在对话和心声中自然地感知并体现出对当前时间（如早晚、日期）的认知。${afterRoleWorldBookContext ? `\n\nAfter Role Rules:\n${afterRoleWorldBookContext}` : ''}${sleepPrompt}
Reply naturally as your character in a chat app.
请根据上下文，记忆，人设进行回复，一次按需求回复2-8条气泡。
1. 如果用户刚刚给你转账，你可以选择正常文字回复，也可以额外输出 1 个支付对象表示“收下转账”；如果你想给用户转账，也可以输出 1 个支付对象表示“你向用户转账”。
2. 【输出格式】必须把聊天气泡放在 <chat_json> 和 </chat_json> 标签内，标签内只能是合法 JSON 数组，不能有 markdown 代码块，不能有解释文字。
3. JSON 数组中的每一个对象都严格对应“一个独立气泡”或“一个独立支付卡片”，绝对禁止把多条气泡合并到同一个 text 字段里。
4. 普通文本对象格式必须为 {"type":"text","text":"气泡内容","translation":"该条气泡的中文翻译或空字符串","quote":"被引用内容或空字符串"}。
5. 支付对象格式必须为 {"type":"payment","paymentAction":"receive|transfer","amount":88.88,"description":"原因或备注"}。
6. 当 paymentAction 为 receive 时，表示你收下了用户刚刚给你的钱；当 paymentAction 为 transfer 时，表示你给用户转账。
7. translation 只能翻译当前这一条 text；如果 text 本身是中文，translation 必须是空字符串。
8. quote 只有在你确实想引用用户某句消息时才填写，否则必须是空字符串。
9. 除 <chat_json> 外，不要输出任何聊天正文。
10. 你必须额外输出 1 个 <profile_panel>...</profile_panel>，用于更新角色资料卡。

Character Memory:
${commonMemorySections || 'None'}${profilePanelRequirement}`;
        }

        const messages = [{ role: 'system', content: systemPrompt }];
        if (window.imApp.buildApiContextMessages) {
            const contextMessages = window.imApp.buildApiContextMessages(friend, {
                userName: userState.name || 'User'
            });

            if (Array.isArray(contextMessages) && contextMessages.length > 0) {
                messages.push(...contextMessages);
            }
        }
        if (messages.length === 1) messages.push({ role: 'user', content: 'Hello' });

        const trailingContexts = [];
        if (friend.memory && friend.memory.anniversaries && String(friend.memory.anniversaries).trim()) {
            trailingContexts.push(`[Anniversaries / 纪念日 - 请关注以下纪念日信息：]\n${friend.memory.anniversaries}`);
        }
        if (friend.memory && friend.memory.cherished && String(friend.memory.cherished).trim()) {
            trailingContexts.push(`[Important Cherished Memories / 珍视回忆 - 请深刻记住并参考这些回忆：]\n${friend.memory.cherished}`);
        }
        if (trailingContexts.length > 0) {
            messages.push({
                role: 'system',
                content: trailingContexts.join('\n\n')
            });
        }

        if (shouldSummarizeThisTurn) {
            const summaryPrompt = friend.memory.summary?.prompt || window.imApp.createDefaultMemory().summary.prompt;
            messages.push({
                role: 'system',
                content: `【系统指令】：本次回复除了正常的聊天内容外，你必须额外输出一个 <summary_block>...</summary_block>。\n在标签内，请根据以下提示词对最近的对话进行总结：\n${summaryPrompt}\n总结必须尽量简明扼要，且包含具体的关键信息。`
            });
        }

        // Skip API call and return immediately if chatting with official account
        if (friend.type === 'official') {
            if (typingRow && typingRow.parentNode) typingRow.remove();
            if (btnEl) btnEl.style.opacity = '1';
            return;
        }

        try {
            let endpoint = apiConfig.endpoint;
            if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if(!endpoint.endsWith('/chat/completions')) {
                endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.apiKey}` },
                body: JSON.stringify({
                    model: apiConfig.model || '',
                    messages: messages,
                    temperature: parseFloat(apiConfig.temperature) || 0.7
                })
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            let fullReply = data.choices[0].message.content;

            if (typingRow) typingRow.remove();

            const profilePanelBlock = window.imChat.extractTaggedBlock(fullReply, 'profile_panel');
            const nextProfilePanel = window.imChat.normalizeProfilePanelPayload
                ? window.imChat.normalizeProfilePanelPayload(profilePanelBlock)
                : null;

            if (profilePanelBlock) {
                fullReply = window.imChat.removeTaggedBlock(fullReply, 'profile_panel');
            }

            const summaryBlock = window.imChat.extractTaggedBlock(fullReply, 'summary_block');
            if (summaryBlock) {
                fullReply = window.imChat.removeTaggedBlock(fullReply, 'summary_block');
                
                if (window.imApp.commitScopedFriendChange) {
                    await window.imApp.commitScopedFriendChange(friend.id, (targetFriend) => {
                        if (!targetFriend) return;
                        if (!targetFriend.memory) targetFriend.memory = {};
                        if (targetFriend.type === 'group') {
                            // 群聊存入 overview 或长期记忆中，此处选 overview 累加
                            targetFriend.memory.overview = (targetFriend.memory.overview || '') + '\n' + summaryBlock;
                        } else {
                            if (!Array.isArray(targetFriend.memory.longTermEntries)) {
                                targetFriend.memory.longTermEntries = [];
                                if (targetFriend.memory.longTerm) {
                                    targetFriend.memory.longTermEntries.push({
                                        id: `ltm-${Date.now()}-0`,
                                        title: '原有长期记忆',
                                        content: targetFriend.memory.longTerm,
                                        time: ''
                                    });
                                }
                            }
                            
                            const currentTime = new Date();
                            const timeString = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')} ${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
                            
                            targetFriend.memory.longTermEntries.push({
                                id: `ltm-${Date.now()}-1`,
                                title: '对话总结',
                                content: summaryBlock,
                                time: timeString
                            });
                        }
                        targetFriend.memory.lastSummaryMessageCount = (targetFriend.messages || []).length + 1;
                    }, { silent: true, metaOnly: true });
                }
            } else if (shouldSummarizeThisTurn) {
                if (window.imApp.commitScopedFriendChange) {
                    await window.imApp.commitScopedFriendChange(friend.id, (targetFriend) => {
                        if (!targetFriend) return;
                        if (!targetFriend.memory) targetFriend.memory = {};
                        targetFriend.memory.lastSummaryMessageCount = (targetFriend.messages || []).length + 1;
                    }, { silent: true, metaOnly: true });
                }
            }

            if (nextProfilePanel && friend.type !== 'group') {
                const profileFriend = getLiveFriendById(friend.id) || friend;

                if (window.imApp.commitScopedFriendChange) {
                    await window.imApp.commitScopedFriendChange(profileFriend.id || friend.id, (targetFriend) => {
                        if (!targetFriend) return;

                        const basePanel = window.imApp.createDefaultProfilePanel
                            ? window.imApp.createDefaultProfilePanel(targetFriend)
                            : (targetFriend.profilePanel || { activeTab: 'thought', thought: '', status: 'online', events: [] });

                        const oldAffection = typeof basePanel.affection === 'number' ? basePanel.affection : 50;
                        const affectionChange = nextProfilePanel.affectionChange || 0;
                        const newAffection = Math.max(0, Math.min(100, oldAffection + affectionChange));

                        targetFriend.profilePanel = {
                            ...basePanel,
                            thought: nextProfilePanel.thought || basePanel.thought || '',
                            location: nextProfilePanel.location || basePanel.location || '未知位置',
                            action: nextProfilePanel.action || basePanel.action || '暂无动作',
                            mood: nextProfilePanel.mood || basePanel.mood || '平静',
                            expression: nextProfilePanel.expression || basePanel.expression || '自然',
                            affection: newAffection,
                            affectionChange: affectionChange,
                            status: isSleeping ? 'offline' : 'online',
                            events: (() => {
                                const existingEvents = Array.isArray(basePanel.events) ? basePanel.events : [];
                                const mergedEvents = [...existingEvents];
                                
                                if (Array.isArray(nextProfilePanel.events)) {
                                    nextProfilePanel.events.forEach((eventItem, index) => {
                                        const safeId = eventItem?.id != null ? eventItem.id : `event-${Date.now()}-${index}`;
                                        const newEv = {
                                            ...eventItem,
                                            id: safeId,
                                            status: eventItem?.status || 'pending',
                                            confirmText: eventItem?.confirmText || '确认',
                                            cancelText: eventItem?.cancelText || '取消',
                                            memoryPayload: eventItem?.memoryPayload && typeof eventItem.memoryPayload === 'object'
                                                ? {
                                                    title: eventItem.memoryPayload.title || eventItem?.title || '珍视回忆',
                                                    content: eventItem.memoryPayload.content || eventItem?.requestText || eventItem?.description || '',
                                                    detail: eventItem.memoryPayload.detail || eventItem?.detail || '',
                                                    reason: eventItem.memoryPayload.reason || '',
                                                    sourceEventId: eventItem.memoryPayload.sourceEventId || String(safeId),
                                                    createdAt: eventItem.memoryPayload.createdAt || eventItem?.time || '',
                                                    sourceThought: eventItem.memoryPayload.sourceThought || nextProfilePanel.thought || ''
                                                }
                                                : null
                                        };
                                        if (!mergedEvents.some(oe => oe.title === newEv.title)) {
                                            mergedEvents.push(newEv);
                                        }
                                    });
                                }
                                return mergedEvents.slice(-5);
                            })()
                        };
                        targetFriend.latestThought = targetFriend.profilePanel.thought;
                        targetFriend.status = isSleeping ? 'offline' : 'online';
                    }, {
                        syncActive: true,
                        metaOnly: true,
                        silent: true
                    });
                }

                const latestProfileFriend = getLiveFriendById(profileFriend.id || friend.id) || profileFriend;
                const page = document.getElementById(`chat-interface-${latestProfileFriend.id}`);
                const profilePanelOverlay = page ? page.querySelector('.chat-profile-panel-overlay') : null;
                if (profilePanelOverlay && profilePanelOverlay.classList.contains('active') && window.imChat.renderProfilePanel) {
                    window.imChat.renderProfilePanel(latestProfileFriend, profilePanelOverlay);
                }

                scheduleFriendPersistence(latestProfileFriend.id || friend.id, {
                    delay: 800,
                    silent: true
                });
            }

            if (!fullReply) {
                if(btnEl) btnEl.style.opacity = '1';
                await flushFriendPersistence(friend.id, { silent: true });
                return;
            }

            let structuredItems = null;
            const chatJsonBlock = window.imChat.extractTaggedBlock(fullReply, 'chat_json');
            if (chatJsonBlock) {
                structuredItems = window.imChat.parseJsonArrayFromText(chatJsonBlock);
                fullReply = window.imChat.removeTaggedBlock(fullReply, 'chat_json');
            }

            if (!structuredItems) {
                const directJsonArray = window.imChat.parseJsonArrayFromText(fullReply);
                if (directJsonArray) {
                    structuredItems = directJsonArray;
                    fullReply = '';
                }
            }

            let queueItems = [];

            if (structuredItems && structuredItems.length > 0) {
                queueItems = structuredItems.map(item => {
                    if (!item || typeof item !== 'object') return null;

                    const itemType = typeof item.type === 'string' ? item.type.trim().toLowerCase() : '';
                    if (itemType === 'red_packet') {
                        const amount = Number(item.amount);
                        const count = parseInt(item.count, 10) || 5;
                        if (!Number.isFinite(amount) || amount <= 0) return null;

                        return {
                            kind: 'red_packet',
                            amount,
                            count,
                            description: typeof item.description === 'string' ? item.description.trim() || '恭喜发财' : '恭喜发财',
                            speaker: typeof item.speaker === 'string' ? item.speaker.trim() : ''
                        };
                    }
                    if (itemType === 'payment' || item.paymentAction) {
                        const amount = Number(item.amount);
                        if (!Number.isFinite(amount) || amount <= 0) return null;

                        return {
                            kind: 'payment',
                            paymentAction: item.paymentAction === 'transfer' ? 'transfer' : 'receive',
                            amount,
                            description: typeof item.description === 'string' ? item.description.trim() || '转账' : '转账'
                        };
                    }

                    const text = typeof item.text === 'string' ? item.text.trim() : '';
                    if (!text) return null;

                    return {
                        kind: 'text',
                        text,
                        translation: typeof item.translation === 'string'
                            ? item.translation.trim()
                            : (typeof item.trans === 'string' ? item.trans.trim() : ''),
                        replyTo: typeof item.quote === 'string' ? item.quote.trim() : '',
                        speaker: typeof item.speaker === 'string' ? item.speaker.trim() : ''
                    };
                }).filter(Boolean);
            }

            if (queueItems.length === 0) {
                let fullTranslation = null;
                const transRegex = /<translation>([\s\S]*?)<\/translation>/i;
                const transMatch = fullReply.match(transRegex);
                if (transMatch) {
                    fullTranslation = transMatch[1].trim();
                    fullReply = fullReply.replace(transRegex, '').trim();
                }

                let sentences = [];
                if (friend.type === 'group') {
                    sentences = fullReply.split(/\n+/).map(s => s.trim()).filter(s => s.length > 0);
                } else if (fullTranslation) {
                    sentences = [fullReply];
                } else {
                    sentences = fullReply.split(/(?<=[。！？.!?\n])/).map(s => s.trim()).filter(s => s.length > 0);

                    if (sentences.length > 7) {
                        while (sentences.length > 7) {
                            let minLen = Infinity;
                            let minIdx = 0;
                            for (let i = 0; i < sentences.length - 1; i++) {
                                let len = sentences[i].length + sentences[i + 1].length;
                                if (len < minLen) {
                                    minLen = len;
                                    minIdx = i;
                                }
                            }
                            sentences[minIdx] = sentences[minIdx] + ' ' + sentences[minIdx + 1];
                            sentences.splice(minIdx + 1, 1);
                        }
                    } else if (sentences.length < 3 && fullReply.length > 30) {
                        sentences = fullReply.split(/(?<=[。！？.!?\n，,])/).map(s => s.trim()).filter(s => s.length > 0);
                        if (sentences.length > 7) sentences = sentences.slice(0, 7);
                    }
                }

                if (sentences.length === 0 && fullReply) sentences = [fullReply];

                queueItems = sentences.map(text => ({
                    text,
                    translation: fullTranslation || '',
                    replyTo: '',
                    speaker: ''
                }));
            }

            if (queueItems.length === 0) {
                if(btnEl) btnEl.style.opacity = '1';
                await flushFriendPersistence(friend.id, { silent: true });
                return;
            }

            let qIndex = 0;
            const now = Date.now();
            const bannerPreviewText = queueItems.map(item => item.text).filter(Boolean).join(' ').trim() || fullReply;

            // Re-fetch the container safely in case user navigated away
            const getSafeContainer = () => {
                const pageId = `chat-interface-${friend.id}`;
                const page = document.getElementById(pageId);
                return page ? page.querySelector('.ins-chat-messages') : null;
            };

            const safeContainer = getSafeContainer();
            const currentHistoryFriend = getLiveFriendById(friend.id) || friend;
            const lastHistoryMsg = currentHistoryFriend.messages && currentHistoryFriend.messages.length > 0
                ? currentHistoryFriend.messages[currentHistoryFriend.messages.length - 1]
                : null;

            if (safeContainer && (!lastHistoryMsg || (now - (lastHistoryMsg.timestamp || 0) > 300000))) {
                window.imChat.renderTimestamp(now, safeContainer);
            }

            let lastGroupSpeaker = null;

            async function processNextSentence() {
                const currentItem = queueItems[qIndex] || {};

                if (currentItem.kind === 'red_packet') {
                    const activeFriend = getLiveFriendById(friend.id) || friend;
                    const totalAmount = Number(currentItem.amount) || 0;
                    const packetCount = parseInt(currentItem.count, 10) || 5;
                    const description = currentItem.description || '恭喜发财';
                    let speakerName = currentItem.speaker || lastGroupSpeaker || '群成员';
                    let detectedSpeaker = null;

                    if (activeFriend.type === 'group') {
                        detectedSpeaker = window.imChat.normalizeGroupSpeaker(activeFriend, speakerName);
                        if (!detectedSpeaker && lastGroupSpeaker) {
                            detectedSpeaker = window.imChat.normalizeGroupSpeaker(activeFriend, lastGroupSpeaker);
                        }
                    }

                    if (detectedSpeaker) {
                        speakerName = detectedSpeaker.nickname || detectedSpeaker.realName;
                        lastGroupSpeaker = speakerName;
                    }

                    if (totalAmount > 0) {
                        const nowMsg = Date.now();
                        const allocations = window.imChat.createRedPacketAllocations(totalAmount, packetCount);

                        const packetMsg = window.imChat.normalizeGroupRedPacketState({
                            id: window.imChat.createMessageId('packet'),
                            packetId: window.imChat.createMessageId('packet'),
                            role: 'assistant',
                            type: 'group_red_packet',
                            totalAmount,
                            packetCount,
                            description,
                            allocations,
                            claimRecords: [],
                            claimedMemberIds: [],
                            content: `[群红包] ${description} ¥${Number(totalAmount).toFixed(2)}`,
                            timestamp: nowMsg,
                            speakerMemberId: detectedSpeaker ? detectedSpeaker.id : '',
                            senderName: speakerName,
                            senderAvatarUrl: detectedSpeaker ? detectedSpeaker.avatarUrl : ''
                        }, activeFriend);

                        const freshContainer = getSafeContainer();
                        const isUserStillLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(activeFriend.id) && freshContainer;

                        const appended = window.imApp.appendFriendMessage
                            ? await window.imApp.appendFriendMessage(activeFriend.id || friend.id, packetMsg, { silent: true })
                            : false;

                        if (!appended) {
                            if (window.showToast) window.showToast('群红包消息保存失败');
                            return false;
                        }

                        if (isUserStillLooking) {
                            window.imChat.renderGroupRedPacketBubble(packetMsg, activeFriend, freshContainer, nowMsg);
                        }
                    }

                    qIndex++;
                    return true;
                }

                if (currentItem.kind === 'payment') {
                    const activeFriend = getLiveFriendById(friend.id) || friend;
                    const paymentAction = currentItem.paymentAction === 'transfer' ? 'transfer' : 'receive';
                    const paymentAmount = Number(currentItem.amount) || 0;
                    const paymentDescription = currentItem.description || '转账';

                    if (paymentAmount > 0) {
                        const nowMsg = Date.now();
                        const paymentMsg = {
                            id: window.imChat.createMessageId('pay'),
                            role: 'assistant',
                            type: 'pay_transfer',
                            payKind: paymentAction === 'transfer' ? 'char_to_user_pending' : 'char_received',
                            amount: paymentAmount,
                            description: paymentDescription,
                            targetName: paymentAction === 'transfer'
                                ? (activeFriend.nickname || activeFriend.realName || '对方')
                                : (userState.name || '用户'),
                            cardTitle: paymentAction === 'transfer' ? '转账' : '收款',
                            payStatus: 'completed',
                            content: paymentAction === 'transfer'
                                ? `[角色转账] ${paymentDescription} ¥${paymentAmount.toFixed(2)}`
                                : `[收下转账] ${paymentDescription} ¥${paymentAmount.toFixed(2)}`,
                            timestamp: nowMsg
                        };

                        const freshContainer = getSafeContainer();
                        const isUserStillLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(activeFriend.id) && freshContainer;

                        const appended = window.imApp.appendFriendMessage
                            ? await window.imApp.appendFriendMessage(activeFriend.id || friend.id, paymentMsg, { silent: true })
                            : false;

                        if (!appended) {
                            if (window.showToast) window.showToast('转账消息保存失败');
                            return false;
                        }

                        if (isUserStillLooking) {
                            window.imChat.renderPayTransferBubble(paymentMsg, activeFriend, freshContainer, nowMsg);
                        }
                    }

                    qIndex++;
                    return true;
                }

                let text = typeof currentItem.text === 'string' ? currentItem.text.trim() : '';
                let aiReplyTo = typeof currentItem.replyTo === 'string' && currentItem.replyTo.trim() ? currentItem.replyTo.trim() : null;
                const itemTranslation = typeof currentItem.translation === 'string' && currentItem.translation.trim()
                    ? currentItem.translation.trim()
                    : null;

                if (!text) {
                    qIndex++;
                    return true;
                }

                if (!structuredItems) {
                    const quoteRegex = /<quote>([\s\S]*?)<\/quote>/i;
                    const quoteMatch = text.match(quoteRegex);
                    if (quoteMatch) {
                        aiReplyTo = quoteMatch[1].trim();
                        text = text.replace(quoteRegex, '').trim();
                    }
                }

                let currentSpeakerName = null;
                let currentSpeakerAvatar = null;
                const speakerFriend = getLiveFriendById(friend.id) || friend;
                if (speakerFriend.type === 'group') {
                    let detectedSpeaker = null;

                    if (structuredItems && currentItem.speaker) {
                        detectedSpeaker = window.imChat.normalizeGroupSpeaker(speakerFriend, currentItem.speaker);
                    } else {
                        const nameRegex = /^([a-zA-Z0-9\u4e00-\u9fa5\s_\-.]+)[：:]\s*/;
                        const nameMatch = text.match(nameRegex);

                        if (nameMatch) {
                            detectedSpeaker = window.imChat.normalizeGroupSpeaker(speakerFriend, nameMatch[1].trim());
                            text = text.substring(nameMatch[0].length).trim();
                        } else if (lastGroupSpeaker) {
                            detectedSpeaker = window.imChat.normalizeGroupSpeaker(speakerFriend, lastGroupSpeaker);
                        }
                    }

                    if (!detectedSpeaker) {
                        detectedSpeaker = window.imChat.getSafeGroupSpeaker(speakerFriend, lastGroupSpeaker);
                    }

                    if (detectedSpeaker) {
                        currentSpeakerName = detectedSpeaker.nickname;
                        currentSpeakerAvatar = detectedSpeaker.avatarUrl || null;
                        lastGroupSpeaker = currentSpeakerName;
                    }
                }

                if (!text) {
                    qIndex++;
                    return true;
                }

                const delay = Math.max(500, Math.min(2000, text.length * 50));

                // Only show typing animation if the user is STILL in this chat
                const currentContainer = getSafeContainer();
                const isUserLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(friend.id) && currentContainer;

                let tr = null;
                if (isUserLooking) {
                    tr = document.createElement('div');
                    tr.className = 'chat-row ai-row typing-row';
                    tr.innerHTML = `
                        <div class="typing-indicator">
                            <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                        </div>
                    `;

                    const lastRow = currentContainer.lastElementChild;
                    if (lastRow && lastRow.classList.contains('ai-row') && !lastRow.classList.contains('typing-row')) {
                        lastRow.classList.add('has-next');
                        tr.classList.add('has-prev');
                    }

                    currentContainer.appendChild(tr);
                    window.imChat.scrollToBottom(currentContainer);
                }

                await new Promise(res => setTimeout(res, delay));

                if (tr && tr.parentNode) {
                    tr.remove();
                }

                const nowMsg = Date.now();
                const msgObj = { id: window.imChat.createMessageId('msg'), role: 'assistant', content: text, timestamp: nowMsg, replyTo: aiReplyTo };
                if (currentSpeakerName) msgObj.speaker = currentSpeakerName;
                if (itemTranslation) {
                    msgObj.translation = itemTranslation;
                    msgObj.showTranslation = false;
                }

                // Only attempt to render bubble if user is STILL in this chat
                const freshContainer = getSafeContainer();
                const renderFriend = getLiveFriendById(friend.id) || friend;
                const isUserStillLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(renderFriend.id) && freshContainer;

                if (isUserStillLooking) {
                    window.imChat.renderAiBubble(text, renderFriend, freshContainer, nowMsg, msgObj.translation, msgObj.showTranslation, msgObj.replyTo, currentSpeakerName, currentSpeakerAvatar, msgObj.id);
                }

                const appended = window.imApp.appendFriendMessage
                    ? await window.imApp.appendFriendMessage(renderFriend.id || friend.id, msgObj, { silent: true })
                    : false;

                if (!appended) {
                    const rollbackContainer = getSafeContainer();
                    const rollbackFriend = getLiveFriendById(friend.id) || friend;
                    if (rollbackContainer && window.imChat.rerenderChatContainer) {
                        window.imChat.rerenderChatContainer(rollbackFriend, rollbackContainer, { scroll: true });
                    }
                    if (window.showToast) window.showToast('AI 消息保存失败');
                    if (btnEl) btnEl.style.opacity = '1';
                    return false;
                }

                qIndex++;
                return true;
            }

            while (qIndex < queueItems.length) {
                const processed = await processNextSentence();
                if (!processed) {
                    return;
                }
            }

            const latestFriend = getLiveFriendById(friend.id) || friend;
            const redPacketChanged = latestFriend.type === 'group'
                ? window.imChat.processPendingGroupRedPackets(latestFriend)
                : false;

            if (redPacketChanged) {
                scheduleFriendPersistence(latestFriend.id || friend.id, {
                    delay: 1200,
                    silent: true
                });

                const latestContainer = getSafeContainer();
                const isActiveChat = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(latestFriend.id);

                if (isActiveChat && latestContainer && window.imChat.rerenderChatContainer) {
                    window.imChat.rerenderChatContainer(latestFriend, latestContainer, { scroll: true });
                }
            }

            await flushFriendPersistence(latestFriend.id || friend.id, { silent: true });
            if (btnEl) btnEl.style.opacity = '1';

            if (!window.imData.currentActiveFriend || String(window.imData.currentActiveFriend.id) !== String(latestFriend.id)) {
                if (window.imApp.showBannerNotification) {
                    window.imApp.showBannerNotification(latestFriend, bannerPreviewText);
                }
            }

            if (window.imApp.updateChatsView && !window.imData.currentActiveFriend) {
                window.imApp.updateChatsView();
            }

        } catch (error) {
            if (typingRow && typingRow.parentNode) typingRow.remove();
            if (window.showToast) window.showToast('API 请求失败');
            console.error(error);
            if (btnEl) btnEl.style.opacity = '1';
        }
    }

    window.imChat.handleSend = handleSend;
    window.imChat.extractTaggedBlock = extractTaggedBlock;
    window.imChat.removeTaggedBlock = removeTaggedBlock;
    window.imChat.parseJsonArrayFromText = parseJsonArrayFromText;
    window.imChat.normalizeProfilePanelPayload = normalizeProfilePanelPayload;
    window.imChat.handleAiReply = handleAiReply;

});
