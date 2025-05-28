// 学生数据
let studentsData = [];
let calledStudents = [];
let isRolling = false;
let rollInterval;
let currentIndex = -1;
let rollSpeed = 100; // 初始滚动速度
let rollSlowdownStarted = false;
let rollAnimationFrame;
let lastRollTime = 0;
let soundEnabled = true; // 音效开关

// DOM 元素
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const studentInfo = document.getElementById('studentInfo');
const totalCount = document.getElementById('totalCount');
const calledCount = document.getElementById('calledCount');
const historyList = document.getElementById('historyList');
const soundToggle = document.getElementById('soundToggle');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查本地存储中是否有数据
    loadFromLocalStorage();
    
    // 如果没有数据，提示用户添加学生
    if (studentsData.length === 0) {
        showInputDialog();
    }
    
    // 更新统计信息
    updateStats();
    
    // 绑定按钮事件
    startBtn.addEventListener('click', startRolling);
    stopBtn.addEventListener('click', stopRolling);
    resetBtn.addEventListener('click', resetRolling);
    
    // 音效控制按钮
    if (soundToggle) {
        // 从本地存储获取音效设置
        const savedSoundSetting = localStorage.getItem('randomNameSoundEnabled');
        if (savedSoundSetting !== null) {
            soundEnabled = savedSoundSetting === 'true';
            updateSoundToggleUI();
        }
        
        soundToggle.addEventListener('click', toggleSound);
    }

    // 添加快捷键
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            if (isRolling) {
                stopRolling();
            } else {
                startRolling();
            }
        } else if (e.code === 'KeyR') {
            resetRolling();
        } else if (e.code === 'KeyA') {
            showInputDialog();
        } else if (e.code === 'KeyM') {
            toggleSound();
        }
    });
    
    // 添加结果框闪烁效果
    const resultBox = document.querySelector('.result-box');
    if (resultBox) {
        resultBox.addEventListener('animationend', function() {
            this.classList.remove('highlight-animation');
        });
    }
});

// 从本地存储加载数据
function loadFromLocalStorage() {
    const savedStudents = localStorage.getItem('randomNameStudents');
    const savedCalledStudents = localStorage.getItem('randomNameCalledStudents');
    
    if (savedStudents) {
        studentsData = JSON.parse(savedStudents);
    }
    
    if (savedCalledStudents) {
        calledStudents = JSON.parse(savedCalledStudents);
        
        // 更新历史记录
        updateHistoryList();
    }
}

// 保存数据到本地存储
function saveToLocalStorage() {
    localStorage.setItem('randomNameStudents', JSON.stringify(studentsData));
    localStorage.setItem('randomNameCalledStudents', JSON.stringify(calledStudents));
}

// 更新统计信息
function updateStats() {
    totalCount.textContent = studentsData.length;
    calledCount.textContent = calledStudents.length;
}

