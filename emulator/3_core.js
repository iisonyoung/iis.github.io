// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================
function openView(viewElement) {
    if(viewElement) viewElement.classList.add('active');
}

function closeView(viewElement) {
    if(viewElement) viewElement.classList.remove('active');
}
window.openView = openView;
window.closeView = closeView;

// Bind overlay click-to-close automatically
Object.values(UI.overlays).forEach(overlay => {
    if(overlay) {
        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) closeView(overlay);
        });
    }
});

// --- Custom Modal System ---
window.showCustomModal = function(options) {
    const overlay = document.getElementById('custom-modal-overlay');
    if (!overlay) return;

    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    if (titleEl) titleEl.textContent = options.title || '提示';
    if (messageEl) messageEl.textContent = options.message || '';
    
    if (cancelBtn) {
        cancelBtn.textContent = options.cancelText || '取消';
        cancelBtn.onclick = () => {
            closeView(overlay);
            if (options.onCancel) options.onCancel();
        };
    }
    
    if (confirmBtn) {
        confirmBtn.textContent = options.confirmText || '确定';
        if (options.isDestructive) {
            confirmBtn.style.color = '#ff3b30';
        } else {
            confirmBtn.style.color = '#007aff';
        }
        confirmBtn.onclick = () => {
            closeView(overlay);
            if (options.onConfirm) options.onConfirm();
        };
    }

    // Handle prompt vs confirm
    const promptContent = document.getElementById('modal-prompt-content');
    const confirmContent = document.getElementById('modal-confirm-content');
    const promptConfirmBtn = document.getElementById('modal-prompt-confirm-btn');
    const modalInput = document.getElementById('modal-input');

    if (options.type === 'prompt') {
        if (promptContent) promptContent.style.display = 'block';
        if (confirmContent) confirmContent.style.display = 'none';
        if (confirmBtn) confirmBtn.style.display = 'none';
        if (promptConfirmBtn) {
            promptConfirmBtn.style.display = 'block';
            promptConfirmBtn.textContent = options.confirmText || '确定';
            promptConfirmBtn.onclick = () => {
                closeView(overlay);
                if (options.onConfirm) options.onConfirm(modalInput ? modalInput.value : '');
            };
        }
        if (modalInput) {
            modalInput.placeholder = options.placeholder || '请输入';
            modalInput.value = options.defaultValue || '';
        }
    } else {
        if (promptContent) promptContent.style.display = 'none';
        if (confirmContent) confirmContent.style.display = 'block';
        if (confirmBtn) confirmBtn.style.display = 'block';
        if (promptConfirmBtn) promptConfirmBtn.style.display = 'none';
    }

    openView(overlay);
};

// --- Toast Notification System ---
let toastTimeout = null;
function showToast(message, duration = 2000) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.className = 'toast-bubble';
        // Append to screen container to stay within phone frame
        const screen = document.querySelector('.screen');
        if (screen) {
            screen.appendChild(toast);
        } else {
            document.body.appendChild(toast);
        }
    }

    toast.textContent = message;
    toast.classList.remove('show');
    
    // Force reflow
    void toast.offsetWidth;
    
    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
window.showToast = showToast;

// Handle generic swipe logic for any list
function addSwipeLogic(card, onDelete) {
    let startX = 0, isDragging = false;
    
    // Find existing swiped card in the same list to close it
    const list = card.parentElement;

    const startSwipe = (x) => { startX = x; isDragging = true; };
    const moveSwipe = (x) => {
        if (!isDragging) return;
        const diff = startX - x;
        
        if (diff > 40) { 
            // Close others
            const others = list.querySelectorAll('.account-card.swiped');
            others.forEach(o => { if(o !== card) o.classList.remove('swiped') });
            
            card.classList.add('swiped');
            isDragging = false;
        } else if (diff < -40) { 
            card.classList.remove('swiped');
            isDragging = false;
        }
    };
    const endSwipe = () => { isDragging = false; };

    card.addEventListener('mousedown', (e) => startSwipe(e.clientX));
    card.addEventListener('mousemove', (e) => moveSwipe(e.clientX));
    card.addEventListener('mouseup', endSwipe);
    card.addEventListener('mouseleave', endSwipe);
    card.addEventListener('touchstart', (e) => startSwipe(e.touches[0].clientX));
    card.addEventListener('touchmove', (e) => moveSwipe(e.touches[0].clientX));
    card.addEventListener('touchend', endSwipe);

    // Delete Action
    card.querySelector('.delete-action').addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete();
    });
}

// ==========================================
// 4. CORE SYSTEM LOGIC
// ==========================================

