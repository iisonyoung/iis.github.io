(function() {
    function initDiaryApp() {
        if (window.diaryApp && window.diaryApp.initialized) return;
    // --- Elements ---
    const diaryView = document.getElementById('diary-view');

    const foldersPage = document.getElementById('diary-folders-page');
    const notesPage = document.getElementById('diary-notes-page');
    const editPage = document.getElementById('diary-edit-page');

    const folderList = document.getElementById('diary-folder-list');
    const notesList = document.getElementById('diary-notes-list');
    const notesTitle = document.getElementById('diary-notes-title');
    const notesCount = document.getElementById('diary-notes-count');

    const homeBackBtn = document.getElementById('diary-home-back-btn');
    const notesBackBtn = document.getElementById('diary-notes-back');
    const editBackBtn = document.getElementById('diary-edit-back');
    const newEntryBtn = document.getElementById('diary-new-entry-btn');
    const newNoteBtn = document.getElementById('diary-new-note-btn');
    const editDoneBtn = document.getElementById('diary-edit-done');

    const editorDate = document.getElementById('diary-editor-date');
    const editorInput = document.getElementById('diary-editor-input');
    
    // Removed old editorPreview logic since we now use a real contenteditable div

    // --- State ---
    let diaryData = []; // [{ id, text, time, folder, originalFolder?, originalFolderTitle?, deletedAt?, deletedAuthorName? }]
    let currentFolder = '';
    let currentFolderTitle = '';
    let currentNoteId = null;
    let isEditMode = false;
    let pageTransitionLock = false;

    // --- Data Management ---
    function loadDiaryData() {
        const saved = typeof window.getAppState === 'function'
            ? window.getAppState('diary')
            : null;
        diaryData = Array.isArray(saved?.notes) ? saved.notes : [];
    }

    function saveDiaryData() {
        const nextState = {
            notes: Array.isArray(diaryData) ? diaryData : []
        };

        if (typeof window.setAppState === 'function') {
            window.setAppState('diary', nextState);
        } else if (window.saveGlobalData) {
            window.saveGlobalData();
        }
    }

    // --- Utility ---
    function formatDate(timeMs, formatType = 'short') {
        const date = new Date(timeMs);
        if (formatType === 'long') {
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours() < 12 ? '上午' : '下午'}${(date.getHours() % 12 || 12)}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else if (formatType === 'medium') {
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        }
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    // Helper to strip HTML for list preview
    function stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function getFirstLine(text) {
        if (!text) return '新備忘錄';
        
        // Remove all HTML tags and excessive newlines
        const pureText = text.replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim();
        const lines = pureText.split('\n');
        
        // Return first non-empty line
        return lines[0] || '新備忘錄';
    }

    function getSecondLinePreview(text) {
        if (!text) return '没有附加文本';
        
        // Find if there's an image or AI image block in the HTML to show a nice preview tag
        const hasImage = text.includes('<img') || text.includes('diary-ai-image-block') || text.includes('diary-image-container');
        
        // Remove all HTML tags and excessive newlines
        const pureText = text.replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim();
        const lines = pureText.split('\n');
        
        // Typically line 0 is Title, line 1 is Date, line 2+ is body.
        // Let's find the first line that is NOT the title and NOT a date string
        for (let i = 1; i < lines.length; i++) {
            const l = lines[i].trim();
            if (l && !l.match(/^\d{4}年\d{1,2}月\d{1,2}日/)) {
                return l;
            }
        }
        
        return hasImage ? '[图片]' : '没有附加文本';
    }

    function getCurrentDiaryUserFolderKey() {
        const currentId = typeof window.getCurrentAccountId === 'function'
            ? window.getCurrentAccountId()
            : null;
        return currentId ? String(currentId) : (window.userState?.name || 'User');
    }

    function getCurrentDiaryUserFolderDisplayName() {
        const currentKey = getCurrentDiaryUserFolderKey();
        const accounts = typeof window.getAccounts === 'function' ? window.getAccounts() : [];
        const currentAccount = accounts.find(acc => String(acc.id) === String(currentKey));
        return currentAccount?.name || window.userState?.name || 'User';
    }

    function getCurrentDiaryUserFolderName() {
        return getCurrentDiaryUserFolderKey();
    }

    function getDeletedFolderName() {
        return '最近删除';
    }

    function isDeletedFolder(folderName = currentFolder) {
        return folderName === getDeletedFolderName();
    }

    function isUserFolder(folderName = currentFolder) {
        return folderName === getCurrentDiaryUserFolderKey();
    }

    function getFolderDisplayName(folderName) {
        if (!folderName) return '未知来源';
        if (folderName === getCurrentDiaryUserFolderKey()) {
            return getCurrentDiaryUserFolderDisplayName();
        }
        return String(folderName);
    }

    function getDeletedAuthorName(note) {
        if (note?.deletedAuthorName) return note.deletedAuthorName;
        if (note?.originalFolderTitle) return note.originalFolderTitle;
        if (note?.originalFolder) return getFolderDisplayName(note.originalFolder);
        return '未知来源';
    }

    function getNoteListTime(note, folderName = currentFolder) {
        if (isDeletedFolder(folderName)) {
            return note.deletedAt || note.time;
        }
        return note.time;
    }

    function clearDeletedMetadata(note) {
        delete note.originalFolder;
        delete note.originalFolderTitle;
        delete note.deletedAt;
        delete note.deletedAuthorName;
    }

    function moveNoteToRecentlyDeleted(note) {
        if (!note || isDeletedFolder(note.folder)) return false;

        const originalFolder = note.folder;
        note.originalFolder = originalFolder;
        note.originalFolderTitle = getFolderDisplayName(originalFolder);
        note.deletedAuthorName = getFolderDisplayName(originalFolder);
        note.deletedAt = Date.now();
        note.folder = getDeletedFolderName();

        return true;
    }

    function restoreDeletedNote(note) {
        if (!note || !note.originalFolder || note.originalFolder === getDeletedFolderName()) {
            return false;
        }

        note.folder = note.originalFolder;
        clearDeletedMetadata(note);

        return true;
    }

    function permanentlyDeleteNote(noteId) {
        const nextData = diaryData.filter(n => n.id !== noteId);
        const changed = nextData.length !== diaryData.length;
        diaryData = nextData;
        return changed;
    }

    function setEditButtonMode(mode = 'edit') {
        if (!editDoneBtn) return;
        if (mode === 'check') {
            editDoneBtn.innerHTML = '<i class="fas fa-check"></i>';
            editDoneBtn.classList.add('diary-nav-done');
        } else {
            editDoneBtn.innerHTML = '<i class="far fa-pen-to-square"></i>';
            editDoneBtn.classList.remove('diary-nav-done');
        }
    }

    function setEditorEditable(editable) {
        isEditMode = !!editable;
        const toolbar = document.querySelector('#diary-edit-page .diary-editor-toolbar');
        
        if (editorInput) {
            editorInput.setAttribute('contenteditable', editable ? 'true' : 'false');
            if (editable) {
                // When editable, ensure standard caret behavior
                editorInput.style.userSelect = 'auto';
                if (toolbar) toolbar.style.display = 'flex';
            } else {
                // When not editable, allow selection but not typing
                editorInput.style.userSelect = 'text';
                if (toolbar) toolbar.style.display = 'none';
            }
        }
        setEditButtonMode(editable ? 'check' : 'edit');
    }

    // Function to convert Markdown to HTML explicitly for AI output
    function markdownToHtml(text) {
        if (!text.trim()) return '';

        const lines = text.split('\n');
        let html = '';

        // Title (Line 1)
        if (lines.length > 0) {
            let title = lines[0].replace(/^[#【】\[\]*]+|[#【】\[\]*]+$/g, '').trim();
            html += `<div style="font-size: 26px; font-weight: bold; margin-bottom: 12px; line-height: 1.2;">${title || '无标题'}</div>`;
        }

        // Time (Line 2)
        if (lines.length > 1) {
            let timeStr = lines[1].trim();
            timeStr = timeStr.replace(/^(时间：|日期：)/i, '').trim();
            if (timeStr) {
                html += `<div style="margin-bottom: 16px;">
                            <span style="display: inline-block; background: rgba(142, 142, 147, 0.15); color: #8e8e93; font-weight: 600; padding: 4px 12px; border-radius: 14px; font-size: 14px;">
                                ${timeStr}
                            </span>
                         </div>`;
            }
        }

        // Basic Markdown Parser for Body
        function parseLine(line) {
            let parsed = line;
            // Clean up potentially conflicting characters before parsing
            parsed = parsed.replace(/</g, '<').replace(/>/g, '>');
            
            parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
            parsed = parsed.replace(/~~(.*?)~~/g, '<del>$1</del>');
            parsed = parsed.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>');
            parsed = parsed.replace(/`(.*?)`/g, '<span style="background: rgba(0,0,0,0.05); color: #555; border-radius: 6px; padding: 2px 6px; font-family: monospace; font-size: 15px;">$1</span>');
            return parsed;
        }

        // Body (Line 3+)
        if (lines.length > 2) {
            for (let i = 2; i < lines.length; i++) {
                let p = lines[i].trim();
                // Strip out markdown code block artifacts just in case
                if (p.startsWith('```')) continue;
                
                if (p === '') {
                    html += `<div><br></div>`;
                    continue;
                }
                
                // Check for AI Image block
                const imgMatch = p.match(/^\[图片：(.*?)\]$/);
                if (imgMatch) {
                    const desc = imgMatch[1].trim();
                    // Added contenteditable="false", aspect-ratio: 1/1, and tighter margin
                    html += `<div class="diary-ai-image-block" contenteditable="false" data-desc="${desc}" style="display: block; clear: both; width: 100%; aspect-ratio: 1 / 1; background: #e5e5ea; border-radius: 12px; margin: 8px 0 12px 0; flex-direction: column; justify-content: center; align-items: center; color: #8e8e93; cursor: pointer; text-align: center; padding: 10px; box-sizing: border-box; overflow: hidden; position: relative;">
                                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; width: 100%; pointer-events: none;">
                                    <i class="fas fa-camera" style="font-size: 36px; margin-bottom: 12px;"></i>
                                    <div style="font-size: 14px; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${desc}</div>
                                </div>
                             </div>`; // removed the trailing <br> block to tighten space
                    continue;
                }

                // Check for Todo items
                const todoMatch = p.match(/^- \[([ xX])\]\s+(.*)/);
                if (todoMatch) {
                    const isChecked = todoMatch[1].toLowerCase() === 'x';
                    const content = parseLine(todoMatch[2]);
                    const iconClass = isChecked ? 'far fa-check-circle' : 'far fa-circle';
                    const textStyle = isChecked ? 'color: #8e8e93; text-decoration: line-through;' : 'color: #000;';
                    html += `<div class="diary-todo-item" style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
                                <i class="${iconClass}" style="color: ${isChecked ? '#ffcc00' : '#c7c7cc'}; font-size: 20px; cursor: pointer; margin-top: 2px;"></i>
                                <span style="flex: 1; font-size: 17px; line-height: 1.5; ${textStyle}">${content}</span>
                             </div>`;
                    continue;
                }

                // Check for Headings
                const headingMatch = p.match(/^(#{1,3})\s+(.*)/);
                if (headingMatch) {
                    const level = headingMatch[1].length; // 1, 2, or 3
                    const content = parseLine(headingMatch[2]);
                    
                    if (level === 1) {
                        html += `<div style="font-size: 22px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; line-height: 1.3;">${content}</div>`;
                    } else if (level === 2) {
                        html += `<div style="font-size: 18px; font-weight: 600; margin-top: 14px; margin-bottom: 6px; line-height: 1.3;">${content}</div>`;
                    } else {
                        html += `<div style="font-size: 16px; font-weight: 600; margin-top: 12px; margin-bottom: 4px; line-height: 1.4;">${content}</div>`;
                    }
                } else {
                    html += `<div>${parseLine(p)}</div>`;
                }
            }
        }

        return html;
    }

    async function triggerCharDiaryApi() {
        if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
            if (window.showToast) window.showToast('请先在设置中配置 API Endpoint 和 Key');
            return;
        }

        // Take a snapshot of the current folder state at the exact moment the API is triggered
        const targetFolder = currentFolder;
        const targetFolderTitle = currentFolderTitle || currentFolder;

        const friendName = targetFolderTitle;
        // Try to find the friend object from IM data to get persona
        const friends = typeof window.getImFriends === 'function' ? window.getImFriends() : (window.imData?.friends || []);
        const friend = friends.find(f => (f.nickname || f.name || f.realName) === targetFolder) || { nickname: friendName, persona: '' };

        if (window.showToast) window.showToast('正在写日记...');

        if (newNoteBtn) newNoteBtn.style.opacity = '0.5';

        try {
            let endpoint = window.apiConfig.endpoint;
            if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if(!endpoint.endsWith('/chat/completions')) {
                endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
            }

            const systemDepthWorldBookContext = window.getGlobalWorldBookContextByPosition
                ? window.getGlobalWorldBookContextByPosition('system_depth')
                : '';
            const beforeRoleWorldBookContext = window.getGlobalWorldBookContextByPosition
                ? window.getGlobalWorldBookContextByPosition('before_role')
                : '';
            const afterRoleWorldBookContext = window.getGlobalWorldBookContextByPosition
                ? window.getGlobalWorldBookContextByPosition('after_role')
                : '';
            const friendPersona = friend.persona || 'A normal character.';
            
            let recentMessagesStr = "无";
            if (friend && Array.isArray(friend.messages) && friend.messages.length > 0) {
                 const msgs = friend.messages.slice(-10);
                 // Assuming IM message objects have 'role' ('user'/'assistant') or 'isSelf'
                 recentMessagesStr = msgs.map(m => {
                     const sender = (m.role === 'user' || m.isSelf === true) ? 'User' : friendName;
                     const text = m.content || m.text || '';
                     return `${sender}: ${text}`;
                 }).join('\n');
            }

            // 获取当前角色的最近 3 篇日记记忆 (using targetFolder snapshot)
            const recentNotes = diaryData
                .filter(n => n.folder === targetFolder && !isDeletedFolder(n.folder))
                .sort((a, b) => getNoteListTime(b, targetFolder) - getNoteListTime(a, targetFolder))
                .slice(0, 3)
                .reverse(); // 从旧到新排列，方便 AI 理解时间线

            let recentDiariesStr = "无近期日记。";
            if (recentNotes.length > 0) {
                recentDiariesStr = recentNotes.map((note, index) => {
                    // Extract plain text and meaningful placeholders from HTML
                    const tmp = document.createElement('div');
                    tmp.innerHTML = note.text;
                    
                    // Replace image blocks with clean text tags
                    const imgBlocks = tmp.querySelectorAll('.diary-ai-image-block, .diary-image-container');
                    imgBlocks.forEach(block => {
                        const desc = block.getAttribute('data-desc') || '一张照片';
                        const textNode = document.createTextNode(`\n[图片：${desc}]\n`);
                        block.parentNode.replaceChild(textNode, block);
                    });

                    // Replace todo items with clean text tags
                    const todoItems = tmp.querySelectorAll('.diary-todo-item');
                    todoItems.forEach(todo => {
                        const isChecked = todo.querySelector('.fa-check-circle') !== null;
                        const textSpan = todo.querySelector('span');
                        const text = textSpan ? textSpan.textContent.trim() : '';
                        const textNode = document.createTextNode(`\n- [${isChecked ? 'x' : ' '}] ${text}\n`);
                        todo.parentNode.replaceChild(textNode, todo);
                    });

                    const cleanText = tmp.textContent.trim().replace(/\n{3,}/g, '\n\n'); // Normalize excessive newlines
                    const dateStr = formatDate(note.time, 'long');
                    return `【记忆 ${index + 1} - 撰写时间: ${dateStr}】\n${cleanText}\n`;
                }).join('\n');
            }

            // 获取当前现实时间
            const now = new Date();
            const days = ['日', '一', '二', '三', '四', '五', '六'];
            const currentDateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;

            const systemPrompt = `${systemDepthWorldBookContext ? `System Depth Rules (Highest Priority):\n${systemDepthWorldBookContext}\n\n` : ''}${beforeRoleWorldBookContext ? `Before Role Rules:\n${beforeRoleWorldBookContext}\n\n` : ''}扮演 ${friendName}，以第一人称视角写一篇日记。
你的核心人设是：${friendPersona}
${afterRoleWorldBookContext ? `\n\nAfter Role Rules:\n${afterRoleWorldBookContext}` : ''}

【近期记忆上下文】
与 User 最近的聊天记录：\n${recentMessagesStr}
你最近写过的日记：\n${recentDiariesStr}

【当前任务】
当前现实时间是：${currentDateStr}。请为今天写一篇新的日记。
**极度重要指令**：请务必保证本次日记是时间线上的自然延续，**绝对不要**重复上述近期日记中已经写过的事件、心理活动或图片！开启新的一天、新的感悟或推进新的剧情发展。

请严格遵循以下生成格式要求：
1. 【格式要求】：
   - 第 1 行：大号标题（必须简短醒目，不超过 15 个字，不需要加#号）
   - 第 2 行：写日记的时间（除非你的人设或世界书明确处于古代或异世界，否则请使用上面提供的当前现实时间，如 "${currentDateStr}"）
   - 第 3 行起：日记正文（100-300 字）
2. 【排版要求】：
   - 你可以自由且丰富地使用 Markdown 语法进行排版。
   - 例如使用 \`# 大标题\`，\`## 小标题\`，\`### 子标题\`。
   - 重点词句使用 \`**粗体**\`、\`*斜体*\`、\`~~删除线~~\` 或 \`<u>下划线</u>\` 强调。
   - 如果需要列出清单或待办，请使用 \`- [ ] 待办事项\` 和 \`- [x] 完成事项\` 语法。
3. 【内容要求】：
   - 必须基于你的核心人设、全局世界书（若有）以及与 User 的近期聊天记录等信息来创作。
   - 写出你最真实的内心与感受。
   - 记录无法言说或难以整合的片段。
   - 不写完整事件或直接叙述。
   - 允许停顿、断裂与留白。
   - 保持整体节奏与连贯。
   - 含细微情感指向与思考。
   - 如果你想在日记里配图，请独占一行使用 \`[图片：这里是关于这张图片的详细描述]\` 的格式。
   - 不要包含任何思考过程、Markdown 代码块或多余的前言后语，请直接输出上述 3 部分内容。`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: window.apiConfig.model || '',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: '请开始写日记。' }],
                    temperature: parseFloat(window.apiConfig.temperature) || 0.7
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            let aiReply = data.choices[0].message.content.trim();

            // Remove <think>...</think> if present (e.g. DeepSeek-R1)
            aiReply = aiReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

            // Clean up possible markdown artifacts if model adds them
            if (aiReply.startsWith('```')) {
                const match = aiReply.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
                if (match) {
                    aiReply = match[1].trim();
                } else {
                    aiReply = aiReply.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
                }
            }

            // Convert AI Markdown to rich HTML before saving
            const richHtml = markdownToHtml(aiReply);

            // Save the generated note
            const newNote = {
                id: Date.now().toString(),
                text: richHtml, // Save the rich HTML directly!
                time: Date.now(),
                folder: targetFolder // Save explicitly to the snapshot folder!
            };
            diaryData.push(newNote);
            saveDiaryData();
            
            if (window.showToast) window.showToast('日记已生成并保存！');
            
            // Only jump to/refresh UI if the user is STILL looking at the target folder
            if (currentFolder === targetFolder) {
                renderNotesList(targetFolder);
                openEditNote(newNote);
            }

        } catch (error) {
            console.error('Diary API Error:', error);
            if (window.showToast) window.showToast('日记生成失败，请检查 API 配置或网络');
        } finally {
            if (newNoteBtn) newNoteBtn.style.opacity = '1';
        }
    }

    function resetPageClasses(page) {
        if (!page) return;
        page.classList.remove(
            'diary-page-active',
            'diary-page-enter-from-right',
            'diary-page-enter-from-left',
            'diary-page-enter-active',
            'diary-page-exit-to-left',
            'diary-page-exit-to-right',
            'diary-page-underlay-left',
            'diary-page-underlay-right',
            'diary-page-exit-fade'
        );
    }

    function showOnlyPage(activePage) {
        [foldersPage, notesPage, editPage].forEach(page => {
            if (!page) return;
            resetPageClasses(page);
            page.style.display = page === activePage ? 'flex' : 'none';
            if (page === activePage) {
                page.classList.add('diary-page-active');
            }
        });
    }

    function transitionPages(fromPage, toPage, direction = 'forward', onBeforeEnter) {
        if (!toPage || pageTransitionLock) return;
        if (!fromPage || fromPage === toPage) {
            if (typeof onBeforeEnter === 'function') onBeforeEnter();
            showOnlyPage(toPage);
            return;
        }

        pageTransitionLock = true;

        if (typeof onBeforeEnter === 'function') onBeforeEnter();

        resetPageClasses(fromPage);
        resetPageClasses(toPage);

        toPage.style.display = 'flex';
        fromPage.style.display = 'flex';

        fromPage.classList.add('diary-page-active');
        toPage.classList.add('diary-page-active');

        if (direction === 'back') {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    fromPage.classList.add('diary-page-exit-fade');
                });
            });

            window.setTimeout(() => {
                resetPageClasses(fromPage);
                fromPage.style.display = 'none';

                resetPageClasses(toPage);
                toPage.style.display = 'flex';
                toPage.classList.add('diary-page-active');

                pageTransitionLock = false;
            }, 220);
            return;
        }

        toPage.classList.add('diary-page-enter-from-right');
        fromPage.classList.add('diary-page-underlay-left');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toPage.classList.add('diary-page-enter-active');
                toPage.classList.remove('diary-page-enter-from-right');
                fromPage.classList.add('diary-page-exit-to-left');
            });
        });

        window.setTimeout(() => {
            resetPageClasses(fromPage);
            fromPage.style.display = 'none';

            resetPageClasses(toPage);
            toPage.style.display = 'flex';
            toPage.classList.add('diary-page-active');

            pageTransitionLock = false;
        }, 300);
    }

    function openDiaryView() {
        if (window.isJiggleMode || window.preventAppClick) {
            return;
        }

        if (window.syncUIs) window.syncUIs();
        if (diaryView) {
            diaryView.classList.remove('closing');
            diaryView.classList.remove('active');
            loadDiaryData();
            renderFolders();
            showOnlyPage(foldersPage);
            requestAnimationFrame(() => {
                diaryView.classList.add('active');
            });
        }
    }

    // --- App Launch/Close ---
    document.addEventListener('click', (e) => {
        const appItem = e.target.closest('.app-item');
        if (appItem && appItem.querySelector('#app-icon-5')) {
            if (window.isJiggleMode || window.preventAppClick) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            e.stopPropagation();
            openDiaryView();
        }
    });

    function closeDiaryView() {
        if (diaryView && diaryView.classList.contains('active') && !diaryView.classList.contains('closing')) {
            diaryView.classList.add('closing');
            window.setTimeout(() => {
                diaryView.classList.remove('active');
                diaryView.classList.remove('closing');
                showOnlyPage(foldersPage);
            }, 220);
        }
    }

    if (homeBackBtn && diaryView) {
        homeBackBtn.addEventListener('click', closeDiaryView);
    }

    // --- Navigation ---
    if (notesBackBtn) {
        notesBackBtn.addEventListener('click', () => {
            renderFolders();
            transitionPages(notesPage, foldersPage, 'back');
        });
    }

    if (editBackBtn) {
        editBackBtn.addEventListener('click', () => {
            saveCurrentNote();
            renderNotesList(currentFolder);
            transitionPages(editPage, notesPage, 'back');
        });
    }

    if (editDoneBtn) {
        editDoneBtn.addEventListener('click', () => {
            if (!isEditMode) {
                setEditorEditable(true);
                if (editorInput) editorInput.focus();
                return;
            }

            saveCurrentNote();
            setEditorEditable(false);
            if (window.showToast) window.showToast('已保存');
        });
    }

    // --- Formatting Toolbar Logic ---
    const formatAaBtn = document.getElementById('diary-format-aa-btn');
    const formatSheet = document.getElementById('diary-format-sheet');
    const formatCloseBtn = document.getElementById('diary-format-close-btn');

    if (formatAaBtn && formatSheet) {
        formatAaBtn.addEventListener('click', () => {
            if (window.openView) window.openView(formatSheet);
        });
    }
    if (formatCloseBtn && formatSheet) {
        formatCloseBtn.addEventListener('click', () => {
            if (window.closeView) window.closeView(formatSheet);
            if (editorInput) editorInput.focus();
        });
    }

    // WYSIWYG Rich Text Formatter
    function insertMarkdown(format) {
        if (!editorInput) return;
        editorInput.focus();
        
        switch (format) {
            case 'bold':
                document.execCommand('bold', false, null);
                break;
            case 'italic':
                document.execCommand('italic', false, null);
                break;
            case 'underline':
                document.execCommand('underline', false, null);
                break;
            case 'strike':
                document.execCommand('strikeThrough', false, null);
                break;
            case 'h1':
                // Instead of injecting '#', we wrap in a div with specific styles
                // execCommand('formatBlock') with <H1> is standard, but we want exact styles.
                document.execCommand('formatBlock', false, 'H1');
                // To apply specific styles, we find the focused element
                applyStyleToSelection('font-size: 26px; font-weight: bold; line-height: 1.2; margin-top: 16px; margin-bottom: 12px;');
                break;
            case 'h2':
                document.execCommand('formatBlock', false, 'H2');
                applyStyleToSelection('font-size: 18px; font-weight: 600; line-height: 1.3; margin-top: 14px; margin-bottom: 6px;');
                break;
            case 'h3':
                document.execCommand('formatBlock', false, 'H3');
                applyStyleToSelection('font-size: 16px; font-weight: 600; line-height: 1.4; margin-top: 12px; margin-bottom: 4px;');
                break;
            case 'body':
                document.execCommand('formatBlock', false, 'DIV');
                applyStyleToSelection('font-size: 17px; font-weight: normal; margin-top: 0; margin-bottom: 8px;');
                break;
            case 'code':
                document.execCommand('removeFormat', false, null);
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const text = selection.toString() || '代码';
                    const html = `<span style="background: rgba(0,0,0,0.05); color: #555; border-radius: 6px; padding: 2px 6px; font-family: monospace; font-size: 15px;">${text}</span>`;
                    document.execCommand('insertHTML', false, html);
                }
                break;
        }
        
        saveCurrentNote();
    }

    function applyStyleToSelection(cssText) {
        document.execCommand('removeFormat', false, null);
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
        if (container.nodeType === 3) {
            container = container.parentNode;
        }
        
        // If it's the root editor, wrap the selection
        if (container === editorInput) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = cssText;
            range.surroundContents(wrapper);
        } else {
            // Apply to existing block
            container.style.cssText = cssText;
        }
    }

    // Attach listeners to format options
    document.querySelectorAll('.diary-format-option').forEach(el => {
        el.addEventListener('click', () => {
            const format = el.getAttribute('data-format');
            insertMarkdown(format);
            if (window.closeView) window.closeView(formatSheet);
        });
    });

    document.querySelectorAll('.diary-format-option-inline').forEach(el => {
        el.addEventListener('click', () => {
            const format = el.getAttribute('data-format');
            insertMarkdown(format);
            // Don't close sheet for inline formats, allowing multiple applications
        });
    });

    // Todo List button logic
    const formatTodoBtn = document.getElementById('diary-format-todo-btn');
    if (formatTodoBtn) {
        formatTodoBtn.addEventListener('click', () => {
            if (!editorInput) return;
            editorInput.focus();
            
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            
            const range = selection.getRangeAt(0);
            let container = range.commonAncestorContainer;
            if (container.nodeType === 3) container = container.parentNode;
            
            // Find the block level parent (div) within the editor
            while (container && container.parentNode !== editorInput && container !== editorInput) {
                container = container.parentNode;
            }
            
            if (container === editorInput || !container) {
                // Empty line or cursor is at the root
                const html = `<div class="diary-todo-item" style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
                                <i class="far fa-circle" style="color: #c7c7cc; font-size: 20px; cursor: pointer; margin-top: 2px;"></i>
                                <span style="flex: 1; font-size: 17px; line-height: 1.5; color: #000;"><br></span>
                             </div>`;
                document.execCommand('insertHTML', false, html);
            } else {
                // If it's already a todo item, don't nest it
                if (container.classList && container.classList.contains('diary-todo-item')) return;
                
                // Convert current line to todo
                const currentText = container.textContent || '<br>';
                const todoHtml = `<div class="diary-todo-item" style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
                                    <i class="far fa-circle" style="color: #c7c7cc; font-size: 20px; cursor: pointer; margin-top: 2px;"></i>
                                    <span style="flex: 1; font-size: 17px; line-height: 1.5; color: #000;">${currentText}</span>
                                 </div>`;
                container.outerHTML = todoHtml;
            }
            saveCurrentNote();
        });
    }

    // Camera button logic (Image upload)
    const insertImgBtn = document.getElementById('diary-insert-img-btn');
    const imgUploadInput = document.getElementById('diary-img-upload-input');
    if (insertImgBtn && imgUploadInput) {
        insertImgBtn.addEventListener('click', () => {
            if (isEditMode) {
                imgUploadInput.click();
            }
        });
        
        imgUploadInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imgSrc = e.target.result;
                    if (editorInput) {
                        editorInput.focus();
                        // Insert image wrapping structure with strict block constraints and 4:3 max ratio
                        const imgHtml = `<div class="diary-image-container" contenteditable="false" style="display: block; clear: both; width: 100%; margin: 15px 0;" data-desc="用户上传的照片">
                                            <img src="${imgSrc}" style="display: block; width: 100%; max-height: calc(100vw * 0.75); object-fit: contain; background: #000; border-radius: 12px;">
                                         </div><div><br></div>`;
                        document.execCommand('insertHTML', false, imgHtml);
                        saveCurrentNote();
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    // Delegation for Todo checking and Image/AI Block clicking in editor
    if (editorInput) {
        editorInput.addEventListener('click', (e) => {
            // Todo logic
            if (e.target.classList.contains('fa-circle') || e.target.classList.contains('fa-check-circle')) {
                const todoItem = e.target.closest('.diary-todo-item');
                if (!todoItem) return;
                
                const span = todoItem.querySelector('span');
                if (e.target.classList.contains('fa-circle')) {
                    // Check it
                    e.target.className = 'far fa-check-circle';
                    e.target.style.color = '#ffcc00';
                    if (span) {
                        span.style.color = '#8e8e93';
                        span.style.textDecoration = 'line-through';
                    }
                } else {
                    // Uncheck it
                    e.target.className = 'far fa-circle';
                    e.target.style.color = '#c7c7cc';
                    if (span) {
                        span.style.color = '#000';
                        span.style.textDecoration = 'none';
                    }
                }
                saveCurrentNote();
            }
            
            // Image / AI Block description click logic
            const imgContainer = e.target.closest('.diary-image-container');
            const aiBlock = e.target.closest('.diary-ai-image-block');
            const targetBlock = imgContainer || aiBlock;
            
            if (targetBlock) {
                const currentDesc = targetBlock.getAttribute('data-desc') || '';
                
                // If in view mode, just show an alert with the description instead of prompting to edit
                if (!isEditMode) {
                    if (window.openAlertModal) {
                        window.openAlertModal('图片描述', currentDesc);
                    } else if (window.showToast) {
                        window.showToast(currentDesc);
                    } else {
                        alert(currentDesc);
                    }
                    return;
                }

                // If in edit mode, prompt for editing
                if (window.openPromptModal) {
                    window.openPromptModal('图片描述', currentDesc, (newDesc) => {
                        if (newDesc !== null) {
                            targetBlock.setAttribute('data-desc', newDesc);
                            if (aiBlock) {
                                // Update visible text on the gray block safely by targeting the text div
                                const innerContent = aiBlock.querySelector('div');
                                if (innerContent) {
                                    const textDiv = innerContent.querySelector('div');
                                    if (textDiv) textDiv.textContent = newDesc;
                                }
                            }
                            saveCurrentNote();
                        }
                    }, true); // true for textarea prompt
                } else {
                    const newDesc = prompt('图片描述 (AI 分析用):', currentDesc);
                    if (newDesc !== null) {
                        targetBlock.setAttribute('data-desc', newDesc);
                        if (aiBlock) {
                            const innerContent = aiBlock.querySelector('div');
                            if (innerContent) {
                                const textDiv = innerContent.querySelector('div');
                                if (textDiv) textDiv.textContent = newDesc;
                            }
                        }
                        saveCurrentNote();
                    }
                }
            }
        });
    }

    const openNewNote = () => {
        currentFolder = getCurrentDiaryUserFolderKey();
        currentFolderTitle = getCurrentDiaryUserFolderDisplayName();
        currentNoteId = null;
        editorInput.innerHTML = ''; // Changed from value
        editorDate.textContent = formatDate(Date.now(), 'long');
        setEditorEditable(true);
        transitionPages(notesPage.style.display === 'flex' ? notesPage : foldersPage, editPage, 'forward', () => {
            if (editorInput) {
                window.setTimeout(() => editorInput.focus(), 220);
            }
        });
    };

    if (newEntryBtn) newEntryBtn.addEventListener('click', openNewNote);
    if (newNoteBtn) {
        newNoteBtn.addEventListener('click', () => {
            if (isUserFolder()) {
                openNewNote();
            } else {
                triggerCharDiaryApi();
            }
        });
    }

    function saveCurrentNote() {
        // Now getting innerHTML instead of value
        const text = editorInput.innerHTML.trim();
        const rawText = editorInput.textContent.trim();
        
        // Only save if there's actual text content or images
        if (rawText || text.includes('<img')) {
            if (currentNoteId) {
                // Update
                const note = diaryData.find(n => n.id === currentNoteId);
                // Allow updating both User and Char notes
                if (note && note.folder === currentFolder) {
                    note.text = text;
                    note.time = Date.now();
                }
            } else {
                // Create
                diaryData.push({
                    id: Date.now().toString(),
                    text: text,
                    time: Date.now(),
                    folder: currentFolder
                });
                currentNoteId = diaryData[diaryData.length - 1].id;
                // Keep the currentFolder as it is (it could be user or char)
                currentFolderTitle = isUserFolder(currentFolder) ? getCurrentDiaryUserFolderDisplayName() : currentFolder;
            }
            saveDiaryData();
        } else if (currentNoteId) {
            const note = diaryData.find(n => n.id === currentNoteId);
            if (note && note.folder === currentFolder) {
                diaryData = diaryData.filter(n => n.id !== currentNoteId);
                currentNoteId = null;
                saveDiaryData();
            }
        }
    }

    // --- Rendering ---
    function renderFolders() {
        if (!folderList) return;
        folderList.innerHTML = '';

        const userFolderKey = getCurrentDiaryUserFolderKey();
        const userFolderDisplayName = getCurrentDiaryUserFolderDisplayName();
        const friends = (typeof window.getImFriends === 'function'
            ? window.getImFriends()
            : (window.imData?.friends || [])
        ).filter(friend => friend && friend.type !== 'group');

        const userGroup = document.createElement('div');
        userGroup.className = 'diary-folder-group';

        const userNotesCount = diaryData.filter(n => n.folder === userFolderKey).length;
        const userFolderEl = document.createElement('div');
        userFolderEl.className = 'diary-folder-item';
        userFolderEl.innerHTML = `
            <div class="diary-folder-icon"><i class="far fa-folder"></i></div>
            <div class="diary-folder-name">${userFolderDisplayName}</div>
            <div class="diary-folder-count">${userNotesCount}</div>
            <div class="diary-folder-arrow"><i class="fas fa-chevron-right"></i></div>
        `;
        userFolderEl.addEventListener('click', () => {
            openFolder(userFolderKey, userFolderDisplayName);
        });
        userGroup.appendChild(userFolderEl);
        folderList.appendChild(userGroup);

        const friendsGroup = document.createElement('div');
        friendsGroup.className = 'diary-folder-group';

        friends.forEach(friend => {
            const fName = friend.nickname || friend.name || friend.realName || 'Friend';
            const fNotesCount = diaryData.filter(n => n.folder === fName).length;

            const fFolderEl = document.createElement('div');
            fFolderEl.className = 'diary-folder-item';
            fFolderEl.innerHTML = `
                <div class="diary-folder-icon"><i class="far fa-folder"></i></div>
                <div class="diary-folder-name">${fName}</div>
                <div class="diary-folder-count">${fNotesCount}</div>
                <div class="diary-folder-arrow"><i class="fas fa-chevron-right"></i></div>
            `;
            fFolderEl.addEventListener('click', () => {
                openFolder(fName, fName);
            });
            friendsGroup.appendChild(fFolderEl);
        });

        const deletedFolderName = getDeletedFolderName();
        const deletedNotesCount = diaryData.filter(n => n.folder === deletedFolderName).length;
        const deletedFolderEl = document.createElement('div');
        deletedFolderEl.className = 'diary-folder-item';
        deletedFolderEl.innerHTML = `
            <div class="diary-folder-icon"><i class="far fa-trash-can"></i></div>
            <div class="diary-folder-name">${deletedFolderName}</div>
            <div class="diary-folder-count">${deletedNotesCount}</div>
            <div class="diary-folder-arrow"><i class="fas fa-chevron-right"></i></div>
        `;
        deletedFolderEl.addEventListener('click', () => {
            openFolder(deletedFolderName, deletedFolderName);
        });
        friendsGroup.appendChild(deletedFolderEl);

        if (friends.length === 0 && deletedNotesCount === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'diary-folder-item';
            emptyEl.style.pointerEvents = 'none';
            emptyEl.innerHTML = `
                <div class="diary-folder-icon" style="color: #c7c7cc;"><i class="far fa-folder"></i></div>
                <div class="diary-folder-name" style="color: #c7c7cc;">暂无好友</div>
            `;
            friendsGroup.appendChild(emptyEl);
        }

        folderList.appendChild(friendsGroup);
    }

    function openFolder(folderName, displayTitle = folderName) {
        currentFolder = folderName;
        currentFolderTitle = displayTitle;
        notesTitle.textContent = displayTitle;
        renderNotesList(folderName);
        transitionPages(foldersPage, notesPage, 'forward');
    }

    function renderNotesList(folderName) {
        if (!notesList) return;
        notesList.innerHTML = '';

        const folderNotes = diaryData
            .filter(n => n.folder === folderName)
            .sort((a, b) => getNoteListTime(b, folderName) - getNoteListTime(a, folderName));

        if (notesCount) {
            notesCount.textContent = `${folderNotes.length} 則日记`;
        }

        if (newNoteBtn) {
            newNoteBtn.innerHTML = isUserFolder(folderName)
                ? '<i class="far fa-edit"></i>'
                : '<i class="fas fa-wand-magic-sparkles"></i>';
            newNoteBtn.setAttribute('aria-label', isUserFolder(folderName) ? 'New note' : 'Generate note');
        }

        if (folderNotes.length === 0) {
            notesList.innerHTML = '<div style="text-align: center; color: #8e8e93; margin-top: 40px; font-size: 15px;">暫無日记</div>';
            return;
        }

        const notesByMonth = {};

        folderNotes.forEach(note => {
            const date = new Date(getNoteListTime(note, folderName));
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!notesByMonth[key]) notesByMonth[key] = [];
            notesByMonth[key].push(note);
        });

        Object.keys(notesByMonth)
            .sort((a, b) => {
                const [aYear, aMonth] = a.split('-').map(Number);
                const [bYear, bMonth] = b.split('-').map(Number);
                return bYear - aYear || bMonth - aMonth;
            })
            .forEach(key => {
                const [year, month] = key.split('-').map(Number);
                const groupTitle = document.createElement('div');
                groupTitle.className = 'diary-note-group-title';
                groupTitle.textContent = `${year}年${month}月`;
                notesList.appendChild(groupTitle);

                const groupList = document.createElement('div');
                groupList.className = 'diary-note-group-list';

                notesByMonth[key].forEach(note => {
                    groupList.appendChild(createNoteElement(note));
                });

                notesList.appendChild(groupList);
            });
    }

    function createNoteElement(note) {
        const isDeletedContext = isDeletedFolder(currentFolder);

        const row = document.createElement('div');
        row.className = 'diary-note-row';

        const actions = document.createElement('div');
        actions.className = `diary-note-actions${isDeletedContext ? ' diary-note-actions-double' : ''}`;

        let restoreBtn = null;
        if (isDeletedContext) {
            restoreBtn = document.createElement('button');
            restoreBtn.className = 'diary-note-restore-btn';
            restoreBtn.type = 'button';
            restoreBtn.setAttribute('aria-label', 'Restore note');
            restoreBtn.innerHTML = '<i class="fas fa-rotate-left"></i>';
            actions.appendChild(restoreBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'diary-note-delete-btn';
        deleteBtn.type = 'button';
        deleteBtn.setAttribute('aria-label', isDeletedContext ? 'Delete permanently' : 'Delete note');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        actions.appendChild(deleteBtn);

        const el = document.createElement('div');
        el.className = 'diary-note-item';

        const title = getFirstLine(note.text);
        const dateStr = formatDate(getNoteListTime(note, currentFolder), 'medium');
        const preview = getSecondLinePreview(note.text);

        if (isDeletedContext) {
            const authorLabel = getDeletedAuthorName(note);
            el.innerHTML = `
                <div class="diary-note-icon"><i class="far fa-note-sticky"></i></div>
                <div class="diary-note-content">
                    <div class="diary-note-title">${title}</div>
                    <div class="diary-note-desc">
                        <span class="diary-note-date">${dateStr}</span>
                        <span class="diary-note-author">作者：${authorLabel}</span>
                        <span class="diary-note-preview">${preview}</span>
                    </div>
                </div>
                <div class="diary-note-arrow"><i class="fas fa-chevron-right"></i></div>
            `;
        } else {
            el.innerHTML = `
                <div class="diary-note-icon"><i class="far fa-note-sticky"></i></div>
                <div class="diary-note-content">
                    <div class="diary-note-title">${title}</div>
                    <div class="diary-note-desc">
                        <span class="diary-note-date">${dateStr}</span>
                        <span class="diary-note-preview">${preview}</span>
                    </div>
                </div>
                <div class="diary-note-arrow"><i class="fas fa-chevron-right"></i></div>
            `;
        }

        const swipeWidth = isDeletedContext ? 164 : 88;
        const swipeThreshold = isDeletedContext ? 72 : 56;

        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        const resetSwipe = () => {
            el.style.transform = 'translateX(0)';
            row.classList.remove('swiped');
        };

        const onPointerDown = (event) => {
            startX = event.clientX;
            currentX = startX;
            isDragging = true;
        };

        const onPointerMove = (event) => {
            if (!isDragging) return;
            currentX = event.clientX;
            const deltaX = currentX - startX;
            if (deltaX < 0) {
                const translateX = Math.max(deltaX, -swipeWidth);
                el.style.transform = `translateX(${translateX}px)`;
                if (translateX <= -swipeThreshold) {
                    row.classList.add('swiped');
                } else {
                    row.classList.remove('swiped');
                }
            } else if (deltaX > 0 && row.classList.contains('swiped')) {
                const translateX = Math.min(0, -swipeWidth + deltaX);
                el.style.transform = `translateX(${translateX}px)`;
                if (translateX > -swipeThreshold) {
                    row.classList.remove('swiped');
                }
            }
        };

        const onPointerUp = () => {
            if (!isDragging) return;
            isDragging = false;
            const deltaX = currentX - startX;
            if (deltaX <= -swipeThreshold) {
                el.style.transform = `translateX(-${swipeWidth}px)`;
                row.classList.add('swiped');
            } else {
                resetSwipe();
            }
        };

        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointercancel', onPointerUp);
        el.addEventListener('pointerleave', onPointerUp);

        el.addEventListener('click', (e) => {
            if (row.classList.contains('swiped')) {
                resetSwipe();
                e.stopPropagation();
                return;
            }
            openEditNote(note);
        });

        if (restoreBtn) {
            restoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const target = diaryData.find(n => n.id === note.id);
                if (!target) return;

                const restoreFolderTitle = target.originalFolderTitle || getFolderDisplayName(target.originalFolder);
                if (!restoreDeletedNote(target)) {
                    resetSwipe();
                    if (window.showToast) window.showToast('原文件夹信息缺失，无法恢复');
                    return;
                }

                saveDiaryData();
                renderNotesList(currentFolder);
                renderFolders();
                if (window.showToast) window.showToast(`已恢复到${restoreFolderTitle}`);
            });
        }

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = diaryData.find(n => n.id === note.id);
            if (!target) return;

            if (isDeletedContext) {
                permanentlyDeleteNote(note.id);
                saveDiaryData();
                renderNotesList(currentFolder);
                renderFolders();
                if (window.showToast) window.showToast('已彻底删除');
                return;
            }

            if (moveNoteToRecentlyDeleted(target)) {
                saveDiaryData();
                renderNotesList(currentFolder);
                renderFolders();
                if (window.showToast) window.showToast('已移入最近删除');
            }
        });

        row.appendChild(actions);
        row.appendChild(el);

        return row;
    }

    function openEditNote(note) {
        currentNoteId = note.id;
        currentFolder = note.folder;
        currentFolderTitle = isUserFolder(note.folder) ? getCurrentDiaryUserFolderDisplayName() : note.folder;
        
        // Handle backwards compatibility for plain text vs rich text
        if (!note.text.includes('<div') && !note.text.includes('<p')) {
            editorInput.innerText = note.text;
        } else {
            editorInput.innerHTML = note.text;
        }
        
        editorDate.textContent = formatDate(getNoteListTime(note, note.folder), 'long');

        setEditorEditable(false);
        transitionPages(notesPage, editPage, 'forward');
    }

        loadDiaryData();

        window.diaryApp = Object.assign(window.diaryApp || {}, {
            initialized: true,
            init: initDiaryApp,
            open: openDiaryView,
            close: closeDiaryView
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDiaryApp, { once: true });
    } else {
        initDiaryApp();
    }
})();