// 显示输入对话框
function showInputDialog() {
    // 创建对话框元素
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    
    const dialogBox = document.createElement('div');
    dialogBox.className = 'dialog-box';
    
    // 对话框内容
    dialogBox.innerHTML = `
        <h2>添加学生名单</h2>
        <p>请输入学生名单，格式为：学号,姓名，每行一个学生</p>
        <p>例如：<br>1,张三<br>2,李四</p>
        <textarea id="studentList" rows="10" cols="40" placeholder="学号,姓名"></textarea>
        <div class="import-options">
            <div class="import-option">
                <label for="excelImport" class="file-input-label">
                    <span class="file-input-icon">📄</span>
                    <span>导入Excel表格</span>
                </label>
                <input type="file" id="excelImport" accept=".xlsx,.xls" style="display:none">
            </div>
            <div class="import-info">支持.xlsx/.xls格式，第一列为学号，第二列为姓名</div>
        </div>
        <div class="dialog-buttons">
            <button id="cancelBtn" class="btn secondary">取消</button>
            <button id="confirmBtn" class="btn primary">确定</button>
        </div>
    `;
    
    dialogOverlay.appendChild(dialogBox);
    document.body.appendChild(dialogOverlay);
    
    // 为对话框添加样式
    const style = document.createElement('style');
    style.textContent = `
        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .dialog-box {
            background-color: white;
            border-radius: 10px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .dialog-box h2 {
            margin-top: 0;
            color: var(--primary-color);
        }
        
        .dialog-box textarea {
            width: 100%;
            padding: 0.5rem;
            margin: 1rem 0;
            border: 1px solid var(--border-color);
            border-radius: 5px;
            font-family: inherit;
        }
        
        .dialog-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }
        
        .import-options {
            margin: 1rem 0;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .import-option {
            display: flex;
            align-items: center;
        }
        
        .file-input-label {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background-color: #f1f5ff;
            border: 1px solid #d1e1ff;
            border-radius: 5px;
            color: var(--primary-color);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .file-input-label:hover {
            background-color: #e1ecff;
        }
        
        .file-input-icon {
            font-size: 1.2rem;
        }
        
        .import-info {
            font-size: 0.85rem;
            color: var(--secondary-color);
            margin-top: 0.3rem;
        }
    `;
    document.head.appendChild(style);
    
    // 绑定按钮事件
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const textArea = document.getElementById('studentList');
    const excelImport = document.getElementById('excelImport');
    
    // 如果已有数据，填充到文本框
    if (studentsData.length > 0) {
        let text = '';
        studentsData.forEach(student => {
            text += `${student.id},${student.name}\n`;
        });
        textArea.value = text.trim();
    }
    
    // 导入Excel文件事件
    excelImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // 检查是否已加载xlsx库
        if (typeof XLSX === 'undefined') {
            // 动态加载xlsx库
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            script.onload = function() {
                processExcelFile(file, textArea);
            };
            script.onerror = function() {
                showToast('加载Excel处理库失败，请检查网络连接', 'error');
            };
            document.head.appendChild(script);
        } else {
            processExcelFile(file, textArea);
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(dialogOverlay);
    });
    
    confirmBtn.addEventListener('click', () => {
        const text = textArea.value.trim();
        if (text) {
            // 解析输入的学生名单
            const lines = text.split('\n');
            const newStudents = [];
            
            lines.forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const id = parts[0].trim();
                    const name = parts[1].trim();
                    if (id && name) {
                        newStudents.push({ id, name });
                    }
                }
            });
            
            if (newStudents.length > 0) {
                studentsData = newStudents;
                calledStudents = [];
                saveToLocalStorage();
                updateStats();
                updateHistoryList();
                showToast('学生名单已更新');
            } else {
                showToast('没有有效的学生数据', 'error');
            }
        }
        
        document.body.removeChild(dialogOverlay);
    });
}