// Unified viewport sync for mobile browsers / PWA / fullscreen.
// Old 100vh + innerHeight logic has been fully removed.
function readViewportMetrics() {
    const root = document.documentElement;
    const visualViewport = window.visualViewport || null;

    const layoutWidth = Math.max(
        0,
        Math.round(
            visualViewport?.width ||
            window.innerWidth ||
            root.clientWidth ||
            0
        )
    );

    const layoutHeight = Math.max(
        0,
        Math.round(
            visualViewport?.height ||
            window.innerHeight ||
            root.clientHeight ||
            0
        )
    );

    const visualWidth = Math.max(
        0,
        Math.round(
            visualViewport?.width ||
            layoutWidth
        )
    );

    const visualHeight = Math.max(
        0,
        Math.round(
            visualViewport?.height ||
            layoutHeight
        )
    );

    const offsetTop = Math.max(0, Math.round(visualViewport?.offsetTop || 0));
    const offsetLeft = Math.max(0, Math.round(visualViewport?.offsetLeft || 0));
    const pageTop = Math.max(0, Math.round(visualViewport?.pageTop || 0));
    const pageLeft = Math.max(0, Math.round(visualViewport?.pageLeft || 0));

    return {
        width: layoutWidth,
        height: layoutHeight,
        visualWidth,
        visualHeight,
        offsetTop,
        offsetLeft,
        pageTop,
        pageLeft,
        vh: layoutHeight * 0.01,
        vw: layoutWidth * 0.01
    };
}

function applyViewportMetrics(metrics) {
    const root = document.documentElement;
    root.style.setProperty('--viewport-width', `${metrics.width}px`);
    root.style.setProperty('--viewport-height', `${metrics.height}px`);
    root.style.setProperty('--app-width', `${metrics.width}px`);
    root.style.setProperty('--app-height', `${metrics.height}px`);
    root.style.setProperty('--visual-viewport-width', `${metrics.visualWidth}px`);
    root.style.setProperty('--visual-viewport-height', `${metrics.visualHeight}px`);
    root.style.setProperty('--viewport-offset-top', `${metrics.offsetTop}px`);
    root.style.setProperty('--viewport-offset-left', `${metrics.offsetLeft}px`);
    root.style.setProperty('--viewport-page-top', `${metrics.pageTop}px`);
    root.style.setProperty('--viewport-page-left', `${metrics.pageLeft}px`);
    root.style.setProperty('--vh', `${metrics.vh}px`);
    root.style.setProperty('--vw', `${metrics.vw}px`);
}

let viewportSyncRafId = null;

function syncViewportMetrics() {
    applyViewportMetrics(readViewportMetrics());
}

function scheduleViewportSync() {
    if (viewportSyncRafId !== null) return;
    viewportSyncRafId = requestAnimationFrame(() => {
        viewportSyncRafId = null;
        syncViewportMetrics();
    });
}

window.syncViewportMetrics = syncViewportMetrics;
window.scheduleViewportSync = scheduleViewportSync;

window.addEventListener('resize', scheduleViewportSync, { passive: true });
window.addEventListener('orientationchange', scheduleViewportSync, { passive: true });

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleViewportSync);
    window.visualViewport.addEventListener('scroll', scheduleViewportSync);
}

syncViewportMetrics();

// Clock
function updateClock() {
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.textContent = timeString;
    }
}
updateClock();
setInterval(updateClock, 1000);

// Phone Input Restriction
if (UI.inputs.detailPhone) {
    UI.inputs.detailPhone.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 11);
    });
}

// ==========================================
// 4.5 MOBILE KEYBOARD & VIEWPORT FIXES (Optimized for iOS & Edge cases)
// ==========================================

// 注入全局非对称过渡样式 (解决弹起延迟、收起生硬问题)
(function injectKeyboardStyles() {
    const style = document.createElement('style');
    // 仅为仍然依赖 --keyboard-height 的页面保留最小过渡控制。
    // iMessage 已改为静态底部输入栏，不再参与这套键盘位移系统。
    style.innerHTML = `
        body.keyboard-open .bstage-chat-input-area,
        body.keyboard-open .tk-dm-input-area,
        body.keyboard-open .yt-chat-input-area,
        body.keyboard-open .x-reply-input-wrapper {
            transition: none !important;
        }

        .bstage-chat-input-area,
        .tk-dm-input-area,
        .yt-chat-input-area,
        .x-reply-input-wrapper {
            transition: bottom 0.25s ease, transform 0.25s ease;
        }
    `;
    document.head.appendChild(style);
})();

