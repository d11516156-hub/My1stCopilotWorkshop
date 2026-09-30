// 待辦清單資料的本地儲存鍵名稱
const STORAGE_KEY = 'todo-app-items';
const THEME_STORAGE_KEY = 'todo-app-theme';

// 取得 DOM 元素
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const remainingCount = document.getElementById('remainingCount');
const clearCompletedButton = document.getElementById('clearCompletedBtn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeLabel = document.getElementById('themeLabel');
const filterButtons = document.querySelectorAll('.filter-button');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let currentFilter = 'all';
let hasManualTheme = false;

// 從 localStorage 讀取資料，若沒有資料或格式異常，則回傳空陣列
function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('讀取待辦資料失敗:', error);
    return [];
  }
}

// 將待辦資料寫入 localStorage，避免把無效資料存進去
function saveTodos(todos) {
  try {
    if (!Array.isArray(todos)) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('儲存待辦資料失敗:', error);
  }
}

// 取得未完成待辦數量，並更新底部統計
function updateRemainingCount(todos) {
  const incompleteCount = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成: ${incompleteCount} 項`;
}

// 套用主題並更新切換按鈕；非手動模式會保留作業系統的 CSS 設定
function applyTheme(theme, manual = false) {
  hasManualTheme = manual;

  if (manual) {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('儲存主題設定失敗:', error);
    }
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  const isDark = theme === 'dark';
  themeIcon.textContent = isDark ? '☀️' : '🌙';
  themeLabel.textContent = isDark ? '淺色模式' : '深色模式';
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

// 優先使用手動選擇，否則依作業系統設定初始化
function initializeTheme() {
  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.error('讀取主題設定失敗:', error);
  }

  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme, true);
    return;
  }

  applyTheme(systemTheme.matches ? 'dark' : 'light');
}

// 依目前篩選條件取得要顯示的待辦
function getVisibleTodos(todos) {
  if (currentFilter === 'active') {
    return todos.filter((todo) => !todo.completed);
  }
  if (currentFilter === 'completed') {
    return todos.filter((todo) => todo.completed);
  }
  return todos;
}

// 篩選結果為空時顯示對應提示
function getEmptyMessage(todos) {
  if (todos.length === 0) {
    return '還沒有任何待辦事項，新增一個吧！';
  }
  if (currentFilter === 'active') {
    return '太棒了，沒有未完成的事項！';
  }
  return '還沒有已完成的事項。';
}

// 渲染待辦列表
function renderTodos() {
  const todos = loadTodos();
  const visibleTodos = getVisibleTodos(todos);

  // 清空目前列表，避免重複渲染
  todoList.innerHTML = '';

  visibleTodos.forEach((todo) => {
    const listItem = document.createElement('li');
    listItem.className = `todo-item${todo.completed ? ' completed' : ''}`;
    listItem.dataset.id = String(todo.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `標記 ${todo.text} 為完成`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = '刪除';
    deleteButton.setAttribute('aria-label', `刪除 ${todo.text}`);

    listItem.appendChild(checkbox);
    listItem.appendChild(text);
    listItem.appendChild(deleteButton);
    todoList.appendChild(listItem);
  });

  emptyState.hidden = visibleTodos.length > 0;
  emptyState.textContent = getEmptyMessage(todos);
  updateRemainingCount(todos);
  clearCompletedButton.hidden = !todos.some((todo) => todo.completed);
}

// 切換目前篩選並更新按鈕狀態
function setFilter(filter) {
  currentFilter = filter;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  renderTodos();
}

// 新增待辦事項
function addTodo(event) {
  event.preventDefault();

  const text = todoInput.value.trim();

  // 若輸入為空白，直接忽略，不新增資料
  if (!text) {
    todoInput.focus();
    return;
  }

  const todos = loadTodos();
  const newTodo = {
    id: Date.now(),
    text,
    completed: false,
  };

  todos.push(newTodo);
  saveTodos(todos);
  todoInput.value = '';
  renderTodos();
  todoInput.focus();
}

// 切換待辦完成狀態
function toggleTodo(id) {
  const todos = loadTodos();
  const updatedTodos = todos.map((todo) => {
    if (String(todo.id) === String(id)) {
      return { ...todo, completed: !todo.completed };
    }
    return todo;
  });

  saveTodos(updatedTodos);
  renderTodos();
}

// 刪除單筆待辦
function deleteTodo(id) {
  const todos = loadTodos().filter((todo) => String(todo.id) !== String(id));
  saveTodos(todos);
  renderTodos();
}

function clearCompletedTodos() {
  const todos = loadTodos();
  if (!todos.some((todo) => todo.completed)) {
    return;
  }

    const confirmed = window.confirm('確定要刪除所有已完成的待辦事項嗎？此操作無法復原。');
  if (!confirmed) {
    return;
  }

  saveTodos(todos.filter((todo) => !todo.completed));
  renderTodos();
}

// 事件綁定：新增表單提交
todoForm.addEventListener('submit', addTodo);
clearCompletedButton.addEventListener('click', clearCompletedTodos);

// 事件委派：處理勾選與刪除動作
todoList.addEventListener('click', (event) => {
  const target = event.target;

  if (target.matches('.delete-btn')) {
    const item = target.closest('.todo-item');
    if (item) {
      deleteTodo(item.dataset.id);
    }
  }
});

todoList.addEventListener('change', (event) => {
  const target = event.target;

  if (target.matches('input[type="checkbox"]')) {
    const item = target.closest('.todo-item');
    if (item) {
      toggleTodo(item.dataset.id);
    }
  }
});

// 篩選待辦事項
filterButtons.forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

// 切換主題並記住使用者的手動選擇
themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.dataset.theme || (systemTheme.matches ? 'dark' : 'light');
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark', true);
});

// 尚未手動選擇時，作業系統設定變更會同步更新按鈕
systemTheme.addEventListener('change', (event) => {
  if (!hasManualTheme) {
    applyTheme(event.matches ? 'dark' : 'light');
  }
});

// 第一次載入頁面時渲染
initializeTheme();
renderTodos();