// 处理Excel文件
function processExcelFile(file, textArea) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // 将工作表转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // 过滤掉空行并格式化为"学号,姓名"格式
            let formattedData = '';
            jsonData.forEach(row => {
                if (row.length >= 2 && row[0] && row[1]) {
                    formattedData += `${row[0]},${row[1]}\n`;
                }
            });
            
            // 将数据填入文本框
            textArea.value = formattedData.trim();
            showToast('Excel数据已导入', 'success');
        } catch (error) {
            console.error('Excel处理错误:', error);
            showToast('Excel处理错误: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        showToast('读取文件失败', 'error');
    };
    
    reader.readAsArrayBuffer(file);
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--success-color);
            color: white;
            padding: 0.7rem 1.5rem;
            border-radius: 50px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: fadeInOut 3s ease forwards;
        }
        
        .toast.error {
            background-color: #dc3545;
        }
        
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            10% { opacity: 1; transform: translate(-50%, 0); }
            90% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
        }
    `;
    document.head.appendChild(style);
    
    // 3秒后移除
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// 开始随机点名
function startRolling() {
    if (studentsData.length === 0) {
        showToast('请先添加学生名单', 'error');
        showInputDialog();
        return;
    }
    
    if (studentsData.length === calledStudents.length) {
        showToast('所有学生已被点到，请重置', 'error');
        return;
    }
    
    isRolling = true;
    rollSlowdownStarted = false;
    rollSpeed = 100; // 重置速度
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // 开始时播放音效
    if (soundEnabled) {
        playSound('roll');
    }
    
    // 添加开始动画效果
    addRollingStartEffect();
    
    // 使用requestAnimationFrame实现更平滑的动画
    lastRollTime = performance.now();
    animateRolling();
}

// 添加开始滚动的视觉效果
function addRollingStartEffect() {
    const resultBox = document.querySelector('.result-box');
    
    if (resultBox) {
        // 添加开始动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 4px 20px rgba(91, 135, 247, 0.15); }
                50% { transform: scale(1.02); box-shadow: 0 8px 30px rgba(91, 135, 247, 0.3); }
                100% { transform: scale(1); box-shadow: 0 4px 20px rgba(91, 135, 247, 0.15); }
            }
            
            @keyframes bgShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            .rolling {
                animation: pulse 1.2s ease-in-out infinite;
                background: linear-gradient(120deg, #f8f9fa, #ffffff, #f0f4ff);
                background-size: 200% 200%;
                animation: bgShift 3s ease infinite;
            }
            
            .highlight-animation {
                animation: highlight 1s ease-out;
            }
            
            @keyframes highlight {
                0% { background-color: rgba(91, 135, 247, 0.2); }
                100% { background-color: transparent; }
            }
            
            .student-name-rolling {
                animation: textPulse 0.8s ease-in-out infinite;
            }
            
            @keyframes textPulse {
                0% { opacity: 0.7; transform: scale(0.98); }
                50% { opacity: 1; transform: scale(1); }
                100% { opacity: 0.7; transform: scale(0.98); }
            }
            
            .bounce-in {
                animation: bounceIn 0.6s ease-out forwards;
            }
            
            @keyframes bounceIn {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.05); opacity: 0.8; }
                70% { transform: scale(0.95); opacity: 0.9; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // 添加滚动中的类
        resultBox.classList.add('rolling');
        resultBox.classList.add('active');
    }
}

// 使用requestAnimationFrame实现平滑动画
function animateRolling() {
    const now = performance.now();
    const elapsed = now - lastRollTime;
    
    if (elapsed > rollSpeed) {
        // 更新最后一次滚动时间
        lastRollTime = now;
        
        // 随机选择一个未被点到的学生
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * studentsData.length);
        } while (calledStudents.includes(randomIndex));
        
        currentIndex = randomIndex;
        displayRollingStudent(studentsData[currentIndex]);
        
        // 判断是否开始减速
        if (rollSlowdownStarted) {
            // 逐渐增加时间间隔，减慢速度
            rollSpeed = Math.min(rollSpeed * 1.2, 800);
            
            // 当速度减慢到一定程度时停止
            if (rollSpeed >= 800) {
                stopRolling(true);
                return;
            }
        }
    }
    
    if (isRolling) {
        rollAnimationFrame = requestAnimationFrame(animateRolling);
    }
}

// 停止随机点名
function stopRolling(autoStop = false) {
    if (!isRolling) return;
    
    if (!autoStop) {
        // 手动停止时，开始减速动画
        rollSlowdownStarted = true;
        
        // 播放停止音效
        if (soundEnabled) {
            playSound('stop');
        }
        return;
    }
    
    // 取消动画帧
    if (rollAnimationFrame) {
        cancelAnimationFrame(rollAnimationFrame);
    }
    
    isRolling = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    // 移除滚动效果
    const resultBox = document.querySelector('.result-box');
    if (resultBox) {
        resultBox.classList.remove('rolling');
        resultBox.classList.remove('active');
        // 添加停止后的高亮效果
        resultBox.classList.add('highlight-animation');
        
        // 添加短暂的震动效果
        resultBox.classList.add('shake');
        setTimeout(() => {
            resultBox.classList.remove('shake');
        }, 800);
    }
    
    // 添加到已点名学生列表
    if (currentIndex !== -1 && !calledStudents.includes(currentIndex)) {
        calledStudents.push(currentIndex);
        
        // 添加到历史记录
        addToHistory(studentsData[currentIndex]);
        
        // 更新统计信息
        updateStats();
        
        // 保存到本地存储
        saveToLocalStorage();
        
        // 显示最终结果
        displayFinalResult(studentsData[currentIndex]);
    }
}

// 显示滚动中的学生信息
function displayRollingStudent(student) {
    studentInfo.innerHTML = `
        <div class="student-name student-name-rolling">${student.name}</div>
        <div class="student-number">${student.id}</div>
    `;
}

// 显示最终的学生信息
function displayFinalResult(student) {
    studentInfo.innerHTML = '';
    
    // 创建新元素用于动画
    const nameElement = document.createElement('div');
    nameElement.className = 'student-name bounce-in';
    nameElement.textContent = student.name;
    
    const idElement = document.createElement('div');
    idElement.className = 'student-number bounce-in';
    idElement.style.animationDelay = '0.1s';
    idElement.textContent = student.id;
    
    // 添加一个小图标
    const iconElement = document.createElement('div');
    iconElement.className = 'result-icon';
    iconElement.innerHTML = '<i class="fas fa-check-circle"></i>';
    iconElement.style.animationDelay = '0.2s';
    
    studentInfo.appendChild(nameElement);
    studentInfo.appendChild(idElement);
    studentInfo.appendChild(iconElement);
    
    // 播放音效
    if (soundEnabled) {
        playSound('success');
    }
}

// 播放音效
function playSound(type) {
    if (!soundEnabled) return;
    
    // 创建音效样式
    if (!document.getElementById('sound-style')) {
        const style = document.createElement('style');
        style.id = 'sound-style';
        style.textContent = `
            .sound-container {
                position: absolute;
                top: -9999px;
                left: -9999px;
                height: 0;
                width: 0;
                opacity: 0;
            }
        `;
        document.head.appendChild(style);
        
        // 创建音效容器
        const soundContainer = document.createElement('div');
        soundContainer.className = 'sound-container';
        document.body.appendChild(soundContainer);
    }
    
    // 定义音效
    const sounds = {
        success: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
        roll: 'https://assets.mixkit.co/sfx/preview/mixkit-fast-small-sweep-transition-166.mp3',
        stop: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3',
        reset: 'https://assets.mixkit.co/sfx/preview/mixkit-video-game-retro-click-237.mp3'
    };
    
    if (sounds[type]) {
        const audio = new Audio(sounds[type]);
        audio.volume = 0.5;
        audio.play().catch(e => console.log('音频播放失败:', e));
    }
}

// 重置点名
function resetRolling() {
    if (isRolling) {
        if (rollAnimationFrame) {
            cancelAnimationFrame(rollAnimationFrame);
        }
        isRolling = false;
        
        // 移除滚动效果
        const resultBox = document.querySelector('.result-box');
        if (resultBox) {
            resultBox.classList.remove('rolling');
            resultBox.classList.remove('active');
        }
    }
    
    // 播放重置音效
    if (soundEnabled) {
        playSound('reset');
    }
    
    calledStudents = [];
    updateStats();
    clearHistory();
    saveToLocalStorage();
    
    // 添加重置动画
    studentInfo.innerHTML = '';
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.innerHTML = '点击开始按钮开始点名<i class="fas fa-arrow-down" style="margin-top: 8px; font-size: 1.5rem;"></i>';
    
    // 添加淡入效果
    placeholder.style.opacity = '0';
    studentInfo.appendChild(placeholder);
    
    // 触发重绘
    placeholder.offsetHeight;
    
    // 添加过渡效果
    placeholder.style.transition = 'opacity 0.5s ease-in-out';
    placeholder.style.opacity = '1';
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    showToast('点名已重置');
}

// 显示学生信息
function displayStudent(student) {
    studentInfo.innerHTML = `
        <div class="student-name">${student.name}</div>
        <div class="student-number">${student.id}</div>
    `;
}

// 添加到历史记录
function addToHistory(student) {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    // 添加滑入动画
    historyItem.style.opacity = '0';
    historyItem.style.transform = 'translateX(-20px)';
    
    historyItem.innerHTML = `
        <span class="history-name">${student.id} - ${student.name}</span>
        <span class="history-time">${timeString}</span>
    `;
    
    historyList.insertBefore(historyItem, historyList.firstChild);
    
    // 触发重绘
    historyItem.offsetHeight;
    
    // 添加过渡效果
    historyItem.style.transition = 'all 0.3s ease-out';
    historyItem.style.opacity = '1';
    historyItem.style.transform = 'translateX(0)';
}

// 更新历史记录列表
function updateHistoryList() {
    historyList.innerHTML = '';
    
    // 逆序显示，最新的在最上面
    for (let i = calledStudents.length - 1; i >= 0; i--) {
        const studentIndex = calledStudents[i];
        const student = studentsData[studentIndex];
        
        if (student) {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-name">${student.id} - ${student.name}</span>
                <span class="history-time">已点名</span>
            `;
            
            historyList.appendChild(historyItem);
        }
    }
}