function initMobileKeyboardFixes() {
    let focusTimer = null;
    let viewportRafId = null;

    const isTextInput = (el) => {
        if (!el) return false;
        return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    };

    const isActiveIMessageInput = (el = document.activeElement) => {
        if (!isTextInput(el)) return false;
        const imessageView = document.getElementById('imessage-view');
        return !!(imessageView && imessageView.classList.contains('active') && imessageView.contains(el));
    };

    const setKeyboardHeight = (height) => {
        const nextHeight = Math.max(0, height);
        document.documentElement.style.setProperty('--keyboard-height', `${nextHeight}px`);
        document.body.classList.toggle('keyboard-open', nextHeight > 0);
    };

    const clearKeyboardState = () => {
        setKeyboardHeight(0);
    };

    const updateKeyboard = () => {
        // iMessage 已改为固定底部输入栏 + safe-area，不再参与全局键盘抬升系统。
        // 如果当前焦点位于激活中的 iMessage 内，强制清空全局键盘状态，避免整个模拟器被二次顶起。
        if (isActiveIMessageInput()) {
            clearKeyboardState();
            return;
        }

        if (!window.visualViewport) {
            clearKeyboardState();
            return;
        }

        // Add a check: only try to lift the keyboard if an input is actually focused.
        // This prevents the page from jumping when scrolling hides the address bar
        // and creates a height differential.
        const isInputFocused = isTextInput(document.activeElement);
        if (!isInputFocused) {
            clearKeyboardState();
            return;
        }

        const root = document.documentElement;
        const visualHeight = window.visualViewport.height;
        const offsetTop = Math.max(0, window.visualViewport.offsetTop || 0);
        const layoutHeight = Math.max(
            0,
            window.innerHeight ||
            root.clientHeight ||
            0
        );

        let keyboardHeight = Math.max(0, layoutHeight - (visualHeight + offsetTop));

        // 忽略地址栏、轻微缩放等小波动，只在明显弹键盘时抬起底部输入区
        // Safari's bottom bar can be up to ~110px. Require >120px to confirm it's a keyboard.
        if (keyboardHeight < 120) {
            keyboardHeight = 0;
        }

        setKeyboardHeight(keyboardHeight);
    };

    const scheduleKeyboardUpdate = () => {
        if (viewportRafId !== null) return;
        viewportRafId = requestAnimationFrame(() => {
            viewportRafId = null;
            updateKeyboard();
        });
    };

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleKeyboardUpdate);
        window.visualViewport.addEventListener('scroll', scheduleKeyboardUpdate);
    }

    document.addEventListener('focusin', () => {
        clearTimeout(focusTimer);
        if (isActiveIMessageInput()) {
            clearKeyboardState();
            return;
        }
        scheduleKeyboardUpdate();
    });

    document.addEventListener('focusout', () => {
        clearTimeout(focusTimer);
        focusTimer = setTimeout(() => {
            if (isActiveIMessageInput()) {
                clearKeyboardState();
                return;
            }

            if (!isTextInput(document.activeElement)) {
                scheduleKeyboardUpdate();
                if (!window.visualViewport) {
                    clearKeyboardState();
                }
            }
        }, 120);
    });

    updateKeyboard();
}
initMobileKeyboardFixes();

// ==========================================
// 9. SYNCHRONIZATION HELPERS
// ==========================================
window.syncUIs = function syncUIs() {
    // Sync Home Screen
    if(UI.displays.homeName) UI.displays.homeName.textContent = userState.name || 'name @yourid';
    
    if (userState.avatarUrl) {
        if(UI.displays.homeAvatarImg) {
            UI.displays.homeAvatarImg.src = userState.avatarUrl;
            UI.displays.homeAvatarImg.style.display = 'block';
        }
        if(UI.displays.homeAvatarIcon) UI.displays.homeAvatarIcon.style.display = 'none';
    } else {
        if(UI.displays.homeAvatarImg) UI.displays.homeAvatarImg.style.display = 'none';
        if(UI.displays.homeAvatarIcon) UI.displays.homeAvatarIcon.style.display = 'block';
    }
    
    // Sync Main Settings Profile Card
    if(UI.displays.settingsName) UI.displays.settingsName.textContent = userState.name || '未登录 Apple ID';
    
    if (userState.avatarUrl) {
        if(UI.displays.settingsAvatarImg) {
            UI.displays.settingsAvatarImg.src = userState.avatarUrl;
            UI.displays.settingsAvatarImg.style.display = 'block';
        }
        if(UI.displays.settingsAvatarIcon) UI.displays.settingsAvatarIcon.style.display = 'none';
    } else {
        if(UI.displays.settingsAvatarImg) UI.displays.settingsAvatarImg.style.display = 'none';
        if(UI.displays.settingsAvatarIcon) UI.displays.settingsAvatarIcon.style.display = 'block';
    }
    
    // Sync Apple ID View
    if(UI.displays.displayName) UI.displays.displayName.textContent = userState.name || '未登录 Apple ID';
    if(UI.displays.displayPhone) UI.displays.displayPhone.textContent = userState.phone || '暂无手机号';
    
    const displaySignature = document.getElementById('display-signature');
    if(displaySignature) displaySignature.textContent = userState.persona || '添加账号后可同步头像、名称与签名';

    if (userState.avatarUrl) {
        if(UI.displays.editAvatarImg) {
            UI.displays.editAvatarImg.src = userState.avatarUrl;
            UI.displays.editAvatarImg.style.display = 'block';
        }
        if(UI.displays.editAvatarIcon) UI.displays.editAvatarIcon.style.display = 'none';
    } else {
        if(UI.displays.editAvatarImg) UI.displays.editAvatarImg.style.display = 'none';
        if(UI.displays.editAvatarIcon) UI.displays.editAvatarIcon.style.display = 'block';
    }

    // Sync iMessage (LINE Style) Profile
    const imName = document.getElementById('imessage-profile-name');
    const imSign = document.getElementById('imessage-profile-sign');
    const imAvatarImg = document.getElementById('imessage-avatar-img');
    const imAvatarIcon = document.getElementById('imessage-avatar-icon');

    if (imName) imName.textContent = userState.name || '未设置名称';
    if (imSign) imSign.textContent = userState.persona || '添加账号后可同步个性签名';

    if (userState.avatarUrl) {
        if (imAvatarImg) {
            imAvatarImg.src = userState.avatarUrl;
            imAvatarImg.style.display = 'block';
        }
        if (imAvatarIcon) imAvatarIcon.style.display = 'none';
    } else {
        if (imAvatarImg) imAvatarImg.style.display = 'none';
        if (imAvatarIcon) imAvatarIcon.style.display = 'block';
    }
}

