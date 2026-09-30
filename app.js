// 待辦清單資料的本地儲存鍵名稱
const STORAGE_KEY = 'todo-app-items';

// 取得 DOM 元素
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const remainingCount = document.getElementById('remainingCount');

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

// 渲染待辦列表
function renderTodos() {
  const todos = loadTodos();

  // 清空目前列表，避免重複渲染
  todoList.innerHTML = '';

  // 若沒有待辦事項，顯示提示文字並停止後續渲染
  if (todos.length === 0) {
    emptyState.hidden = false;
    updateRemainingCount(todos);
    return;
  }

  emptyState.hidden = true;

  todos.forEach((todo) => {
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

  updateRemainingCount(todos);
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

// 事件綁定：新增表單提交
todoForm.addEventListener('submit', addTodo);

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

// 第一次載入頁面時渲染
renderTodos();