// 清空历史记录
function clearHistory() {
    historyList.innerHTML = '';
}

// 添加菜单
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.innerHTML = `
        <button id="addStudentsBtn" class="menu-btn">添加学生</button>
        <button id="exportDataBtn" class="menu-btn">导出数据</button>
        <button id="importDataBtn" class="menu-btn">导入数据</button>
    `;
    
    header.appendChild(menu);
    
    // 添加菜单样式
    const style = document.createElement('style');
    style.textContent = `
        .menu {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .menu-btn {
            background-color: transparent;
            border: 1px solid var(--border-color);
            color: var(--secondary-color);
            padding: 0.4rem 0.8rem;
            border-radius: 50px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .menu-btn:hover {
            background-color: var(--bg-color);
            color: var(--primary-color);
            border-color: var(--primary-color);
        }
    `;
    document.head.appendChild(style);
    
    // 绑定菜单按钮事件
    document.getElementById('addStudentsBtn').addEventListener('click', showInputDialog);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', importData);
});

// 导出数据
function exportData() {
    if (studentsData.length === 0) {
        showToast('没有数据可导出', 'error');
        return;
    }
    
    // 创建导出选项对话框
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    
    const dialogBox = document.createElement('div');
    dialogBox.className = 'dialog-box export-dialog';
    
    // 对话框内容
    dialogBox.innerHTML = `
        <h2><i class="fas fa-file-export"></i> 导出数据</h2>
        <div class="export-options">
            <div class="export-option">
                <input type="radio" id="exportAll" name="exportType" value="all" checked>
                <label for="exportAll">
                    <div class="option-title">导出全部数据</div>
                    <div class="option-desc">导出所有学生和点名记录</div>
                </label>
            </div>
            <div class="export-option">
                <input type="radio" id="exportCalled" name="exportType" value="called">
                <label for="exportCalled">
                    <div class="option-title">仅导出已点名学生</div>
                    <div class="option-desc">只导出已被点到的学生名单</div>
                </label>
            </div>
            <div class="export-option">
                <input type="radio" id="exportUncalled" name="exportType" value="uncalled">
                <label for="exportUncalled">
                    <div class="option-title">仅导出未点名学生</div>
                    <div class="option-desc">只导出尚未被点到的学生名单</div>
                </label>
            </div>
        </div>
        <div class="format-options">
            <div class="format-title">导出格式：</div>
            <div class="format-selection">
                <div class="format-option">
                    <input type="radio" id="formatJson" name="exportFormat" value="json" checked>
                    <label for="formatJson">JSON</label>
                </div>
                <div class="format-option">
                    <input type="radio" id="formatExcel" name="exportFormat" value="excel">
                    <label for="formatExcel">Excel</label>
                </div>
                <div class="format-option">
                    <input type="radio" id="formatCsv" name="exportFormat" value="csv">
                    <label for="formatCsv">CSV</label>
                </div>
            </div>
        </div>
        <div class="dialog-buttons">
            <button id="cancelExportBtn" class="btn secondary">取消</button>
            <button id="confirmExportBtn" class="btn primary">导出</button>
        </div>
    `;
    
    dialogOverlay.appendChild(dialogBox);
    document.body.appendChild(dialogOverlay);
    
    // 为对话框添加样式
    const style = document.createElement('style');
    style.textContent = `
        .export-dialog {
            max-width: 550px;
        }
        
        .export-options {
            margin: 1.5rem 0;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .export-option {
            display: flex;
            align-items: flex-start;
            gap: 0.8rem;
            padding: 0.8rem;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            transition: all 0.2s ease;
        }
        
        .export-option:hover {
            background-color: var(--primary-light);
            border-color: var(--primary-color);
        }
        
        .export-option input[type="radio"] {
            margin-top: 0.3rem;
        }
        
        .option-title {
            font-weight: 500;
            margin-bottom: 0.3rem;
        }
        
        .option-desc {
            font-size: 0.85rem;
            color: var(--secondary-color);
        }
        
        .format-options {
            margin: 1.5rem 0;
            padding: 1rem;
            background-color: var(--bg-color);
            border-radius: 8px;
        }
        
        .format-title {
            font-weight: 500;
            margin-bottom: 0.8rem;
        }
        
        .format-selection {
            display: flex;
            gap: 1.5rem;
        }
        
        .format-option {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
    `;
    document.head.appendChild(style);
    
    // 函数：关闭对话框
    const closeDialog = () => {
        document.body.removeChild(dialogOverlay);
        document.removeEventListener('keydown', handleKeyDown);
        showToast('已取消导出操作');
    };
    
    // 绑定按钮事件
    const cancelBtn = document.getElementById('cancelExportBtn');
    const confirmBtn = document.getElementById('confirmExportBtn');
    
    cancelBtn.addEventListener('click', closeDialog);
    
    // 点击对话框外部区域关闭对话框
    dialogOverlay.addEventListener('click', (e) => {
        if (e.target === dialogOverlay) {
            closeDialog();
        }
    });
    
    // 添加键盘事件处理ESC键
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeDialog();
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    confirmBtn.addEventListener('click', () => {
        // 获取选择的导出类型
        const exportType = document.querySelector('input[name="exportType"]:checked').value;
        const exportFormat = document.querySelector('input[name="exportFormat"]:checked').value;
        
        // 根据选择的类型导出数据
        exportDataByType(exportType, exportFormat);
        
        // 关闭对话框
        document.body.removeChild(dialogOverlay);
        // 移除键盘事件监听
        document.removeEventListener('keydown', handleKeyDown);
    });
}