// ==========================================
// 10. JIGGLE MODE & DRAG AND DROP
// ==========================================
const homeScreen = document.querySelector('.screen');
const dock = document.getElementById('dock');
window.isJiggleMode = false;
let draggedElement = null;
let activeDragPointerId = null;
window.preventAppClick = false;
const LONG_PRESS_DURATION = 400;
const DRAG_MOVE_TOLERANCE = 15;
const EDGE_PAGE_TRIGGER_WIDTH = 65;
const EDGE_PAGE_COOLDOWN = 450;
let lastEdgeScrollTime = 0;
let queuedDragMove = null;
let dragMoveRafId = null;

function getAllMainGrids() {
    return [...document.querySelectorAll('.main-grid')];
}

function getMaxHomePageIndex() {
    return Math.max(getAllMainGrids().length - 1, 0);
}

function getCurrentHomePageIndex() {
    const pagesContainerEl = document.getElementById('pages-container');
    if (!pagesContainerEl || !pagesContainerEl.clientWidth) return 0;
    const maxIndex = getMaxHomePageIndex();
    return Math.min(maxIndex, Math.max(0, Math.round(pagesContainerEl.scrollLeft / pagesContainerEl.clientWidth)));
}

function getGridForPageIndex(index) {
    return document.getElementById(`main-grid-${index + 1}`) || null;
}

function scrollToHomePageIndex(index, behavior = 'smooth') {
    const pagesContainerEl = document.getElementById('pages-container');
    if (!pagesContainerEl || !pagesContainerEl.clientWidth) return 0;
    const targetIndex = Math.min(getMaxHomePageIndex(), Math.max(0, index));
    pagesContainerEl.scrollTo({
        left: targetIndex * pagesContainerEl.clientWidth,
        behavior
    });
    return targetIndex;
}

