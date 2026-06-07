const STORAGE_KEY = 'taskmanager_tasks';

/* ─── State ─── */
let tasks = [];

/* ─── DOM refs ─── */
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const categorySelect = document.getElementById('category-select');
const list = document.getElementById('task-list');
const totalEl = document.getElementById('total-count');
const doneEl = document.getElementById('done-count');

/* ─── Helpers ─── */
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
}

function render() {
  list.innerHTML = '';

  if (tasks.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'No tasks yet. Add one above.';
    list.appendChild(li);
  } else {
    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' completed' : '');
      li.dataset.index = index;

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'task-check';
      check.checked = task.done;

      const category = document.createElement('span');
      category.className = 'task-category';
      category.textContent = task.category;

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;

      const del = document.createElement('button');
      del.className = 'task-delete';
      del.textContent = '✕';
      del.setAttribute('aria-label', 'Delete task');

      li.appendChild(check);
      li.appendChild(category);
      li.appendChild(text);
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  updateCounters();
}

function updateCounters() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  totalEl.textContent = total;
  doneEl.textContent = done;
}

function addTask(text, category) {
  tasks.push({ text, category, done: false });
  save();
  render();
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  save();
  render();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  save();
  render();
}

/* ─── Event listeners ─── */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const category = categorySelect.value;
  addTask(text, category);
  input.value = '';
  input.focus();
});

list.addEventListener('click', (e) => {
  const li = e.target.closest('.task-item');
  if (!li) return;
  const index = parseInt(li.dataset.index, 10);

  if (e.target.classList.contains('task-check')) {
    toggleTask(index);
  } else if (e.target.classList.contains('task-delete')) {
    deleteTask(index);
  }
});

/* ─── Init ─── */
load();
render();