// 根据类型导出数据
function exportDataByType(type, format) {
    let dataToExport;
    let fileName;
    
    // 准备导出数据
    switch (type) {
        case 'all':
            dataToExport = {
                students: studentsData,
                called: calledStudents
            };
            fileName = '点名系统全部数据';
            break;
        case 'called':
            const calledStudentsData = calledStudents.map(index => studentsData[index]);
            dataToExport = calledStudentsData;
            fileName = '已点名学生名单';
            break;
        case 'uncalled':
            const uncalledStudentsData = studentsData.filter((_, index) => !calledStudents.includes(index));
            dataToExport = uncalledStudentsData;
            fileName = '未点名学生名单';
            break;
        default:
            dataToExport = {
                students: studentsData,
                called: calledStudents
            };
            fileName = '点名系统数据';
    }
    
    // 根据格式导出
    switch (format) {
        case 'json':
            exportAsJson(dataToExport, fileName);
            break;
        case 'excel':
            exportAsExcel(dataToExport, fileName, type);
            break;
        case 'csv':
            exportAsCsv(dataToExport, fileName, type);
            break;
        default:
            exportAsJson(dataToExport, fileName);
    }
}

// 导出为JSON
function exportAsJson(data, fileName) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('数据已导出为JSON文件');
}

// 导出为Excel
function exportAsExcel(data, fileName, type) {
    // 检查是否已加载xlsx库
    if (typeof XLSX === 'undefined') {
        showToast('正在加载Excel处理库...', 'info');
        
        // 动态加载xlsx库
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = function() {
            // 库加载完成后执行导出
            processExcelExport(data, fileName, type);
        };
        script.onerror = function() {
            showToast('加载Excel处理库失败，请检查网络连接', 'error');
        };
        document.head.appendChild(script);
    } else {
        // 库已加载，直接执行导出
        processExcelExport(data, fileName, type);
    }
}