function updateHomePageIndicators(pageIndex = getCurrentHomePageIndex()) {
    const dots = document.querySelectorAll('.page-indicators .dot');
    dots.forEach((dot, index) => {
        if (index === pageIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function stopCurrentPointerDrag() {
    if (draggedElement) draggedElement.classList.remove('dragging');
    draggedElement = null;
    activeDragPointerId = null;
    queuedDragMove = null;
    lastEdgeScrollTime = 0;
    if (dragMoveRafId !== null) {
        cancelAnimationFrame(dragMoveRafId);
        dragMoveRafId = null;
    }
    const ghost = document.getElementById('drag-ghost');
    if (ghost) ghost.remove();
}

function startPointerDrag(el, pointX, pointY, pointerId = null) {
    if (!el || el.classList.contains('empty-slot')) return;

    stopCurrentPointerDrag();
    draggedElement = el;
    activeDragPointerId = pointerId;
    el.classList.add('dragging');

    const ghost = el.cloneNode(true);
    ghost.id = 'drag-ghost';
    ghost.classList.remove('dragging');
    ghost.style.position = 'fixed';
    ghost.style.margin = '0';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.92';
    ghost.style.pointerEvents = 'none';
    ghost.style.transition = 'none';
    ghost.style.willChange = 'left, top, transform';

    const rect = el.getBoundingClientRect();
    const offsetX = Math.min(Math.max(pointX - rect.left, 0), rect.width);
    const offsetY = Math.min(Math.max(pointY - rect.top, 0), rect.height);

    ghost.dataset.offsetX = offsetX;
    ghost.dataset.offsetY = offsetY;
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.left = (pointX - offsetX) + 'px';
    ghost.style.top = (pointY - offsetY) + 'px';
    ghost.style.transform = 'scale(1.04)';
    ghost.style.boxShadow = '0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1)';
    ghost.style.borderRadius = 'inherit'; // Ensure shadow follows border radius if applicable

    document.body.appendChild(ghost);
}

// Use capturing phase to intercept clicks
if (homeScreen) {
    homeScreen.addEventListener('click', (e) => {
        if (e.target.closest('.jiggle-plus-btn') || e.target.closest('.jiggle-close-btn')) return; // Allow plus/close button to work

        if (window.isJiggleMode || window.preventAppClick) {
            e.stopPropagation();
            e.preventDefault();
        }
        // Intentionally removed auto-exit logic. Only clicking 'X' will close jiggle mode.
    }, true);

    homeScreen.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .custom-music-widget, .main-grid, .dock, .dock-container, .pages-container')) {
            e.preventDefault();
        }
    });
}

function setupDraggable(el) {
    if (el._dragSetup) return;
    el._dragSetup = true;

    // Clean up legacy dataset if it exists so it doesn't pollute saved HTML
    if (el.dataset.dragSetup) delete el.dataset.dragSetup;

    let isTouchDrag = false;
    let isMoved = false;
    let startX = 0;
    let startY = 0;
    let trackedPointerId = null;
    let longPressTimer = null;

    el.addEventListener('pointerdown', (e) => {
        trackedPointerId = e.pointerId;
        isMoved = false;
        startX = e.clientX;
        startY = e.clientY;

        if (typeof el.setPointerCapture === 'function') {
            try {
                el.setPointerCapture(e.pointerId);
            } catch (_) {}
        }

        // In jiggle mode, pointerdown immediately starts a drag
        if (window.isJiggleMode) {
            // Ignore empty slots for dragging
            if (el.classList.contains('empty-slot')) return;
            
            // Prevent default ONLY if it's not a form element or contenteditable
            if (!e.target.closest('[contenteditable="true"]') && e.target.tagName !== 'INPUT') {
                e.preventDefault();
            }

            isTouchDrag = true;
            startPointerDrag(el, e.clientX, e.clientY, e.pointerId);
            return;
        }

        window.preventAppClick = false;
        longPressTimer = setTimeout(() => {
            if (!isMoved && trackedPointerId === e.pointerId) {
                window.preventAppClick = true;
                enterJiggleMode();
                isTouchDrag = true;
                startPointerDrag(el, startX, startY, e.pointerId);
            }
        }, LONG_PRESS_DURATION);
    });

    // Track movement to cancel long press if they swipe
    el.addEventListener('pointermove', (e) => {
        if (trackedPointerId !== e.pointerId) return;
        if (!longPressTimer && !isTouchDrag) return;

        // Mobile touch jitter tolerance: only cancel long press after clear movement
        if (Math.abs(e.clientX - startX) > DRAG_MOVE_TOLERANCE || Math.abs(e.clientY - startY) > DRAG_MOVE_TOLERANCE) {
            isMoved = true;
            if (!window.isJiggleMode && longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }
    });

    const cancelPress = (e) => {
        if (trackedPointerId !== e.pointerId) return;

        if (longPressTimer) clearTimeout(longPressTimer);
        longPressTimer = null;
        
        // If they didn't hold long enough, and didn't move much, it's a click!
        if (!window.preventAppClick && !window.isJiggleMode && !isMoved) {
            // Do nothing, let native click fire
        } else if (window.preventAppClick && !window.isJiggleMode) {
            // Was long press, but jiggle hasn't started or we just cancelled it
            setTimeout(() => window.preventAppClick = false, 100);
        }

        // End drag if we were dragging
        if (isTouchDrag && window.isJiggleMode) {
            isTouchDrag = false;
            stopCurrentPointerDrag();
            balanceGridSlots();
            if (window.saveDesktopState) window.saveDesktopState();
        }

        if (typeof el.releasePointerCapture === 'function') {
            try {
                el.releasePointerCapture(e.pointerId);
            } catch (_) {}
        }

        trackedPointerId = null;
    };
    
    el.addEventListener('pointerup', cancelPress);
    el.addEventListener('pointercancel', cancelPress);
    
    // Disable native drag and drop to use our custom pointer events
    el.addEventListener('dragstart', (e) => e.preventDefault());
}

function refreshDraggables() {
    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .custom-music-widget').forEach(setupDraggable);
}

window.refreshDraggables = refreshDraggables;
refreshDraggables();

function getElementByMouse(container, x, y) {
    const elements = [...container.querySelectorAll('.app-item:not(.dragging):not(.empty-slot), .time-widget:not(.dragging), .ins-profile-widget:not(.dragging), .spotify-widget:not(.dragging), .pet-widget:not(.dragging), .couple-widget:not(.dragging), .status-card-widget:not(.dragging), .complex-music-widget:not(.dragging), .photo-profile-widget:not(.dragging), .custom-music-widget:not(.dragging)')];
    for (let child of elements) {
        const box = child.getBoundingClientRect();
        if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
            return { element: child, isLeft: x < box.left + box.width / 2 };
        }
    }
    
    // Also check empty slots so we can insert before them
    const emptySlots = [...container.querySelectorAll('.empty-slot')];
    if (emptySlots.length > 0) {
        for (let child of emptySlots) {
            const box = child.getBoundingClientRect();
            if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
                return { element: child, isLeft: true };
            }
        }
    }
    return null;
}

