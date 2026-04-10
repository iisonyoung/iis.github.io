(function() {
    function initAo3App() {
        if (window.ao3App && window.ao3App.initialized) return;

        const ao3View = document.getElementById('ao3-view');
        const closeBtn = document.getElementById('ao3-close-btn');
        const appIcon = document.getElementById('app-icon-7');
        const tabs = Array.from(document.querySelectorAll('.ao3-tab'));
        const panels = Array.from(document.querySelectorAll('.ao3-panel'));
        const indicator = document.getElementById('ao3-tab-indicator');

        const categoryList = document.getElementById('ao3-category-list');
        const categoryAddBtn = document.getElementById('ao3-category-add');
        const profilePanelRoot = ao3View?.querySelector('.ao3-panel[data-panel="profile"]');
        const profileTabs = Array.from(profilePanelRoot?.querySelectorAll('.ao3-profile-tab') || []);
        const profilePanels = Array.from(profilePanelRoot?.querySelectorAll('.ao3-profile-panel') || []);
        const profileIndicator = profilePanelRoot?.querySelector('#ao3-profile-tab-indicator');
        const authorProfileTabsRoot = document.getElementById('ao3-author-profile-tabs');
        const authorProfileTabs = Array.from(authorProfileTabsRoot?.querySelectorAll('.ao3-profile-tab') || []);
        const authorProfilePanels = Array.from(document.querySelectorAll('[data-author-profile-panel]'));
        const authorProfileIndicator = document.getElementById('ao3-author-profile-tab-indicator');

        const categoryModal = document.getElementById('ao3-category-modal');
        const categoryModalClose = document.getElementById('ao3-category-modal-close');
        const categoryInput = document.getElementById('ao3-category-input');
        const categoryCreateBtn = document.getElementById('ao3-category-create-btn');

        const demoBookCard = document.getElementById('ao3-demo-book-card');
        const bookDetailModal = document.getElementById('ao3-book-detail-modal');
        const bookDetailClose = document.getElementById('ao3-book-detail-close');
        const authorHomeBtn = document.getElementById('ao3-author-home-btn');
        const startReadingBtn = document.getElementById('ao3-start-reading-btn');
        const authorView = document.getElementById('ao3-author-view');
        const prefaceView = document.getElementById('ao3-preface-view');
        const readerView = document.getElementById('ao3-reader-view');
        const authorBackBtn = document.getElementById('ao3-author-back-btn');
        const prefaceBackBtn = document.getElementById('ao3-preface-back-btn');
        const readerBackBtn = document.getElementById('ao3-reader-back-btn');
        const enterChapterBtn = document.getElementById('ao3-enter-chapter-btn');
        const readerMenuBtn = document.getElementById('ao3-reader-menu-btn');
        const readerDrawer = document.getElementById('ao3-reader-drawer');
        const followStrip = document.getElementById('ao3-follow-strip');
        const followStripEmpty = document.getElementById('ao3-follow-strip-empty');
        const importedBooksGrid = document.getElementById('ao3-imported-books-grid');
        const importedBooksEmpty = document.getElementById('ao3-imported-books-empty');
        const shelfImportBtn = document.getElementById('ao3-shelf-import-btn');
        const shelfImportInput = document.getElementById('ao3-shelf-import-input');
        const authorFollowBtn = document.getElementById('ao3-author-follow-btn');
        const authorSubscribeBtn = document.getElementById('ao3-author-subscribe-btn');

        if (!ao3View || !appIcon || tabs.length === 0 || !indicator) return;

        let categories = [
            { id: 'hot', name: '最热', fixed: true },
            { id: 'new', name: '最新', fixed: true }
        ];
        let activeCategoryId = 'hot';
        const currentAuthor = {
            id: 'nanci77',
            name: 'nanci77',
            handle: '@ao3_author',
            iconClass: 'fas fa-user'
        };
        let followedAuthorIds = [];
        let subscribedAuthorIds = [];
        let importedBooks = [];

        const openAo3 = () => {
            if (window.isJiggleMode || window.preventAppClick) return;
            if (window.syncUIs) window.syncUIs();
            ao3View.classList.remove('closing');
            ao3View.classList.remove('active');
            requestAnimationFrame(() => {
                ao3View.classList.add('active');
                updateIndicator(ao3View.querySelector('.ao3-tab.active'));
                updateProfileIndicator(profilePanelRoot?.querySelector('.ao3-profile-tab.active'));
            });
        };

        const closeSubview = (view) => {
            if (!view) return;
            view.classList.remove('active');
        };

        const openSubview = (view) => {
            if (!view) return;
            [authorView, prefaceView, readerView].forEach(item => {
                if (item !== view) item?.classList.remove('active');
            });
            view.classList.add('active');
        };

        const closeAo3 = () => {
            if (!ao3View.classList.contains('active') || ao3View.classList.contains('closing')) return;
            closeAllModals();
            [authorView, prefaceView, readerView].forEach(closeSubview);
            readerDrawer?.classList.remove('active');
            ao3View.classList.add('closing');
            window.setTimeout(() => {
                ao3View.classList.remove('active');
                ao3View.classList.remove('closing');
            }, 220);
        };

        const updateIndicator = (tab) => {
            if (!tab || !indicator) return;
            const tabsBox = tab.parentElement.getBoundingClientRect();
            const tabBox = tab.getBoundingClientRect();
            const x = tabBox.left - tabsBox.left;
            indicator.style.width = `${tabBox.width}px`;
            indicator.style.transform = `translateX(${x}px)`;
        };

        const updateProfileIndicator = (tab) => {
            if (!tab || !profileIndicator) return;
            const tabsBox = tab.parentElement.getBoundingClientRect();
            const tabBox = tab.getBoundingClientRect();
            const x = tabBox.left - tabsBox.left;
            profileIndicator.style.width = `${tabBox.width}px`;
            profileIndicator.style.transform = `translateX(${x}px)`;
        };

        const updateAuthorProfileIndicator = (tab) => {
            if (!tab || !authorProfileIndicator) return;
            const tabsBox = tab.parentElement.getBoundingClientRect();
            const tabBox = tab.getBoundingClientRect();
            const x = tabBox.left - tabsBox.left;
            authorProfileIndicator.style.width = `${tabBox.width}px`;
            authorProfileIndicator.style.transform = `translateX(${x}px)`;
        };

        const switchTab = (nextTab) => {
            const target = nextTab.dataset.tab;
            tabs.forEach(tab => tab.classList.toggle('active', tab === nextTab));
            panels.forEach(panel => {
                panel.classList.toggle('active', panel.dataset.panel === target);
            });
            updateIndicator(nextTab);
        };

        const switchProfileTab = (nextTab) => {
            const target = nextTab.dataset.profileTab;
            profileTabs.forEach(tab => tab.classList.toggle('active', tab === nextTab));
            profilePanels.forEach(panel => {
                panel.classList.toggle('active', panel.dataset.profilePanel === target);
            });
            updateProfileIndicator(nextTab);
        };

        const switchAuthorProfileTab = (nextTab) => {
            const target = nextTab.dataset.authorProfileTab;
            authorProfileTabs.forEach(tab => tab.classList.toggle('active', tab === nextTab));
            authorProfilePanels.forEach(panel => {
                panel.classList.toggle('active', panel.dataset.authorProfilePanel === target);
            });
            updateAuthorProfileIndicator(nextTab);
        };

        const renderCategories = () => {
            if (!categoryList) return;

            categoryList.innerHTML = '';
            categories.forEach(category => {
                const chip = document.createElement('button');
                chip.className = `ao3-category-chip${category.id === activeCategoryId ? ' active' : ''}`;
                chip.type = 'button';
                chip.dataset.id = category.id;

                if (category.fixed) {
                    chip.textContent = category.name;
                } else {
                    const text = document.createElement('span');
                    text.textContent = category.name;

                    const delBtn = document.createElement('button');
                    delBtn.className = 'ao3-category-chip-delete';
                    delBtn.type = 'button';
                    delBtn.setAttribute('aria-label', `Delete ${category.name}`);
                    delBtn.innerHTML = '<i class="fas fa-times"></i>';

                    delBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        categories = categories.filter(item => item.id !== category.id);
                        if (activeCategoryId === category.id) {
                            activeCategoryId = 'hot';
                        }
                        renderCategories();
                    });

                    chip.appendChild(text);
                    chip.appendChild(delBtn);
                }

                chip.addEventListener('click', () => {
                    activeCategoryId = category.id;
                    renderCategories();
                });

                categoryList.appendChild(chip);
            });
        };

        const renderFollowStrip = () => {
            if (!followStrip || !followStripEmpty) return;

            followStrip.innerHTML = '';
            const followedAuthors = followedAuthorIds.includes(currentAuthor.id) ? [currentAuthor] : [];

            followStripEmpty.style.display = followedAuthors.length === 0 ? 'block' : 'none';
            followStrip.style.display = followedAuthors.length === 0 ? 'none' : 'flex';

            followedAuthors.forEach(author => {
                const card = document.createElement('button');
                card.className = 'ao3-follow-author-card';
                card.type = 'button';
                card.setAttribute('aria-label', `打开 ${author.name} 的作者主页`);
                card.innerHTML = `
                <span class="ao3-follow-author-avatar" aria-hidden="true">
                    <i class="${author.iconClass}"></i>
                </span>
                <span class="ao3-follow-author-name">${author.name}</span>
            `;

                card.addEventListener('click', () => {
                    openSubview(authorView);
                    updateAuthorProfileIndicator(authorProfileTabsRoot?.querySelector('.ao3-profile-tab.active'));
                });

                followStrip.appendChild(card);
            });
        };

        const renderImportedBooks = () => {
            if (!importedBooksGrid || !importedBooksEmpty) return;

            importedBooksGrid.innerHTML = '';
            const hasBooks = importedBooks.length > 0;
            importedBooksGrid.style.display = hasBooks ? 'grid' : 'none';
            importedBooksEmpty.style.display = hasBooks ? 'none' : 'block';

            importedBooks.forEach(book => {
                const card = document.createElement('button');
                card.className = 'ao3-imported-book-card';
                card.type = 'button';

                const cover = document.createElement('div');
                cover.className = `ao3-imported-book-cover${book.cover ? ' has-image' : ''}`;
                if (book.cover) {
                    cover.style.backgroundImage = `url("${book.cover}")`;
                }

                const inner = document.createElement('div');
                inner.className = 'ao3-imported-book-cover-inner';
                inner.innerHTML = book.cover ? '' : '<i class="fas fa-book"></i>';

                const title = document.createElement('div');
                title.className = 'ao3-imported-book-title';
                title.textContent = book.title;

                cover.appendChild(inner);
                card.appendChild(cover);
                card.appendChild(title);
                importedBooksGrid.appendChild(card);
            });
        };

        const syncAuthorActionButtons = () => {
            if (authorFollowBtn) {
                const followed = followedAuthorIds.includes(currentAuthor.id);
                authorFollowBtn.textContent = followed ? '已关注' : '关注';
                authorFollowBtn.classList.toggle('is-active', followed);
            }

            if (authorSubscribeBtn) {
                const subscribed = subscribedAuthorIds.includes(currentAuthor.id);
                authorSubscribeBtn.textContent = subscribed ? '已订阅' : '订阅';
                authorSubscribeBtn.classList.toggle('is-active', subscribed);
            }
        };

        const openModal = (modal) => {
            if (!modal) return;
            modal.classList.add('active');
        };

        const closeModal = (modal) => {
            if (!modal) return;
            modal.classList.remove('active');
        };

        const closeAllModals = () => {
            [categoryModal, bookDetailModal].forEach(closeModal);
        };

        const createCategory = () => {
            const value = (categoryInput?.value || '').trim();
            if (!value) return;

            const id = `custom-${Date.now()}`;
            categories.push({ id, name: value, fixed: false });
            activeCategoryId = id;
            renderCategories();

            if (categoryInput) categoryInput.value = '';
            closeModal(categoryModal);
        };

        appIcon.closest('.app-item')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openAo3();
        });

        closeBtn?.addEventListener('click', closeAo3);

        tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab));
        });

        profileTabs.forEach(tab => {
            tab.addEventListener('click', () => switchProfileTab(tab));
        });

        authorProfileTabs.forEach(tab => {
            tab.addEventListener('click', () => switchAuthorProfileTab(tab));
        });

        categoryAddBtn?.addEventListener('click', () => openModal(categoryModal));
        categoryModalClose?.addEventListener('click', () => closeModal(categoryModal));
        categoryCreateBtn?.addEventListener('click', createCategory);

        categoryInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                createCategory();
            }
        });

        demoBookCard?.addEventListener('click', () => openModal(bookDetailModal));
        bookDetailClose?.addEventListener('click', () => closeModal(bookDetailModal));

        authorHomeBtn?.addEventListener('click', () => {
            closeModal(bookDetailModal);
            openSubview(authorView);
        });

        authorFollowBtn?.addEventListener('click', () => {
            if (followedAuthorIds.includes(currentAuthor.id)) {
                followedAuthorIds = followedAuthorIds.filter(id => id !== currentAuthor.id);
            } else {
                followedAuthorIds = [...followedAuthorIds, currentAuthor.id];
            }
            syncAuthorActionButtons();
            renderFollowStrip();
        });

        authorSubscribeBtn?.addEventListener('click', () => {
            if (subscribedAuthorIds.includes(currentAuthor.id)) {
                subscribedAuthorIds = subscribedAuthorIds.filter(id => id !== currentAuthor.id);
            } else {
                subscribedAuthorIds = [...subscribedAuthorIds, currentAuthor.id];
            }
            syncAuthorActionButtons();
        });

        shelfImportBtn?.addEventListener('click', () => {
            shelfImportInput?.click();
        });

        shelfImportInput?.addEventListener('change', async () => {
            const file = shelfImportInput.files?.[0];
            if (!file) return;

            const fileName = file.name.replace(/\.[^.]+$/, '') || '未命名作品';
            importedBooks = [
                {
                    id: `book-${Date.now()}`,
                    title: fileName,
                    cover: null,
                    type: 'txt'
                },
                ...importedBooks
            ];
            renderImportedBooks();
            shelfImportInput.value = '';
        });

        startReadingBtn?.addEventListener('click', () => {
            closeModal(bookDetailModal);
            openSubview(prefaceView);
        });

        authorBackBtn?.addEventListener('click', () => closeSubview(authorView));
        prefaceBackBtn?.addEventListener('click', () => closeSubview(prefaceView));

        enterChapterBtn?.addEventListener('click', () => {
            closeSubview(prefaceView);
            openSubview(readerView);
        });

        readerBackBtn?.addEventListener('click', () => {
            readerDrawer?.classList.remove('active');
            closeSubview(readerView);
            openSubview(prefaceView);
        });

        readerMenuBtn?.addEventListener('click', () => {
            readerDrawer?.classList.toggle('active');
        });

        readerDrawer?.addEventListener('click', (e) => {
            if (e.target === readerDrawer) {
                readerDrawer.classList.remove('active');
            }
        });

        [categoryModal, bookDetailModal].forEach(modal => {
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });

        window.addEventListener('resize', () => {
            updateIndicator(ao3View.querySelector('.ao3-tab.active'));
            updateProfileIndicator(profilePanelRoot?.querySelector('.ao3-profile-tab.active'));
            updateAuthorProfileIndicator(authorProfileTabsRoot?.querySelector('.ao3-profile-tab.active'));
        });

        renderCategories();
        renderFollowStrip();
        renderImportedBooks();
        syncAuthorActionButtons();
        updateIndicator(ao3View.querySelector('.ao3-tab.active'));
        updateProfileIndicator(profilePanelRoot?.querySelector('.ao3-profile-tab.active'));
        updateAuthorProfileIndicator(authorProfileTabsRoot?.querySelector('.ao3-profile-tab.active'));

        window.ao3App = Object.assign(window.ao3App || {}, {
            initialized: true,
            init: initAo3App,
            open: openAo3,
            close: closeAo3
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAo3App, { once: true });
    } else {
        initAo3App();
    }
})();