// 处理Excel导出
function processExcelExport(data, fileName, type) {
    try {
        let worksheet;
        
        // 根据不同的数据类型创建不同的工作表
        if (type === 'all') {
            // 创建工作簿
            const workbook = XLSX.utils.book_new();
            
            // 创建学生名单工作表
            const studentsData = data.students.map((student, index) => {
                return {
                    '学号': student.id,
                    '姓名': student.name,
                    '状态': data.called.includes(index) ? '已点名' : '未点名'
                };
            });
            const studentsWorksheet = XLSX.utils.json_to_sheet(studentsData);
            XLSX.utils.book_append_sheet(workbook, studentsWorksheet, '学生名单');
            
            // 创建点名记录工作表
            const calledData = data.called.map(index => {
                const student = data.students[index];
                return {
                    '学号': student.id,
                    '姓名': student.name
                };
            });
            const calledWorksheet = XLSX.utils.json_to_sheet(calledData);
            XLSX.utils.book_append_sheet(workbook, calledWorksheet, '点名记录');
            
            // 导出工作簿
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } else {
            // 创建单个工作表
            const exportData = data.map(student => {
                return {
                    '学号': student.id,
                    '姓名': student.name
                };
            });
            
            // 创建工作簿并添加工作表
            const workbook = XLSX.utils.book_new();
            worksheet = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(workbook, worksheet, '学生名单');
            
            // 导出工作簿
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        }
        
        showToast('数据已导出为Excel文件');
    } catch (error) {
        console.error('Excel导出错误:', error);
        showToast('导出Excel失败: ' + error.message, 'error');
    }
}