function swapNodes(node1, node2) {
    if (node1 === node2) return;
    const parent1 = node1.parentNode;
    const parent2 = node2.parentNode;
    const marker = document.createElement('div');
    parent1.insertBefore(marker, node1);
    parent2.insertBefore(node1, node2);
    marker.parentNode.insertBefore(node2, marker);
    marker.remove();
}

// Custom Drag Tracking to bypass dataTransfer limitations and enable visual following
function recordPositions() {
    const positions = new Map();
    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .custom-music-widget').forEach(el => {
        positions.set(el, el.getBoundingClientRect());
        el.style.transition = 'none';
        el.style.transform = '';
    });
    return positions;
}

function playAnimations(oldPositions) {
    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .custom-music-widget').forEach(el => {
        if (el.classList.contains('dragging')) return;
        const oldPos = oldPositions.get(el);
        if (!oldPos) return;
        const newPos = el.getBoundingClientRect();
        
        const dx = oldPos.left - newPos.left;
        const dy = oldPos.top - newPos.top;
        
        if (dx !== 0 || dy !== 0) {
            el.style.transform = `translate(${dx}px, ${dy}px)`;
            el.style.transition = 'none';
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    el.style.transform = '';
                    el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                });
            });
        }
    });
}

function dragMoveHandler(e) {
    if (!draggedElement || !window.isJiggleMode) return;
    if (activeDragPointerId !== null && e.pointerId !== activeDragPointerId) return;

    const ghost = document.getElementById('drag-ghost');
    if (ghost) {
        ghost.style.left = (e.clientX - parseFloat(ghost.dataset.offsetX)) + 'px';
        ghost.style.top = (e.clientY - parseFloat(ghost.dataset.offsetY)) + 'px';
    }

    const pagesContainerEl = document.getElementById('pages-container');
    if (pagesContainerEl) {
        const rect = pagesContainerEl.getBoundingClientRect();
        const now = Date.now();
        const isInsidePageZone = e.clientY >= rect.top && e.clientY <= rect.bottom;
        const currentPageIndex = getCurrentHomePageIndex();

        if (isInsidePageZone && now - lastEdgeScrollTime > EDGE_PAGE_COOLDOWN) {
            if (e.clientX > rect.right - EDGE_PAGE_TRIGGER_WIDTH && currentPageIndex < getMaxHomePageIndex()) {
                scrollToHomePageIndex(currentPageIndex + 1);
                lastEdgeScrollTime = now;
                return;
            }

            if (e.clientX < rect.left + EDGE_PAGE_TRIGGER_WIDTH && currentPageIndex > 0) {
                scrollToHomePageIndex(currentPageIndex - 1);
                lastEdgeScrollTime = now;
                return;
            }
        }
    }

    let targetContainer = null;
    const pageIndex = getCurrentHomePageIndex();
    const currentGrid = getGridForPageIndex(pageIndex);

    if (currentGrid) {
        const currentGridRect = currentGrid.getBoundingClientRect();
        if (e.clientY >= currentGridRect.top && e.clientY <= currentGridRect.bottom) {
            targetContainer = currentGrid;
        }
    }

    if (dock) {
        const dockRect = dock.getBoundingClientRect();
        if (!targetContainer && e.clientY >= dockRect.top - 20 && e.clientY <= dockRect.bottom + 20) {
            targetContainer = dock;
        }
    }

    if (!targetContainer) return;

    if (targetContainer === dock && !draggedElement.classList.contains('app-item')) return;

    const targetInfo = getElementByMouse(targetContainer, e.clientX, e.clientY);

    let didSwap = false;
    let oldPositions = null;

    if (targetInfo && targetInfo.element !== draggedElement) {
        const targetEl = targetInfo.element;
        oldPositions = recordPositions();

        if (draggedElement.parentNode === targetEl.parentNode) {
            swapNodes(draggedElement, targetEl);
            didSwap = true;
        } else if (draggedElement.parentNode === dock && targetEl.parentNode === currentGrid) {
            if (targetEl.classList.contains('empty-slot')) {
                targetEl.parentNode.insertBefore(draggedElement, targetEl);
                targetEl.remove();
            } else {
                swapNodes(draggedElement, targetEl);
            }
            didSwap = true;
        } else if (draggedElement.parentNode && draggedElement.parentNode.classList.contains('main-grid') && targetEl.parentNode === dock) {
            swapNodes(draggedElement, targetEl);
            didSwap = true;
        }
    } else if (!targetInfo && targetContainer === dock && draggedElement.parentNode !== dock) {
        const currentItems = dock.querySelectorAll('.app-item:not(.dragging)').length;
        if (currentItems < 4) {
            oldPositions = recordPositions();
            const empty = document.createElement('div');
            empty.className = 'app-item empty-slot';
            empty.innerHTML = '<div class="app-icon" style="opacity:0;"></div>';
            draggedElement.parentNode.insertBefore(empty, draggedElement);

            dock.appendChild(draggedElement);
            setupDraggable(empty);
            didSwap = true;
        }
    }

    if (didSwap && oldPositions) {
        playAnimations(oldPositions);
    }
}

