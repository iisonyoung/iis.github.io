
document.addEventListener('DOMContentLoaded', () => {
    const WIDGET_META = {
        'ins-profile-widget': { slots: 12, ghostWidth: '321px', ghostHeight: '240px' },
        'spotify-widget': { slots: 16, ghostWidth: '321px', ghostHeight: '325px' },
        'pet-widget': { slots: 4, ghostWidth: null, ghostHeight: null },
        'couple-widget': { slots: 4, ghostWidth: null, ghostHeight: null },
        'status-card-widget': { slots: 8, ghostWidth: '321px', ghostHeight: null },
        'complex-music-widget': { slots: 12, ghostWidth: '321px', ghostHeight: '240px' },
        'photo-profile-widget': { slots: 8, ghostWidth: '321px', ghostHeight: null },
        'custom-music-widget': { slots: 8, ghostWidth: '321px', ghostHeight: null }
    };

    function getWidgetMetaByClassName(className) {
        if (!className || typeof className !== 'string') return null;
        return Object.entries(WIDGET_META).find(([key]) => className.includes(key))?.[1] || null;
    }

    function getWidgetSlotsByClassName(className, fallbackSlots = 1) {
        return getWidgetMetaByClassName(className)?.slots || fallbackSlots;
    }

    function consumeGridEmptySlots(grid, count) {
        if (!grid || count <= 0) return;
        const empties = [...grid.querySelectorAll('.empty-slot')];
        for (let i = 0; i < count; i++) {
            const empty = empties[empties.length - 1 - i];
            if (empty) empty.remove();
        }
    }

    function getCurrentGridPageIndex() {
        const pagesContainer = document.getElementById('pages-container');
        const maxIndex = Math.max(document.querySelectorAll('.main-grid').length - 1, 0);
        return pagesContainer && pagesContainer.clientWidth
            ? Math.min(maxIndex, Math.max(0, Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth)))
            : 0;
    }

    function getGridByPageIndex(pageIndex) {
        return document.getElementById(`main-grid-${pageIndex + 1}`);
    }

    // Helper to get element by mouse coordinates across both grids
    function getGridSlotByMouse(x, y) {
        const pageIndex = getCurrentGridPageIndex();
        const currentGrid = getGridByPageIndex(pageIndex);
        if (!currentGrid) return null;
        
        const elements = [...currentGrid.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .custom-music-widget')];
        for (let child of elements) {
            const box = child.getBoundingClientRect();
            if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
                return { element: child, isLeft: x < box.left + box.width / 2, grid: currentGrid };
            }
        }
        // If no specific element found under mouse, still return the grid to append to first available slot
        return { element: null, isLeft: false, grid: currentGrid };
     }

    // Exported function for clicking to add widgets
    window.addWidgetToGrid = function(html, className, slotsOverride) {
        const resolvedSlotsNeeded = getWidgetSlotsByClassName(className, slotsOverride || 1);
        const pagesContainer = document.getElementById('pages-container');
        let pageIndex = getCurrentGridPageIndex();
        let currentGrid = getGridByPageIndex(pageIndex);
        if (!currentGrid) return;
        
        let empties = currentGrid.querySelectorAll('.empty-slot');
        
        if (empties.length < resolvedSlotsNeeded) {
            // Find next page
            let found = false;
            let nextIndex = pageIndex + 1;
            let nextGrid = document.getElementById(`main-grid-${nextIndex + 1}`);
            
            // Loop through all existing subsequent grids
            while (nextGrid) {
                let nextEmpties = nextGrid.querySelectorAll('.empty-slot');
                if (nextEmpties.length >= resolvedSlotsNeeded) {
                    currentGrid = nextGrid;
                    empties = nextEmpties;
                    found = true;
                    // Scroll to this page
                    if (pagesContainer) {
                        pagesContainer.scrollTo({
                            left: nextIndex * pagesContainer.clientWidth,
                            behavior: 'smooth'
                        });
                    }
                    break;
                }
                nextIndex++;
                nextGrid = document.getElementById(`main-grid-${nextIndex + 1}`);
            }
            
            if (!found) {
                if (window.showToast) window.showToast('所有页面空间都不足');
                return;
            }
        }
        
        consumeGridEmptySlots(currentGrid, resolvedSlotsNeeded);
        
        const widgetWrapper = document.createElement('div');
        widgetWrapper.innerHTML = html;
        const widget = widgetWrapper.firstElementChild;
        
        if (className.includes('ins-profile-widget')) bindInsProfileWidget(widget);
        else if (className.includes('spotify-widget')) bindSpotifyWidget(widget);
        else if (className.includes('pet-widget')) bindPetWidget(widget);
        else if (className.includes('couple-widget')) bindCoupleWidget(widget);
        else if (className.includes('status-card-widget')) bindStatusCardWidget(widget);
        else if (className.includes('complex-music-widget')) bindComplexMusicWidget(widget);
        else if (className.includes('custom-music-widget')) bindCustomMusicWidget(widget);
        
        if (window.setupDraggable) window.setupDraggable(widget);
        
        const firstEmpty = currentGrid.querySelector('.empty-slot');
        if (firstEmpty) {
            currentGrid.insertBefore(widget, firstEmpty);
        } else {
            currentGrid.appendChild(widget);
        }
        
        if (window.balanceGridSlots) window.balanceGridSlots();
        if (window.closeView) window.closeView(document.getElementById('widget-gallery-sheet'));
        if (window.enterJiggleMode && !window.isJiggleMode) window.enterJiggleMode();
        
        // Save state immediately after adding
        if (window.saveDesktopState) window.saveDesktopState();
    };

    function createSpotifyWidget() {
        const widget = document.createElement('div');
        widget.className = 'spotify-widget';
        const wid = Date.now();
        widget.id = 'spotify-widget-' + wid;
        
        // Generate random heights for the waveform
        const numBars = 35;
        let waveformHtml = '';
        for (let i = 0; i < numBars; i++) {
            const height = Math.floor(Math.random() * 80) + 20; // 20% to 100%
            waveformHtml += `<div class="waveform-bar" style="height: ${height}%;"></div>`;
        }

        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            <div class="spotify-widget-header">
                <div class="spotify-widget-info-pill">
            <div class="spotify-widget-text">
                        <div class="spotify-widget-title" id="spotify-widget-title-${wid}" contenteditable="true" spellcheck="false">iisonyoung</div>
                        <div class="spotify-widget-handle" id="spotify-widget-handle-${wid}" contenteditable="true" spellcheck="false">@iis</div>
                    </div>
                    <i class="fas fa-heart spotify-widget-heart"></i>
                </div>
                <div class="spotify-widget-logo">
                    <i class="fab fa-spotify"></i>
                </div>
            </div>
            
            <div class="spotify-widget-images">
                <div class="spotify-widget-img-container left-img" id="spotify-img-container-1-${wid}">
                    <img src="" id="spotify-img-1-${wid}">
                    <i class="fas fa-image" style="font-size: 32px;"></i>
                    <input type="file" id="spotify-upload-1-${wid}" accept="image/*" style="display:none;">
                </div>
                <div class="spotify-widget-img-container right-img" id="spotify-img-container-2-${wid}">
                    <img src="" id="spotify-img-2-${wid}">
                    <i class="fas fa-image" style="font-size: 32px;"></i>
                    <input type="file" id="spotify-upload-2-${wid}" accept="image/*" style="display:none;">
                </div>
            </div>

            <div class="spotify-widget-waveform">
                ${waveformHtml}
            </div>
        `;
        bindSpotifyWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindSpotifyWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup uploads for left image
        const imgContainer1 = widget.querySelector('.left-img');
        const upload1 = imgContainer1 ? imgContainer1.querySelector('input[type="file"]') : null;
        const img1 = imgContainer1 ? imgContainer1.querySelector('img') : null;
        const icon1 = imgContainer1 ? imgContainer1.querySelector('i') : null;
        
        if (imgContainer1 && upload1) {
            imgContainer1.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); upload1.click(); }
            });
            upload1.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (img1) { img1.src = ev.target.result; img1.style.display = 'block'; }
                        if (icon1) { icon1.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Setup uploads for right image
        const imgContainer2 = widget.querySelector('.right-img');
        const upload2 = imgContainer2 ? imgContainer2.querySelector('input[type="file"]') : null;
        const img2 = imgContainer2 ? imgContainer2.querySelector('img') : null;
        const icon2 = imgContainer2 ? imgContainer2.querySelector('i') : null;
        
        if (imgContainer2 && upload2) {
            imgContainer2.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); upload2.click(); }
            });
            upload2.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (img2) { img2.src = ev.target.result; img2.style.display = 'block'; }
                        if (icon2) { icon2.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
        
        // Optional: Animate waveform on click (if not editing)
        const waveform = widget.querySelector('.spotify-widget-waveform');
        if (waveform) {
            widget.addEventListener('click', (e) => {
                if (window.isJiggleMode || window.preventAppClick || e.target.closest('[contenteditable="true"]') || e.target.closest('.spotify-widget-img-container')) return;
                
                // Toggle animation
                const isPlaying = widget.classList.toggle('playing');
                const bars = waveform.querySelectorAll('.waveform-bar');
                
                if (isPlaying) {
                    bars.forEach((bar, index) => {
                        bar.style.transition = 'height 0.2s ease-in-out';
                        // Randomize heights continuously
                        bar.dataset.intervalId = setInterval(() => {
                            const newHeight = Math.floor(Math.random() * 80) + 20;
                            bar.style.height = `${newHeight}%`;
                        }, 200 + Math.random() * 200);
                    });
                } else {
                    bars.forEach(bar => {
                        if (bar.dataset.intervalId) {
                            clearInterval(parseInt(bar.dataset.intervalId));
                            delete bar.dataset.intervalId;
                        }
                    });
                }
            });
        }
    }

    function createComplexMusicWidget() {
        const widget = document.createElement('div');
        widget.className = 'complex-music-widget';
        const wid = Date.now();
        widget.id = 'complex-music-widget-' + wid;
        
        widget.innerHTML = `
            <div class="delete-widget-btn" style="z-index: 50;"><i class="fas fa-times"></i></div>
            
            <div class="cmw-main-card">
                <div class="cmw-cast-icon"><i class="fas fa-music"></i></div>
                <div class="cmw-progress-bar">
                    <div class="cmw-progress-fill">
                        <div class="cmw-progress-dot"></div>
                    </div>
                </div>
                <div class="cmw-time-current" contenteditable="true" spellcheck="false">1:15</div>
                <div class="cmw-time-total" contenteditable="true" spellcheck="false">-2:38</div>
                <div class="cmw-controls">
                    <i class="fas fa-backward" style="font-size: 24px; cursor: pointer;"></i>
                    <div class="cmw-play-btn" id="cmw-play-btn-${wid}">
                        <div class="cmw-play-bar"></div>
                        <div class="cmw-play-bar"></div>
                    </div>
                    <i class="fas fa-forward" style="font-size: 24px; cursor: pointer;"></i>
                </div>
            </div>
            
            <div class="cmw-top-ring">
                <div class="cmw-top-ring-bg" id="cmw-ring-btn-${wid}" style="cursor: pointer;">
                    <img src="" id="cmw-ring-img-${wid}">
                    <i class="fas fa-image" id="cmw-ring-icon-${wid}"></i>
                    <input type="file" id="cmw-ring-upload-${wid}" accept="image/*" style="display:none;">
                </div>
                <div class="cmw-heart-top"><i class="fas fa-heart" style="color: #333; font-size: 14px;"></i></div>
                <div class="cmw-heart-bottom"><i class="fas fa-heart" style="color: #333; font-size: 14px;"></i></div>
                <div class="cmw-waveform-pill" contenteditable="true" spellcheck="false">oxo</div>
            </div>
        `;
        bindComplexMusicWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindComplexMusicWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup upload for Top Ring
        const ringBtn = widget.querySelector('.cmw-top-ring-bg');
        const ringUpload = ringBtn ? ringBtn.querySelector('input[type="file"]') : null;
        const ringImg = ringBtn ? ringBtn.querySelector('img') : null;
        const ringIcon = ringBtn ? ringBtn.querySelector('i') : null;
        
        if (ringBtn && ringUpload) {
            ringBtn.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { 
                    e.stopPropagation(); 
                    ringUpload.click(); 
                }
            });
            ringUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (ringImg) { ringImg.src = ev.target.result; ringImg.style.display = 'block'; }
                        if (ringIcon) { ringIcon.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Play button interaction
        const playBtn = widget.querySelector('.cmw-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                if (window.isJiggleMode || window.preventAppClick) return;
                e.stopPropagation();
                widget.classList.toggle('playing');
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
    }

    function createStatusCardWidget() {
        const widget = document.createElement('div');
        widget.className = 'status-card-widget';
        const wid = Date.now();
        widget.id = 'status-card-widget-' + wid;
        
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            
            <div class="status-card-top" id="status-card-top-${wid}">
                <img src="" class="status-card-bg-img" id="status-card-bg-${wid}">
                <div class="status-card-bg-upload-btn"><i class="fas fa-camera"></i></div>
                <input type="file" id="status-card-bg-upload-${wid}" accept="image/*" style="display:none;">
                
                <div class="status-card-date" id="status-card-date-${wid}" contenteditable="true" spellcheck="false">03-02</div>
                <div class="status-card-temp" id="status-card-temp-${wid}" contenteditable="true" spellcheck="false">11°</div>
            </div>
            
            <div class="status-card-bottom">
                <div class="status-card-progress-area">
                    <div class="status-card-progress-label" contenteditable="true" spellcheck="false">今日剩余</div>
                    <i class="fas fa-heart" style="color: #ccc; font-size: 10px;"></i>
                    <div class="status-card-progress-track">
                        <div class="status-card-progress-fill"></div>
                    </div>
                    <i class="fas fa-heart" style="color: #ccc; font-size: 10px;"></i>
                    <div class="status-card-progress-value" contenteditable="true" spellcheck="false">61%</div>
                </div>
            </div>
            
            <div class="status-card-avatar-wrapper">
                <div class="status-card-avatar" id="status-card-avatar-btn-${wid}">
                    <img src="" id="status-card-avatar-img-${wid}">
                    <i class="fas fa-user" id="status-card-avatar-icon-${wid}"></i>
                    <input type="file" id="status-card-avatar-upload-${wid}" accept="image/*" style="display:none;">
                </div>
                <div class="status-card-clip"><i class="fas fa-paperclip"></i></div>
                
                <div class="status-card-info-pill">
                    <div class="status-card-name-box" contenteditable="true" spellcheck="false">iis</div>
                </div>
            </div>
        `;
        bindStatusCardWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindStatusCardWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup upload for Top Background
        const topBgContainer = widget.querySelector('.status-card-top');
        const bgUpload = topBgContainer ? topBgContainer.querySelector('input[type="file"]') : null;
        const bgImg = topBgContainer ? topBgContainer.querySelector('.status-card-bg-img') : null;
        const bgIcon = topBgContainer ? topBgContainer.querySelector('.status-card-bg-upload-btn') : null;
        
        if (topBgContainer && bgUpload) {
            topBgContainer.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick && !e.target.closest('[contenteditable="true"]')) { 
                    e.stopPropagation(); 
                    bgUpload.click(); 
                }
            });
            bgUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (bgImg) { bgImg.src = ev.target.result; bgImg.style.display = 'block'; }
                        if (bgIcon) { bgIcon.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Setup upload for Center Avatar
        const avatarContainer = widget.querySelector('.status-card-avatar');
        const avatarUpload = avatarContainer ? avatarContainer.querySelector('input[type="file"]') : null;
        const avatarImg = avatarContainer ? avatarContainer.querySelector('img') : null;
        const avatarIcon = avatarContainer ? avatarContainer.querySelector('i.fa-user') : null;
        
        if (avatarContainer && avatarUpload) {
            avatarContainer.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { 
                    e.stopPropagation(); 
                    avatarUpload.click(); 
                }
            });
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (avatarImg) { avatarImg.src = ev.target.result; avatarImg.style.display = 'block'; }
                        if (avatarIcon) { avatarIcon.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Battery API Integration
        const progressTrack = widget.querySelector('.status-card-progress-track');
        const progressFill = widget.querySelector('.status-card-progress-fill');
        const progressText = widget.querySelector('.status-card-progress-value');
        
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                const updateBattery = () => {
                    if (progressFill && progressText) {
                        const level = Math.round(battery.level * 100);
                        progressFill.style.width = level + '%';
                        progressText.textContent = level + '%';
                        if (window.saveDesktopState) window.saveDesktopState();
                    }
                };
                
                // Initial update
                updateBattery();
                
                // Listen for changes
                battery.addEventListener('levelchange', updateBattery);
            });
        } else {
            // Fallback interactive logic if Battery API not supported
            if (progressTrack && progressFill && progressText) {
                progressTrack.addEventListener('click', (e) => {
                    if (window.isJiggleMode || window.preventAppClick) return;
                    e.stopPropagation();
                    
                    // Calculate percentage based on click position
                    const rect = progressTrack.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    let percentage = Math.round((clickX / rect.width) * 100);
                    
                    // Clamp
                    if (percentage < 0) percentage = 0;
                    if (percentage > 100) percentage = 100;
                    
                    progressFill.style.width = percentage + '%';
                    progressText.textContent = percentage + '%';
                    
                    if (window.saveDesktopState) window.saveDesktopState();
                });
            }
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
    }

    function createCoupleWidget() {
        const widget = document.createElement('div');
        widget.className = 'couple-widget';
        const wid = Date.now();
        widget.id = 'couple-widget-' + wid;
        
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            
            <div class="couple-avatar-container">
                <div class="couple-bubble" contenteditable="true" spellcheck="false">ㅠㅠ</div>
                <div class="couple-img-wrapper" id="couple-img-container-1-${wid}">
                    <img src="" id="couple-img-1-${wid}">
                    <i class="fas fa-image" id="couple-icon-1-${wid}"></i>
                    <input type="file" id="couple-upload-1-${wid}" accept="image/*" style="display:none;">
                </div>
            </div>
            
            <div class="couple-avatar-container">
                <div class="couple-bubble" contenteditable="true" spellcheck="false">ㅎㅎ</div>
                <div class="couple-img-wrapper" id="couple-img-container-2-${wid}">
                    <img src="" id="couple-img-2-${wid}">
                    <i class="fas fa-image" id="couple-icon-2-${wid}"></i>
                    <input type="file" id="couple-upload-2-${wid}" accept="image/*" style="display:none;">
                </div>
            </div>
        `;
        bindCoupleWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindCoupleWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup upload for left image
        const imgContainer1 = widget.querySelectorAll('.couple-img-wrapper')[0];
        const upload1 = imgContainer1 ? imgContainer1.querySelector('input[type="file"]') : null;
        const img1 = imgContainer1 ? imgContainer1.querySelector('img') : null;
        const icon1 = imgContainer1 ? imgContainer1.querySelector('i') : null;
        
        if (imgContainer1 && upload1) {
            imgContainer1.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); upload1.click(); }
            });
            upload1.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (img1) { img1.src = ev.target.result; img1.style.display = 'block'; }
                        if (icon1) { icon1.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Setup upload for right image
        const imgContainer2 = widget.querySelectorAll('.couple-img-wrapper')[1];
        const upload2 = imgContainer2 ? imgContainer2.querySelector('input[type="file"]') : null;
        const img2 = imgContainer2 ? imgContainer2.querySelector('img') : null;
        const icon2 = imgContainer2 ? imgContainer2.querySelector('i') : null;
        
        if (imgContainer2 && upload2) {
            imgContainer2.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); upload2.click(); }
            });
            upload2.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (img2) { img2.src = ev.target.result; img2.style.display = 'block'; }
                        if (icon2) { icon2.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
    }

    function createPhotoProfileWidget() {
        const widget = document.createElement('div');
        widget.className = 'photo-profile-widget';
        const wid = Date.now();
        widget.id = 'photo-profile-widget-' + wid;
        
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            
            <div class="ppw-top-half" id="ppw-bg-btn-${wid}" style="background-color: #333;">
                <img src="" class="ppw-bg-img" id="ppw-bg-img-${wid}">
                
                <div class="ppw-top-content">
                    <div class="ppw-avatar-container" id="ppw-avatar-btn-${wid}">
                        <img src="" id="ppw-avatar-img-${wid}">
                        <i class="fas fa-user" id="ppw-avatar-icon-${wid}"></i>
                        <input type="file" id="ppw-avatar-upload-${wid}" accept="image/*" style="display:none;">
                    </div>
                    
                    <div class="ppw-info">
                        <div class="ppw-name-row" contenteditable="true" spellcheck="false">iisonyoung</div>
                        <div class="ppw-sign-row" contenteditable="true" spellcheck="false">☆* iwish..★행복.●・)♡</div>
                    </div>
                    
                    <div class="ppw-action-btn" contenteditable="true" spellcheck="false">关注中</div>
                </div>
            </div>
            
            <div class="ppw-bottom-half">
                <div class="ppw-photo-slot" id="ppw-photo-btn-1-${wid}">
                    <img src="" id="ppw-photo-img-1-${wid}">
                    <i class="fas fa-image" id="ppw-photo-icon-1-${wid}"></i>
                    <input type="file" id="ppw-photo-upload-1-${wid}" accept="image/*" style="display:none;">
                </div>
                <div class="ppw-photo-slot" id="ppw-photo-btn-2-${wid}">
                    <img src="" id="ppw-photo-img-2-${wid}">
                    <i class="fas fa-image" id="ppw-photo-icon-2-${wid}"></i>
                    <input type="file" id="ppw-photo-upload-2-${wid}" accept="image/*" style="display:none;">
                </div>
                <div class="ppw-photo-slot" id="ppw-photo-btn-3-${wid}">
                    <img src="" id="ppw-photo-img-3-${wid}">
                    <i class="fas fa-image" id="ppw-photo-icon-3-${wid}"></i>
                    <input type="file" id="ppw-photo-upload-3-${wid}" accept="image/*" style="display:none;">
                </div>
            </div>
        `;
        bindPhotoProfileWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function createCustomMusicWidget() {
        const widget = document.createElement('div');
        widget.className = 'custom-music-widget';
        const wid = Date.now();
        widget.id = 'custom-music-widget-' + wid;
        
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            <div style="position: absolute; top: 12px; left: 12px; width: 28px; height: 28px; border-radius: 50%; background-color: #e5e5ea; display: flex; justify-content: center; align-items: center; color: #000; font-size: 14px; box-shadow: none; z-index: 5;">
                <i class="fas fa-ellipsis-h"></i>
            </div>
            
            <div style="display: flex; flex: 1; align-items: center; gap: 15px; margin-bottom: 12px; padding-top: 10px; padding-left: 36px;">
                <!-- Left: Uploadable Image -->
                <div id="cm-cover-btn-${wid}" style="width: 90px; height: 90px; border-radius: 16px; background-color: #e5e5ea; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; flex-shrink: 0; box-shadow: none; border: 1px solid rgba(0,0,0,0.05);">
                    <img src="" id="cm-cover-img-${wid}" style="width: 100%; height: 100%; object-fit: cover; display: none; position: absolute; top: 0; left: 0;">
                    <i class="fas fa-image" id="cm-cover-icon-${wid}" style="font-size: 30px; color: #ccc;"></i>
                    <input type="file" id="cm-cover-upload-${wid}" accept="image/*" style="display:none;">
                </div>
                
                <!-- Right: Centered Text -->
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; height: 100%;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 3px; height: 20px; background-color: #000; border-radius: 2px; box-shadow: none;"></div>
                        <div contenteditable="true" spellcheck="false" style="font-size: 18px; font-weight: 600; color: #333; outline: none; white-space: nowrap;">iisonyoung</div>
                    </div>
                </div>
            </div>
            
            <!-- Bottom: Progress and Controls -->
            <div style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 0 8px; box-sizing: border-box;">
                <div style="font-size: 11px; color: #8e8e93; font-weight: 500;">2:04</div>
                <div style="flex: 1; height: 5px; background-color: rgba(0,0,0,0.1); border-radius: 3px; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; height: 100%; width: 68%; background-color: #ccc; border-radius: 3px;"></div>
                </div>
                <div style="font-size: 11px; color: #8e8e93; font-weight: 500;">-0:56</div>
                <div style="margin-left: 8px; color: #000; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 24px;">
                    <i class="fas fa-pause"></i>
                </div>
            </div>
        `;
        bindCustomMusicWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindCustomMusicWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Handle image upload
        const coverBtn = widget.querySelector('[id^="cm-cover-btn-"]');
        const uploadInput = widget.querySelector('[id^="cm-cover-upload-"]');
        const coverImg = widget.querySelector('[id^="cm-cover-img-"]');
        const coverIcon = widget.querySelector('[id^="cm-cover-icon-"]');
        
        if (coverBtn && uploadInput) {
            coverBtn.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { 
                    e.stopPropagation(); 
                    uploadInput.click(); 
                }
            });
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (coverImg) { coverImg.src = ev.target.result; coverImg.style.display = 'block'; }
                        if (coverIcon) { coverIcon.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
    }

    function createPetWidget() {
        const widget = document.createElement('div');
        widget.className = 'pet-widget';
        const wid = Date.now();
        widget.id = 'pet-widget-' + wid;
        
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            
            <div class="pet-widget-img-wrapper" id="pet-img-container-${wid}">
                <img src="" id="pet-img-${wid}">
                <i class="fas fa-image" id="pet-icon-${wid}" style="font-size: 30px; color: #ccc;"></i>
                <input type="file" id="pet-upload-${wid}" accept="image/*" style="display:none;">
            </div>
            
            <div class="pet-widget-bubble" id="pet-bubble-${wid}" contenteditable="true" spellcheck="false">oxo</div>
            
            <div class="pet-widget-music-icon"><i class="fas fa-music"></i></div>
            
            <div class="pet-widget-plus-btn"><i class="fas fa-plus"></i></div>
        `;
        bindPetWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindPetWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup upload for central image
        const imgContainer = widget.querySelector('.pet-widget-img-wrapper');
        const upload = imgContainer ? imgContainer.querySelector('input[type="file"]') : null;
        const img = imgContainer ? imgContainer.querySelector('img') : null;
        const icon = imgContainer ? imgContainer.querySelector('i') : null;
        
        if (imgContainer && upload) {
            imgContainer.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); upload.click(); }
            });
            upload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (img) { img.src = ev.target.result; img.style.display = 'block'; }
                        if (icon) { icon.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
        
        const plusBtn = widget.querySelector('.pet-widget-plus-btn');
        if (plusBtn) {
            plusBtn.addEventListener('click', (e) => {
                if (!window.isJiggleMode && !window.preventAppClick) {
                    e.stopPropagation();
                    // Add some fun interaction later if needed, currently just stops propagation
                }
            });
        }
    }

    function createInsProfileWidget() {
        const widget = document.createElement('div');
        widget.className = 'ins-profile-widget';
        const wid = Date.now();
        widget.id = 'ins-profile-widget-' + wid;
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            <div class="custom-widget-top">
                <div class="custom-widget-avatar-wrapper" id="custom-avatar-btn-${wid}">
                    <img src="" id="custom-avatar-img-${wid}" style="display: none;">
                    <i class="fas fa-user"></i>
                    <input type="file" id="custom-avatar-upload-${wid}" accept="image/*" style="display:none;">
                </div>
                <div class="custom-widget-stats">
                    <div class="custom-widget-stat-item">
                        <div class="custom-widget-stat-num" contenteditable="true" spellcheck="false">0</div>
                        <div class="custom-widget-stat-label">Posts</div>
                    </div>
                    <div class="custom-widget-stat-item">
                        <div class="custom-widget-stat-num" contenteditable="true" spellcheck="false">1314</div>
                        <div class="custom-widget-stat-label">Followers</div>
                    </div>
                    <div class="custom-widget-stat-item">
                        <div class="custom-widget-stat-num" contenteditable="true" spellcheck="false">520</div>
                        <div class="custom-widget-stat-label">Following</div>
                    </div>
                </div>
            </div>
            <div class="custom-widget-name" id="custom-name-${wid}" contenteditable="true" spellcheck="false">name @iisonyoung</div>
            <div class="custom-widget-edit-btn">Edit Profile</div>
            <div class="custom-widget-bottom">
                <div class="custom-widget-add-icon"><i class="fas fa-plus"></i></div>
                <div class="custom-widget-small-avatar" id="custom-small-avatar-btn-${wid}">
                    <img src="" id="custom-small-avatar-img-${wid}" style="display: none;">
                    <i class="fas fa-image"></i>
                    <input type="file" id="custom-small-avatar-upload-${wid}" accept="image/*" style="display:none;">
                </div>
            </div>
        `;
        bindInsProfileWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindInsProfileWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup uploads for main avatar
        const avatarBtn = widget.querySelector('.custom-widget-avatar-wrapper');
        const avatarUpload = avatarBtn ? avatarBtn.querySelector('input[type="file"]') : null;
        const avatarImg = avatarBtn ? avatarBtn.querySelector('img') : null;
        const avatarIcon = avatarBtn ? avatarBtn.querySelector('i') : null;
        if (avatarBtn && avatarUpload) {
            avatarBtn.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); avatarUpload.click(); }
            });
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (avatarImg) { avatarImg.src = ev.target.result; avatarImg.style.display = 'block'; }
                        if (avatarIcon) avatarIcon.style.display = 'none';
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Setup uploads for small bottom avatar
        const smallAvatarBtn = widget.querySelector('.custom-widget-small-avatar');
        const smallAvatarUpload = smallAvatarBtn ? smallAvatarBtn.querySelector('input[type="file"]') : null;
        const smallAvatarImg = smallAvatarBtn ? smallAvatarBtn.querySelector('img') : null;
        const smallAvatarIcon = smallAvatarBtn ? smallAvatarBtn.querySelector('i') : null;
        if (smallAvatarBtn && smallAvatarUpload) {
            smallAvatarBtn.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); smallAvatarUpload.click(); }
            });
            smallAvatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (smallAvatarImg) { smallAvatarImg.src = ev.target.result; smallAvatarImg.style.display = 'block'; }
                        if (smallAvatarIcon) smallAvatarIcon.style.display = 'none';
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
    }

    // Gallery Drag & Drop Logic
    const gallerySheet = document.getElementById('widget-gallery-sheet');
    const insPreviewBtn = document.getElementById('add-ins-profile-btn');
    const spotifyPreviewBtn = document.getElementById('add-spotify-widget-btn');
    const petPreviewBtn = document.getElementById('add-pet-widget-btn');
    const couplePreviewBtn = document.getElementById('add-couple-widget-btn');
    const statusCardPreviewBtn = document.getElementById('add-status-card-btn');
    const complexMusicPreviewBtn = document.getElementById('add-complex-music-btn');
    const customMusicPreviewBtn = document.getElementById('add-custom-music-btn');

    function setupGalleryDrag(btn, createWidgetFn, widgetClassKey, offsetW, offsetH) {
        if (!btn) return;
        let isDraggingFromGallery = false;
        let galleryGhost = null;
        let offsetX = 0;
        let offsetY = 0;
        let pressTimer = null;
        let initialX = 0, initialY = 0;

        btn.addEventListener('pointerdown', (e) => {
            initialX = e.clientX;
            initialY = e.clientY;
            
            pressTimer = setTimeout(() => {
                startGalleryDrag(e);
            }, 300);
        });

        const cancelGalleryPress = (e) => {
            if (pressTimer) clearTimeout(pressTimer);
            if (!isDraggingFromGallery) return;
            endGalleryDrag(e);
        };

        const handleGalleryMove = (e) => {
            if (pressTimer) {
                if (Math.abs(e.clientX - initialX) > 10 || Math.abs(e.clientY - initialY) > 10) {
                    clearTimeout(pressTimer);
                }
            }

            if (isDraggingFromGallery && galleryGhost) {
                e.preventDefault();
                galleryGhost.style.left = (e.clientX - offsetX) + 'px';
                galleryGhost.style.top = (e.clientY - offsetY) + 'px';
            }
        };

        btn.addEventListener('pointerup', (e) => {
            if (pressTimer) clearTimeout(pressTimer);
            if (!isDraggingFromGallery) {
                // Short click adds automatically using smart logic
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(createWidgetFn());
                const className = tempDiv.firstElementChild.className;
                
                window.addWidgetToGrid(tempDiv.innerHTML, className);
            } else {
                endGalleryDrag(e);
            }
        });

        document.addEventListener('pointermove', handleGalleryMove, { passive: false });
        document.addEventListener('pointerup', cancelGalleryPress);
        document.addEventListener('pointercancel', cancelGalleryPress);

        function startGalleryDrag(e) {
            const pageIndex = getCurrentGridPageIndex();
            const currentGrid = getGridByPageIndex(pageIndex);
            
            if (!currentGrid) return;

            // Allow starting drag even if current page is full so user can drag to dock or other pages
            isDraggingFromGallery = true;
            
            galleryGhost = createWidgetFn();
            galleryGhost.id = 'gallery-drag-ghost';
            galleryGhost.style.position = 'fixed';
            galleryGhost.style.margin = '0';
            galleryGhost.style.zIndex = '9999';
            galleryGhost.style.opacity = '0.9';
            galleryGhost.style.pointerEvents = 'none';
            galleryGhost.style.transform = 'scale(1.05)';
            galleryGhost.style.transition = 'none';

            const className = galleryGhost.className;
            const meta = getWidgetMetaByClassName(widgetClassKey) || getWidgetMetaByClassName(className);
            if (meta?.ghostWidth) galleryGhost.style.width = meta.ghostWidth;
            if (meta?.ghostHeight) galleryGhost.style.height = meta.ghostHeight;

            offsetX = offsetW;
            offsetY = offsetH;

            galleryGhost.style.left = (e.clientX - offsetX) + 'px';
            galleryGhost.style.top = (e.clientY - offsetY) + 'px';

            document.body.appendChild(galleryGhost);

            if (window.closeView) window.closeView(gallerySheet);
            if (window.enterJiggleMode && !window.isJiggleMode) {
                window.enterJiggleMode();
            }
        }

        function endGalleryDrag(e) {
            if (!isDraggingFromGallery) return;
            isDraggingFromGallery = false;

            if (galleryGhost) {
                galleryGhost.remove();
                galleryGhost = null;
            }

            const targetInfo = getGridSlotByMouse(e.clientX, e.clientY);
            
            if (targetInfo && targetInfo.grid) {
                const targetEl = targetInfo.element;
                const widget = createWidgetFn();
                const resolvedSlotsNeeded = getWidgetSlotsByClassName(widget.className, getWidgetSlotsByClassName(widgetClassKey, 1));
                
                const empties = targetInfo.grid.querySelectorAll('.empty-slot');
                if (empties.length >= resolvedSlotsNeeded) {
                    consumeGridEmptySlots(targetInfo.grid, resolvedSlotsNeeded);

                    if (!targetEl) {
                        // Drop in empty area, find first available empty slot to insert before
                        const firstEmpty = targetInfo.grid.querySelector('.empty-slot');
                        if (firstEmpty) {
                            targetInfo.grid.insertBefore(widget, firstEmpty);
                        } else {
                            targetInfo.grid.appendChild(widget);
                        }
                    } else if (targetEl.classList.contains('empty-slot')) {
                        targetEl.parentNode.insertBefore(widget, targetEl);
                        targetEl.remove();
                    } else {
                        if (targetInfo.isLeft) {
                            targetEl.parentNode.insertBefore(widget, targetEl);
                        } else {
                            targetEl.parentNode.insertBefore(widget, targetEl.nextSibling);
                        }
                    }
                } else {
                    if (window.showToast) window.showToast('放置位置空间不足');
                }
                
                if (window.balanceGridSlots) window.balanceGridSlots();
                if (window.saveDesktopState) window.saveDesktopState();
            }
        }
    }

    setupGalleryDrag(insPreviewBtn, createInsProfileWidget, 'ins-profile-widget', 160, 120);
    setupGalleryDrag(spotifyPreviewBtn, createSpotifyWidget, 'spotify-widget', 160, 160);
    setupGalleryDrag(petPreviewBtn, createPetWidget, 'pet-widget', 75, 75);
    setupGalleryDrag(couplePreviewBtn, createCoupleWidget, 'couple-widget', 75, 75);
    setupGalleryDrag(statusCardPreviewBtn, createStatusCardWidget, 'status-card-widget', 160, 75);
    setupGalleryDrag(complexMusicPreviewBtn, createComplexMusicWidget, 'complex-music-widget', 160, 120);
    setupGalleryDrag(customMusicPreviewBtn, createCustomMusicWidget, 'custom-music-widget', 160, 75);

    function sanitizeDesktopStateMarkup(markup) {
        if (!markup || typeof markup !== 'string') return '';
        const temp = document.createElement('div');
        temp.innerHTML = markup;
        temp.querySelectorAll('.diary-widget').forEach(el => el.remove());
        return temp.innerHTML;
    }

    // ==========================================
    // DATA PERSISTENCE FOR WIDGETS
    // ==========================================
    window.saveDesktopState = function() {
        const pagesContainer = document.getElementById('pages-container');
        if (!pagesContainer) return;
        
        // Temporarily remove jiggle mode classes if present to save clean state
        const wasJiggling = window.isJiggleMode;
        if (wasJiggling) {
            document.body.classList.remove('jiggle-mode');
            const plusBtn = document.querySelector('.jiggle-plus-btn');
            if (plusBtn) plusBtn.style.display = 'none';
        }

        const state = {
            grid1: sanitizeDesktopStateMarkup(document.getElementById('main-grid-1').innerHTML),
            grid2: sanitizeDesktopStateMarkup(document.getElementById('main-grid-2').innerHTML),
            grid3: sanitizeDesktopStateMarkup(document.getElementById('main-grid-3').innerHTML)
        };

        window.__desktopGlobalState = state;
        if (typeof window.setAppState === 'function') {
            window.setAppState('desktop', state);
        } else if (window.saveGlobalData) {
            window.saveGlobalData();
        }

        // Restore jiggle mode if it was active
        if (wasJiggling) {
            document.body.classList.add('jiggle-mode');
            const plusBtn = document.querySelector('.jiggle-plus-btn');
            if (plusBtn) plusBtn.style.display = 'flex';
        }
    };

    window.loadDesktopState = function() {
        const state = typeof window.getAppState === 'function'
            ? window.getAppState('desktop')
            : window.__desktopGlobalState;
        window.__desktopGlobalState = state && typeof state === 'object' ? state : null;

        if (state && typeof state === 'object') {
            try {
                const grid1 = document.getElementById('main-grid-1');
                const grid2 = document.getElementById('main-grid-2');
                const grid3 = document.getElementById('main-grid-3');
                
                if (grid1 && state.grid1) grid1.innerHTML = sanitizeDesktopStateMarkup(state.grid1);
                if (grid2 && state.grid2) grid2.innerHTML = sanitizeDesktopStateMarkup(state.grid2);
                if (grid3 && state.grid3) grid3.innerHTML = sanitizeDesktopStateMarkup(state.grid3);
                
                // Re-bind events to loaded elements
                const allWidgets = document.querySelectorAll('.ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .custom-music-widget');
                allWidgets.forEach(widget => {
                    const className = widget.className;
                    if (className.includes('ins-profile-widget')) bindInsProfileWidget(widget);
                    else if (className.includes('spotify-widget')) bindSpotifyWidget(widget);
                    else if (className.includes('pet-widget')) bindPetWidget(widget);
                    else if (className.includes('couple-widget')) bindCoupleWidget(widget);
                    else if (className.includes('status-card-widget')) bindStatusCardWidget(widget);
                    else if (className.includes('complex-music-widget')) bindComplexMusicWidget(widget);
                    else if (className.includes('photo-profile-widget')) bindPhotoProfileWidget(widget);
                    else if (className.includes('custom-music-widget')) bindCustomMusicWidget(widget);
                });

                if (window.refreshDraggables) window.refreshDraggables();
                
            } catch(e) {
                console.error("Failed to load desktop state", e);
                // Fallback to binding default widgets if load fails
                bindInitialWidgets();
            }
        } else {
            bindInitialWidgets();
        }
    };

    function bindInitialWidgets() {
        // Initialize default desktop widgets if no saved state
        const defaultIns = document.getElementById('ins-profile-widget');
        if (defaultIns) bindInsProfileWidget(defaultIns);
        
        const defaultSpotify = document.getElementById('spotify-widget-desktop');
        if (defaultSpotify) bindSpotifyWidget(defaultSpotify);
        
        const defaultPet = document.getElementById('pet-widget-desktop');
        if (defaultPet) bindPetWidget(defaultPet);
        
        const defaultStatusCard = document.getElementById('status-card-desktop');
        if (defaultStatusCard) bindStatusCardWidget(defaultStatusCard);

        const defaultStatusCard2 = document.getElementById('status-card-desktop-2');
        if (defaultStatusCard2) bindStatusCardWidget(defaultStatusCard2);

        const defaultCouple = document.getElementById('couple-widget-desktop-2');
        if (defaultCouple) bindCoupleWidget(defaultCouple);

        const defaultCustomMusic = document.getElementById('custom-music-widget-desktop-2');
        if (defaultCustomMusic) bindCustomMusicWidget(defaultCustomMusic);
    }

    // Call load on script execute
    window.loadDesktopState();
});