// 导出为CSV
function exportAsCsv(data, fileName, type) {
    let csvContent = '';
    
    // 添加CSV标题行
    csvContent += '学号,姓名\n';
    
    // 根据不同的数据类型添加不同的内容
    if (type === 'all') {
        // 导出全部数据
        studentsData.forEach((student, index) => {
            const status = calledStudents.includes(index) ? '已点名' : '未点名';
            csvContent += `${student.id},${student.name},${status}\n`;
        });
    } else {
        // 导出指定的学生列表
        data.forEach(student => {
            csvContent += `${student.id},${student.name}\n`;
        });
    }
    
    // 创建Blob并下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('数据已导出为CSV文件');
}

// 导入数据
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.students && Array.isArray(data.students)) {
                    studentsData = data.students;
                    
                    if (data.called && Array.isArray(data.called)) {
                        calledStudents = data.called;
                    } else {
                        calledStudents = [];
                    }
                    
                    saveToLocalStorage();
                    updateStats();
                    updateHistoryList();
                    
                    showToast('数据已导入');
                } else {
                    showToast('无效的数据格式', 'error');
                }
            } catch (error) {
                showToast('导入失败：' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    });
    
    input.click();
}

// 音效开关
function toggleSound() {
    soundEnabled = !soundEnabled;
    
    // 保存设置到本地存储
    localStorage.setItem('randomNameSoundEnabled', soundEnabled);
    
    // 更新UI
    updateSoundToggleUI();
    
    // 播放测试音效反馈
    if (soundEnabled) {
        playSound('success');
    }
    
    // 显示提示
    showToast(soundEnabled ? '音效已开启' : '音效已关闭');
}

// 更新音效按钮UI
function updateSoundToggleUI() {
    if (soundToggle) {
        if (soundEnabled) {
            soundToggle.classList.remove('sound-off');
            soundToggle.classList.add('sound-on');
            soundToggle.querySelector('.sound-icon').className = 'fas fa-volume-high sound-icon';
        } else {
            soundToggle.classList.remove('sound-on');
            soundToggle.classList.add('sound-off');
            soundToggle.querySelector('.sound-icon').className = 'fas fa-volume-xmark sound-icon';
        }
    }
} 