function flushQueuedDragMove() {
    dragMoveRafId = null;
    if (!queuedDragMove) return;
    const move = queuedDragMove;
    queuedDragMove = null;
    dragMoveHandler(move);
}

document.addEventListener('pointermove', (e) => {
    if (!draggedElement || !window.isJiggleMode) return;
    if (activeDragPointerId !== null && e.pointerId !== activeDragPointerId) return;

    if (e.cancelable) e.preventDefault();

    queuedDragMove = {
        clientX: e.clientX,
        clientY: e.clientY,
        pointerId: e.pointerId
    };

    if (dragMoveRafId === null) {
        dragMoveRafId = requestAnimationFrame(flushQueuedDragMove);
    }
}, { passive: false });

document.addEventListener('pointerup', (e) => {
    if (!draggedElement || !window.isJiggleMode) return;
    if (activeDragPointerId !== null && e.pointerId !== activeDragPointerId) return;
    stopCurrentPointerDrag();
    balanceGridSlots();
    if (window.saveDesktopState) window.saveDesktopState();
});

document.addEventListener('pointercancel', (e) => {
    if (!draggedElement || !window.isJiggleMode) return;
    if (activeDragPointerId !== null && e.pointerId !== activeDragPointerId) return;
    stopCurrentPointerDrag();
    balanceGridSlots();
    if (window.saveDesktopState) window.saveDesktopState();
});

window.setupDraggable = setupDraggable;

// We no longer strip and append empty slots dynamically to the end, 
// because we want to preserve user-defined empty gaps.
// However, we still need a function to ensure exactly 24 capacity on load or major changes.
function balanceGridSlots() {
    const grids = document.querySelectorAll('.main-grid');
    grids.forEach(grid => {
        let usedSlots = 0;
        [...grid.children].forEach(item => {
            if (item.classList.contains('spotify-widget')) usedSlots += 16;
            else if (item.classList.contains('ins-profile-widget') || item.classList.contains('complex-music-widget')) usedSlots += 12;
            else if (item.classList.contains('time-widget') || item.classList.contains('status-card-widget') || item.classList.contains('photo-profile-widget') || item.classList.contains('custom-music-widget')) usedSlots += 8;
            else if (item.classList.contains('pet-widget') || item.classList.contains('couple-widget')) usedSlots += 4;
            else usedSlots += 1;
        });

        if (usedSlots < 24) {
            for (let i = 0; i < 24 - usedSlots; i++) {
                const empty = document.createElement('div');
                empty.className = 'app-item empty-slot';
                empty.innerHTML = '<div class="app-icon" style="opacity:0;"></div>';
                grid.appendChild(empty);
                setupDraggable(empty);
            }
        } else if (usedSlots > 24) {
            // Only prune empty slots from the end if we somehow overflowed
            const empties = [...grid.querySelectorAll('.empty-slot')];
            let excess = usedSlots - 24;
            for (let i = empties.length - 1; i >= 0 && excess > 0; i--) {
                empties[i].remove();
                excess--;
            }
        }
    });
}
window.balanceGridSlots = balanceGridSlots;

