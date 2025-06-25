class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.categories = this.loadCategories();
        this.completedTasks = this.loadCompletedTasks();
        this.currentCategory = 'all';
        this.showCompletedTasks = true;
        this.isDarkMode = this.loadTheme();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCategoryNav();
        this.updateCategorySelect();
        this.renderTasks();
        this.renderCompletedTasks();
        this.cleanOldCompletedTasks();
        this.applyTheme();
    }

    bindEvents() {
        // New ボタン
        document.getElementById('newBtn').addEventListener('click', () => {
            this.showModal();
        });

        // モーダル関連
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.hideModal();
            }
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // プロセス追加ボタン
        document.getElementById('addProcessBtn').addEventListener('click', () => {
            this.addProcessInput();
        });

        // カテゴリタブ
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchCategory(e.target.dataset.category);
            });
        });

        // モーダルタブ
        document.getElementById('taskTab').addEventListener('click', () => {
            this.showTaskSection();
        });

        document.getElementById('categoryTab').addEventListener('click', () => {
            this.showCategorySection();
        });

        // カテゴリ管理
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.addCategory();
        });

        document.getElementById('categoryCloseBtn').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('newCategoryInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCategory();
            }
        });

        // 編集モーダル関連
        document.getElementById('editModalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'editModalOverlay') {
                this.hideEditModal();
            }
        });

        document.getElementById('editCancelBtn').addEventListener('click', () => {
            this.hideEditModal();
        });

        document.getElementById('editTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTask();
        });

        document.getElementById('addEditProcessBtn').addEventListener('click', () => {
            this.addEditProcessInput();
        });

        document.getElementById('deleteTaskBtn').addEventListener('click', () => {
            this.deleteTaskFromEdit();
        });

        // テーマ切り替えボタン
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    showModal() {
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById('taskTitle').focus();
    }

    hideModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        this.resetForm();
        this.showTaskSection(); // デフォルトでタスク追加セクションに戻す
    }

    showTaskSection() {
        document.getElementById('taskTab').classList.add('active');
        document.getElementById('categoryTab').classList.remove('active');
        document.getElementById('taskSection').style.display = 'block';
        document.getElementById('categorySection').style.display = 'none';
    }

    showCategorySection() {
        document.getElementById('taskTab').classList.remove('active');
        document.getElementById('categoryTab').classList.add('active');
        document.getElementById('taskSection').style.display = 'none';
        document.getElementById('categorySection').style.display = 'block';
        this.renderCategories();
        this.updateCategorySelect();
    }

    resetForm() {
        document.getElementById('taskForm').reset();
        // プロセス入力をリセット
        const container = document.getElementById('processContainer');
        container.innerHTML = `
            <div class="process-input">
                <input type="text" placeholder="Process 1" required>
            </div>
        `;
    }

    addProcessInput() {
        const container = document.getElementById('processContainer');
        const processCount = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'process-input';
        div.innerHTML = `
            <input type="text" placeholder="Process ${processCount}" required>
            <button type="button" class="delete-btn" onclick="this.parentElement.remove()">削除</button>
        `;
        container.appendChild(div);
    }

    addTask() {
        const title = document.getElementById('taskTitle').value;
        const limit = document.getElementById('taskLimit').value;
        const category = document.getElementById('taskCategory').value;
        
        // プロセスを取得
        const processInputs = document.querySelectorAll('#processContainer input');
        const processes = Array.from(processInputs).map(input => ({
            name: input.value,
            completed: false
        }));

        const task = {
            id: Date.now().toString(),
            title,
            limit,
            category,
            processes,
            order: this.tasks.length,
            completed: false
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.hideModal();
    }

    deleteTask(taskId) {
        if (confirm('このタスクを削除しますか？')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
        }
    }

    toggleProcess(taskId, processIndex) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const wasTaskCompleted = task.completed;
            task.processes[processIndex].completed = !task.processes[processIndex].completed;
            
            // すべてのプロセスが完了しているかチェック
            const allProcessesCompleted = task.processes.every(process => process.completed);
            const anyProcessCompleted = task.processes.some(process => process.completed);
            
            // すべてのプロセスが完了していればタスクも完了、一つでも未完了があればタスクも未完了
            if (allProcessesCompleted && !wasTaskCompleted) {
                task.completed = true;
                
                // タスクが自動完了した場合もお祝い
                this.celebrateTaskCompletion(taskId);
                
                // 完了タスクに追加
                const completedTask = {
                    ...task,
                    completedAt: new Date().toISOString()
                };
                this.completedTasks.push(completedTask);
                this.saveCompletedTasks();
                
                // 2秒後にタスクを削除
                setTimeout(() => {
                    this.removeTaskWithAnimation(taskId);
                }, 2000);
            } else if (!anyProcessCompleted) {
                task.completed = false;
            }
            
            this.saveTasks();
            this.renderTasks();
            this.renderCompletedTasks();
        }
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const wasCompleted = task.completed;
            task.completed = !task.completed;
            
            if (task.completed && !wasCompleted) {
                // タスクが完了した場合
                this.celebrateTaskCompletion(taskId);
                
                // 完了タスクに追加
                const completedTask = {
                    ...task,
                    completedAt: new Date().toISOString()
                };
                this.completedTasks.push(completedTask);
                this.saveCompletedTasks();
                
                // 2秒後にタスクを削除
                setTimeout(() => {
                    this.removeTaskWithAnimation(taskId);
                }, 2000);
            }
            
            this.saveTasks();
            this.renderTasks();
        }
    }

    moveTask(taskId, direction) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const newIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
        if (newIndex < 0 || newIndex >= this.tasks.length) return;

        // タスクの位置を交換
        [this.tasks[taskIndex], this.tasks[newIndex]] = [this.tasks[newIndex], this.tasks[taskIndex]];
        
        this.saveTasks();
        this.renderTasks();
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        // アクティブタブを更新
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        this.renderTasks();
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.currentCategory === 'all' 
            ? this.tasks 
            : this.tasks.filter(task => task.category === this.currentCategory);

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.7); font-size: 18px;">
                    ${this.currentCategory === 'all' ? 'まだタスクがありません。' : 'このカテゴリにはタスクがありません。'}
                    <br>「+ New」ボタンでタスクを追加しましょう！
                </div>
            `;
            return;
        }

        taskList.innerHTML = filteredTasks.map((task, index) => {
            const completedCount = task.processes.filter(p => p.completed).length;
            const totalCount = task.processes.length;
            
            // 期限の表示形式を調整
            const limitDate = new Date(task.limit);
            const limitDisplay = `${limitDate.getMonth() + 1}/${limitDate.getDate()}`;

            return `
                <div class="task-item" draggable="true" data-task-id="${task.id}">
                    <div class="task-number ${task.completed ? 'completed' : ''}" onclick="app.toggleTaskCompletion('${task.id}')">${task.completed ? '' : index + 1}</div>
                    <div class="task-content">
                        <div class="task-title">${task.title} -${limitDisplay}</div>
                        <div class="task-processes">
                            ${task.processes.map((process, pIndex) => `
                                <div class="process">
                                    <div class="process-circle ${process.completed ? 'completed' : ''}" 
                                         onclick="app.toggleProcess('${task.id}', ${pIndex})"></div>
                                    <span>${process.name}</span>
                                </div>
                                ${pIndex < task.processes.length - 1 ? '<div class="process-line"></div>' : ''}
                            `).join('')}
                        </div>
                    </div>
                    <div class="task-edit" onclick="app.editTask('${task.id}')">
                        <span class="material-symbols-outlined">edit</span>
                    </div>
                </div>
            `;
        }).join('');

        // ドラッグ&ドロップのイベントを追加
        this.addDragAndDropEvents();
    }

    addDragAndDropEvents() {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
                e.target.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.target.closest('.task-item').classList.add('drag-over');
            });

            item.addEventListener('dragleave', (e) => {
                e.target.closest('.task-item').classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                const dropTargetId = e.target.closest('.task-item').dataset.taskId;
                
                e.target.closest('.task-item').classList.remove('drag-over');
                
                if (draggedId !== dropTargetId) {
                    this.reorderTasks(draggedId, dropTargetId);
                }
            });
        });
    }

    reorderTasks(draggedId, dropTargetId) {
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
        const dropTargetIndex = this.tasks.findIndex(t => t.id === dropTargetId);
        
        if (draggedIndex === -1 || dropTargetIndex === -1) return;

        // タスクを移動
        const [draggedTask] = this.tasks.splice(draggedIndex, 1);
        this.tasks.splice(dropTargetIndex, 0, draggedTask);
        
        this.saveTasks();
        this.renderTasks();
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // 編集モーダルのフィールドに現在の値を設定
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskLimit').value = task.limit;
        document.getElementById('editTaskCategory').value = task.category;
        
        // プロセスを設定
        const editProcessContainer = document.getElementById('editProcessContainer');
        editProcessContainer.innerHTML = task.processes.map((process, index) => `
            <div class="process-input">
                <input type="text" value="${process.name}" required>
                <button type="button" class="delete-btn" onclick="this.parentElement.remove()">削除</button>
            </div>
        `).join('');

        // 編集中のタスクIDを保存
        this.editingTaskId = taskId;
        
        // 編集モーダルを表示
        this.showEditModal();
    }

    showEditModal() {
        document.getElementById('editModalOverlay').classList.add('active');
        document.getElementById('editTaskTitle').focus();
    }

    hideEditModal() {
        document.getElementById('editModalOverlay').classList.remove('active');
        this.editingTaskId = null;
    }

    updateTask() {
        if (!this.editingTaskId) return;

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (!task) return;

        const title = document.getElementById('editTaskTitle').value;
        const limit = document.getElementById('editTaskLimit').value;
        const category = document.getElementById('editTaskCategory').value;
        
        // プロセスを取得
        const processInputs = document.querySelectorAll('#editProcessContainer input');
        const newProcesses = Array.from(processInputs).map((input, index) => ({
            name: input.value,
            completed: task.processes[index] ? task.processes[index].completed : false
        }));

        // タスクを更新
        task.title = title;
        task.limit = limit;
        task.category = category;
        task.processes = newProcesses;

        this.saveTasks();
        this.renderTasks();
        this.hideEditModal();
    }

    addEditProcessInput() {
        const container = document.getElementById('editProcessContainer');
        const processCount = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'process-input';
        div.innerHTML = `
            <input type="text" placeholder="Process ${processCount}" required>
            <button type="button" class="delete-btn" onclick="this.parentElement.remove()">削除</button>
        `;
        container.appendChild(div);
    }

    deleteTaskFromEdit() {
        if (!this.editingTaskId) return;
        
        if (confirm('このタスクを削除しますか？')) {
            this.tasks = this.tasks.filter(task => task.id !== this.editingTaskId);
            this.saveTasks();
            this.renderTasks();
            this.hideEditModal();
        }
    }

    loadTasks() {
        const saved = localStorage.getItem('yamaToDoTasks');
        return saved ? JSON.parse(saved) : [];
    }

    saveTasks() {
        localStorage.setItem('yamaToDoTasks', JSON.stringify(this.tasks));
    }

    loadCategories() {
        const saved = localStorage.getItem('yamaToDoCategories');
        return saved ? JSON.parse(saved) : ['Work', 'School', 'Personal'];
    }

    saveCategories() {
        localStorage.setItem('yamaToDoCategories', JSON.stringify(this.categories));
    }

    addCategory() {
        const input = document.getElementById('newCategoryInput');
        const categoryName = input.value.trim();
        
        if (categoryName && !this.categories.includes(categoryName)) {
            this.categories.push(categoryName);
            this.saveCategories();
            this.renderCategories();
            this.updateCategorySelect();
            this.updateCategoryNav();
            input.value = '';
        } else if (this.categories.includes(categoryName)) {
            alert('このカテゴリは既に存在します。');
        }
    }

    editCategory(categoryName) {
        const categoryItem = document.getElementById(`category-${categoryName}`);
        const nameSpan = categoryItem.querySelector('.category-name');
        const buttonsDiv = categoryItem.querySelector('.category-buttons');
        
        const currentName = nameSpan.textContent;
        
        nameSpan.innerHTML = `<input type="text" class="category-name-input" value="${currentName}">`;
        buttonsDiv.innerHTML = `
            <button class="save-btn" onclick="app.saveCategoryEdit('${categoryName}')">保存</button>
            <button class="cancel-btn" onclick="app.cancelCategoryEdit('${categoryName}')">キャンセル</button>
        `;
        
        const input = categoryItem.querySelector('.category-name-input');
        input.focus();
        input.select();
    }

    saveCategoryEdit(oldCategoryName) {
        const categoryItem = document.getElementById(`category-${oldCategoryName}`);
        const input = categoryItem.querySelector('.category-name-input');
        const newCategoryName = input.value.trim();
        
        if (newCategoryName && newCategoryName !== oldCategoryName && !this.categories.includes(newCategoryName)) {
            // カテゴリ名を更新
            const categoryIndex = this.categories.indexOf(oldCategoryName);
            if (categoryIndex !== -1) {
                this.categories[categoryIndex] = newCategoryName;
            }
            
            // 該当するタスクのカテゴリ名も更新
            this.tasks.forEach(task => {
                if (task.category === oldCategoryName) {
                    task.category = newCategoryName;
                }
            });
            
            this.saveCategories();
            this.saveTasks();
            this.renderCategories();
            this.updateCategorySelect();
            this.updateCategoryNav();
        } else if (this.categories.includes(newCategoryName)) {
            alert('このカテゴリ名は既に使用されています。');
            this.cancelCategoryEdit(oldCategoryName);
        } else {
            this.cancelCategoryEdit(oldCategoryName);
        }
    }

    cancelCategoryEdit(categoryName) {
        this.renderCategories();
    }

    deleteCategory(categoryName) {
        if (confirm(`カテゴリ「${categoryName}」を削除しますか？\nこのカテゴリのタスクは「Work」カテゴリに移動されます。`)) {
            this.categories = this.categories.filter(cat => cat !== categoryName);
            // このカテゴリのタスクをWorkカテゴリに移動
            this.tasks.forEach(task => {
                if (task.category === categoryName) {
                    task.category = 'Work';
                }
            });
            this.saveCategories();
            this.saveTasks();
            this.renderCategories();
            this.updateCategorySelect();
            this.updateCategoryNav();
        }
    }

    renderCategories() {
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = this.categories.map(category => `
            <div class="category-item" id="category-${category}">
                <span class="category-name">${category}</span>
                <div class="category-buttons">
                    <button class="edit-btn" onclick="app.editCategory('${category}')">編集</button>
                    <button class="delete-btn" onclick="app.deleteCategory('${category}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    updateCategorySelect() {
        const select = document.getElementById('taskCategory');
        const editSelect = document.getElementById('editTaskCategory');
        
        const optionsHtml = `
            ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        `;
        
        if (select) {
            select.innerHTML = optionsHtml;
        }
        
        if (editSelect) {
            editSelect.innerHTML = optionsHtml;
        }
    }

    updateCategoryNav() {
        const categoryNav = document.querySelector('.category-nav');
        categoryNav.innerHTML = `
            <button class="category-tab ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all">ALL</button>
            ${this.categories.map(cat => 
                `<button class="category-tab ${this.currentCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`
            ).join('')}
        `;
        
        // イベントリスナーを再バインド
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchCategory(e.target.dataset.category);
            });
        });
    }

    celebrateTaskCompletion(taskId) {
        // 背景オーバーレイを作成
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';
        document.body.appendChild(overlay);
        
        // お祝いメッセージを表示
        const messages = [
            "🎉 よく頑張った！",
            "🌟 日々進んでるよ！", 
            "✨ お疲れさま！",
            "🎊 素晴らしい！",
            "💪 やったね！",
            "🎯 完璧だ！"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'celebration-message';
        messageDiv.innerHTML = `<span style="position: relative; z-index: 10; color: white; font-weight: 900;">${randomMessage}</span>`;
        document.body.appendChild(messageDiv);
        
        // 達成動画を表示
        this.showAchievementVideo();
        
        // 豪華なパーティクル効果
        this.createLuxuryParticles();
        
        // 花火効果
        this.createFireworks();
        
        // タスクアイテムにアニメーションクラスを追加
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('completing');
        }
        
        // 4.5秒後にメッセージとオーバーレイを削除（動画時間を考慮）
        setTimeout(() => {
            messageDiv.remove();
            overlay.remove();
        }, 4500);
    }

    createLuxuryParticles() {
        const particleTypes = ['gold', 'silver', 'star', 'heart'];
        const totalParticles = 60;
        
        for (let i = 0; i < totalParticles; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
                particle.className = `particle ${type}`;
                
                // ランダムな位置から開始
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.top = '-20px';
                
                // ランダムな水平移動を追加
                const randomX = (Math.random() - 0.5) * 200;
                particle.style.setProperty('--random-x', randomX + 'px');
                
                document.body.appendChild(particle);
                
                // パーティクルの削除時間を種類によって変更
                const removeTime = type === 'star' ? 3500 : type === 'heart' ? 3000 : 3000;
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, removeTime);
            }, i * 50); // より早い間隔で生成
        }
    }

    createFireworks() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 複数の花火を異なる位置で爆発させる
        const fireworkPositions = [
            { x: centerX - 200, y: centerY - 100 },
            { x: centerX + 200, y: centerY - 100 },
            { x: centerX, y: centerY + 150 },
            { x: centerX - 100, y: centerY - 200 },
            { x: centerX + 100, y: centerY - 200 }
        ];
        
        fireworkPositions.forEach((pos, index) => {
            setTimeout(() => {
                this.createSingleFirework(pos.x, pos.y);
            }, index * 400);
        });
    }

    createSingleFirework(x, y) {
        const particleCount = 25;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle firework';
            
            // 円形に広がるような角度を計算
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            // ランダムな色
            const colors = ['#FF6B35', '#FFD700', '#FF69B4', '#00CED1', '#98FB98', '#DDA0DD'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = color;
            particle.style.boxShadow = `0 0 10px ${color}`;
            
            document.body.appendChild(particle);
            
            // カスタムアニメーション
            particle.style.animation = 'none';
            particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)', 
                    opacity: 1 
                },
                { 
                    transform: `translate(${vx}px, ${vy}px) scale(0.5)`, 
                    opacity: 0 
                }
            ], {
                duration: 1500,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                if (particle.parentNode) {
                    particle.remove();
                }
            };
        }
    }

    showAchievementVideo() {
        // 動画要素を作成
        const video = document.createElement('video');
        video.className = 'achievement-video';
        video.src = 'Achieve.mp4';
        video.autoplay = true;
        video.muted = true; // ブラウザの自動再生ポリシー対応
        video.loop = false;
        video.controls = false;
        video.playsInline = true; // モバイル対応
        
        // 動画をDOMに追加
        document.body.appendChild(video);
        
        // 動画再生開始イベント
        video.addEventListener('loadeddata', () => {
            console.log('Achievement video loaded');
        });
        
        // 動画再生終了イベント
        video.addEventListener('ended', () => {
            // フェードアウトアニメーション
            video.style.animation = 'videoDisappear 0.3s ease-out forwards';
            setTimeout(() => {
                if (video.parentNode) {
                    video.remove();
                }
            }, 300);
        });
        
        // エラーハンドリング
        video.addEventListener('error', (e) => {
            console.warn('Achievement video could not be loaded:', e);
            // 動画が読み込めない場合は要素を削除
            if (video.parentNode) {
                video.remove();
            }
        });
        
        // 3秒後にフェードアウト（動画が長い場合の保険）
        setTimeout(() => {
            if (video.parentNode && !video.ended) {
                video.style.animation = 'videoDisappear 0.3s ease-out forwards';
                setTimeout(() => {
                    if (video.parentNode) {
                        video.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    removeTaskWithAnimation(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.renderCompletedTasks();
    }

    loadCompletedTasks() {
        const saved = localStorage.getItem('yamaToDoCompletedTasks');
        return saved ? JSON.parse(saved) : [];
    }

    saveCompletedTasks() {
        localStorage.setItem('yamaToDoCompletedTasks', JSON.stringify(this.completedTasks));
    }

    cleanOldCompletedTasks() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        this.completedTasks = this.completedTasks.filter(task => {
            const completedDate = new Date(task.completedAt);
            return completedDate >= oneDayAgo;
        });
        
        this.saveCompletedTasks();
    }

    renderCompletedTasks() {
        const taskList = document.getElementById('taskList');
        
        if (this.completedTasks.length === 0) {
            // 完了タスクがない場合は何も表示しない
            const existingSection = document.querySelector('.completed-tasks-section');
            if (existingSection) {
                existingSection.remove();
            }
            return;
        }

        // 既存の完了タスクセクションを削除
        const existingSection = document.querySelector('.completed-tasks-section');
        if (existingSection) {
            existingSection.remove();
        }

        // 完了タスクセクションを作成
        const completedSection = document.createElement('div');
        completedSection.className = 'completed-tasks-section';
        
        const completedTasksHtml = this.completedTasks.map((task, index) => {
            const completedDate = new Date(task.completedAt);
            const timeAgo = this.getTimeAgo(completedDate);
            
            return `
                <div class="completed-task-item">
                    <div class="task-number completed"></div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-processes">
                            ${task.processes.map(process => `
                                <span style="color: rgba(255,255,255,0.7); font-size: 12px; margin-right: 10px;">
                                    ✓ ${process.name}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="completed-time">${timeAgo}</div>
                </div>
            `;
        }).join('');

        completedSection.innerHTML = `
            <div class="completed-tasks-header">
                <div class="completed-tasks-title">完了タスク</div>
                <button class="toggle-completed-btn" onclick="app.toggleCompletedTasks()">
                    ${this.showCompletedTasks ? '非表示' : '表示'}
                </button>
            </div>
            <div class="completed-tasks-content ${this.showCompletedTasks ? '' : 'hidden'}">
                ${completedTasksHtml}
            </div>
        `;

        // タスクリストの後に追加
        taskList.parentNode.appendChild(completedSection);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        
        if (diffMins < 60) {
            return `${diffMins}分前`;
        } else if (diffHours < 24) {
            return `${diffHours}時間前`;
        } else {
            return '1日前';
        }
    }

    toggleCompletedTasks() {
        this.showCompletedTasks = !this.showCompletedTasks;
        this.renderCompletedTasks();
    }

    // テーマ関連メソッド
    loadTheme() {
        const saved = localStorage.getItem('yamaToDoTheme');
        if (saved) {
            return saved === 'dark';
        }
        // システム設定を確認
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    saveTheme() {
        localStorage.setItem('yamaToDoTheme', this.isDarkMode ? 'dark' : 'light');
    }

    applyTheme() {
        const body = document.body;
        const themeIcon = document.querySelector('.theme-icon');
        const themeText = document.querySelector('.theme-text');
        
        if (this.isDarkMode) {
            body.setAttribute('data-theme', 'dark');
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light';
        } else {
            body.removeAttribute('data-theme');
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark';
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.saveTheme();
        this.applyTheme();
    }
}

// アプリケーション初期化
const app = new TodoApp();

// デモデータの追加（初回のみ）
if (app.tasks.length === 0) {
    const demoTasks = [
        {
            id: 'demo1',
            title: 'プロジェクト企画',
            limit: '2024-07-02',
            category: 'Work',
            processes: [
                { name: 'リサーチ', completed: true },
                { name: '企画書作成', completed: true },
                { name: 'プレゼン', completed: false },
                { name: '承認', completed: false },
                { name: '実装', completed: false }
            ],
            order: 0,
            completed: false
        },
        {
            id: 'demo2',
            title: 'ウェブサイト制作',
            limit: '2024-07-15',
            category: 'School',
            processes: [
                { name: 'デザイン', completed: true },
                { name: 'コーディング', completed: false },
                { name: 'テスト', completed: false },
                { name: 'デプロイ', completed: false }
            ],
            order: 1,
            completed: false
        }
    ];
    
    app.tasks = demoTasks;
    app.saveTasks();
    app.renderTasks();
} 