function enterJiggleMode() {
    window.isJiggleMode = true;
    document.body.classList.add('jiggle-mode');

    document.querySelectorAll('.app-item:not(.empty-slot), .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .custom-music-widget').forEach(el => {
        el.setAttribute('draggable', 'true');
    });

    // Add Plus button for widgets
    let plusBtn = document.querySelector('.jiggle-plus-btn');
    if (!plusBtn && homeScreen) {
        plusBtn = document.createElement('div');
        plusBtn.className = 'jiggle-plus-btn';
        plusBtn.innerHTML = '<i class="fas fa-plus"></i>';
        plusBtn.style.position = 'absolute';
        plusBtn.style.top = 'env(safe-area-inset-top, 20px)';
        plusBtn.style.left = '24px';
        plusBtn.style.backgroundColor = 'rgba(255,255,255,0.5)';
        plusBtn.style.backdropFilter = 'blur(10px)';
        plusBtn.style.WebkitBackdropFilter = 'blur(10px)';
        plusBtn.style.width = '40px';
        plusBtn.style.height = '40px';
        plusBtn.style.borderRadius = '50%';
        plusBtn.style.display = 'flex';
        plusBtn.style.justifyContent = 'center';
        plusBtn.style.alignItems = 'center';
        plusBtn.style.color = '#000';
        plusBtn.style.fontSize = '20px';
        plusBtn.style.zIndex = '100';
        plusBtn.style.cursor = 'pointer';

        homeScreen.appendChild(plusBtn);
        const openGallery = (e) => {
            if (e) { e.stopPropagation(); e.preventDefault(); }
            window.preventAppClick = false;
            stopCurrentPointerDrag();
            const gallerySheet = document.getElementById('widget-gallery-sheet');
            if (gallerySheet) openView(gallerySheet);
        };

        plusBtn.addEventListener('click', openGallery);
        plusBtn.addEventListener('touchend', openGallery);
        plusBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });
    }

    // Add Close button for exiting jiggle mode
    let closeBtn = document.querySelector('.jiggle-close-btn');
    if (!closeBtn && homeScreen) {
        closeBtn = document.createElement('div');
        closeBtn.className = 'jiggle-close-btn';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = 'env(safe-area-inset-top, 20px)';
        closeBtn.style.right = '24px';
        closeBtn.style.backgroundColor = 'rgba(255,255,255,0.5)';
        closeBtn.style.backdropFilter = 'blur(10px)';
        closeBtn.style.WebkitBackdropFilter = 'blur(10px)';
        closeBtn.style.width = '40px';
        closeBtn.style.height = '40px';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.display = 'flex';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.alignItems = 'center';
        closeBtn.style.color = '#000';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.zIndex = '100';
        closeBtn.style.cursor = 'pointer';

        homeScreen.appendChild(closeBtn);
        const closeJiggle = (e) => {
            if (e) { e.stopPropagation(); e.preventDefault(); }
            exitJiggleMode();
        };

        closeBtn.addEventListener('click', closeJiggle);
        closeBtn.addEventListener('touchend', closeJiggle);
        closeBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });
    }
}

function exitJiggleMode() {
    window.isJiggleMode = false;
    window.preventAppClick = false;
    document.body.classList.remove('jiggle-mode');
    stopCurrentPointerDrag();
    const plusBtn = document.querySelector('.jiggle-plus-btn');
    if (plusBtn) plusBtn.remove();
    const closeBtn = document.querySelector('.jiggle-close-btn');
    if (closeBtn) closeBtn.remove();

    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .custom-music-widget').forEach(el => {
        el.removeAttribute('draggable');
    });
    
    // Save state after arranging
    if (window.saveDesktopState) window.saveDesktopState();
}
window.enterJiggleMode = enterJiggleMode;
window.exitJiggleMode = exitJiggleMode;

// ==========================================
// 11. SWIPE / SCROLL NAVIGATION
// ==========================================
const pagesContainer = document.getElementById('pages-container');
if (pagesContainer) {
    let isDown = false;
    let startX;
    let scrollLeft;

    pagesContainer.addEventListener('pointerdown', (e) => {
        // Do not intercept if in jiggle mode or interacting with bottom sheets/buttons
        if (window.isJiggleMode || window.preventAppClick || e.target.closest('.bottom-sheet-overlay')) return;
        isDown = true;
        startX = e.pageX - pagesContainer.offsetLeft;
        scrollLeft = pagesContainer.scrollLeft;
    });

    pagesContainer.addEventListener('pointerleave', () => {
        if (!isDown) return;
        isDown = false;
        snapToNearestPage();
    });

    pagesContainer.addEventListener('pointerup', () => {
        if (!isDown) return;
        isDown = false;
        snapToNearestPage();
    });

    pagesContainer.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        if (window.isJiggleMode) {
            isDown = false;
            return;
        }
        
        const x = e.pageX - pagesContainer.offsetLeft;
        const walk = (x - startX) * 1.5;
        
        if (Math.abs(walk) > 10) {
            // We are actually swiping
            e.preventDefault(); 
            pagesContainer.scrollLeft = scrollLeft - walk;
        }
    });

    function snapToNearestPage() {
        if (!pagesContainer.clientWidth) return;
        const pageIndex = Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth);
        scrollToHomePageIndex(pageIndex, 'smooth');
    }
    
    pagesContainer.addEventListener('scroll', () => {
        updateHomePageIndicators();
    });

    updateHomePageIndicators();
}
