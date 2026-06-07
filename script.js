/* ========== State ========== */
const STORAGE_KEY = 'taskflow_state';
const DEFAULT_CATEGORIES = ['Client Work', 'Bootcamp', 'Side Hustle', 'Personal Gigs'];

const state = {
  tasks: [],
  deletedTasks: [],
  deletedCategories: [],
  categories: [...DEFAULT_CATEGORIES],
  currentView: 'tasks'
};

function genId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ========== Persistence ========== */
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    state.tasks = d.tasks || [];
    state.deletedTasks = d.deletedTasks || [];
    state.deletedCategories = d.deletedCategories || [];
    state.categories = d.categories?.length ? d.categories : [...DEFAULT_CATEGORIES];
    state.currentView = d.currentView || 'tasks';
  } catch (e) { /* use defaults */ }
}

/* ========== Navigation ========== */
function switchView(view) {
  state.currentView = view;
  save();
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.view === view)
  );
  document.querySelectorAll('.view').forEach(el =>
    el.classList.toggle('active', el.id === 'view-' + view)
  );
  renderAll();
}

/* ========== Task CRUD ========== */
function addTask(text, category) {
  state.tasks.push({ id: genId(), text, category, done: false, createdAt: Date.now() });
  save();
  renderAll();
}

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); renderAll(); }
}

function deleteTask(id) {
  const idx = state.tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  const [task] = state.tasks.splice(idx, 1);
  task.deletedAt = Date.now();
  state.deletedTasks.push(task);
  save();
  renderAll();
}

function restoreTask(id) {
  const idx = state.deletedTasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  const [task] = state.deletedTasks.splice(idx, 1);
  delete task.deletedAt;
  state.tasks.push(task);
  save();
  renderAll();
}

function permanentDeleteTask(id) {
  state.deletedTasks = state.deletedTasks.filter(t => t.id !== id);
  save();
  renderAll();
}

function emptyBin() {
  if (!state.deletedTasks.length) return;
  state.deletedTasks = [];
  save();
  renderAll();
}

/* ========== Category Management ========== */
function addCategory(name) {
  name = name.trim();
  if (name && !state.categories.includes(name)) {
    state.categories.push(name);
    save();
    renderAll();
  }
}

function removeCategory(name) {
  state.categories = state.categories.filter(c => c !== name);
  state.deletedCategories.push(name);
  save();
  renderAll();
}

function restoreCategory(name) {
  state.deletedCategories = state.deletedCategories.filter(c => c !== name);
  state.categories.push(name);
  save();
  renderAll();
}

/* ========== Rendering ========== */
function renderAll() {
  populateCategorySelect();
  renderCategoryTags();

  renderTasks();
  renderBin();
  renderDashboard();
}

function populateCategorySelect() {
  const sel = document.getElementById('category-select');
  sel.innerHTML = '';
  state.categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function renderCategoryTags() {
  const container = document.getElementById('category-tags');
  container.innerHTML = '';
  state.categories.forEach(c => {
    const tag = document.createElement('span');
    tag.className = 'cat-tag';
    const name = document.createElement('span');
    name.textContent = c;
    const del = document.createElement('button');
    del.className = 'cat-tag-del';
    del.textContent = '×';
    del.dataset.category = c;
    tag.append(name, del);
    container.appendChild(tag);
  });
}

function createTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.done ? ' completed' : '');
  li.dataset.id = task.id;

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'task-check';
  check.checked = task.done;

  const cat = document.createElement('span');
  cat.className = 'task-category';
  cat.textContent = task.category;

  const text = document.createElement('span');
  text.className = 'task-text';
  text.textContent = task.text;

  const del = document.createElement('button');
  del.className = 'task-delete';
  del.textContent = '✕';
  del.setAttribute('aria-label', 'Delete task');

  li.append(check, cat, text, del);
  return li;
}

function renderTasks() {
  const active = state.tasks.filter(t => !t.done);
  const completed = state.tasks.filter(t => t.done);
  active.sort((a, b) => a.createdAt - b.createdAt);

  const list = document.getElementById('task-list');
  list.innerHTML = '';

  if (!state.tasks.length) {
    list.innerHTML = '<li class="empty-state">No tasks yet. Add one above.</li>';
    return;
  }

  if (active.length) {
    const header = document.createElement('li');
    header.className = 'pending-header';
    const label = document.createElement('span');
    label.className = 'pending-label';
    label.textContent = 'Pending (' + active.length + ')';
    header.appendChild(label);
    list.appendChild(header);
  }

  active.forEach(task => list.appendChild(createTaskItem(task)));

  if (!completed.length) return;

  const section = document.createElement('li');
  section.className = 'completed-section';

  const header = document.createElement('div');
  header.className = 'completed-header';

  const chevron = document.createElement('span');
  chevron.className = 'completed-chevron';
  chevron.textContent = '▶';

  const label = document.createElement('span');
  label.className = 'completed-label';
  label.textContent = 'Completed (' + completed.length + ')';

  header.append(chevron, label);

  const body = document.createElement('div');
  body.className = 'completed-body closed';

  completed.forEach(task => body.appendChild(createTaskItem(task)));

  section.append(header, body);
  list.appendChild(section);

  header.addEventListener('click', (e) => {
    if (!e.target.classList.contains('completed-chevron')) return;
    const isOpen = body.classList.toggle('closed');
    chevron.classList.toggle('open', !isOpen);
  });
}

function renderBin() {
  const list = document.getElementById('deleted-list');
  list.innerHTML = '';

  const count = state.deletedTasks.length;
  if (!count) {
    list.innerHTML = '<li class="empty-state" style="padding:24px">No deleted tasks.</li>';
  } else {
    state.deletedTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'deleted-item';
      li.dataset.id = task.id;

      const cat = document.createElement('span');
      cat.className = 'task-category';
      cat.textContent = task.category;

      const text = document.createElement('span');
      text.className = 'task-text' + (task.done ? ' done' : '');
      text.textContent = task.text;

      const time = document.createElement('span');
      time.className = 'deleted-time';
      const diff = Date.now() - task.deletedAt;
      if (diff < 60000) time.textContent = 'now';
      else if (diff < 3600000) time.textContent = Math.floor(diff / 60000) + 'm';
      else if (diff < 86400000) time.textContent = Math.floor(diff / 3600000) + 'h';
      else time.textContent = Math.floor(diff / 86400000) + 'd';

      const restore = document.createElement('button');
      restore.className = 'btn-restore';
      restore.textContent = 'Restore';

      const permDel = document.createElement('button');
      permDel.className = 'btn-perm-delete';
      permDel.textContent = '✕';
      permDel.setAttribute('aria-label', 'Permanently delete');

      li.append(cat, text, time, restore, permDel);
      list.appendChild(li);
    });
  }

  const labelsList = document.getElementById('deleted-labels-list');
  labelsList.innerHTML = '';

  if (!state.deletedCategories.length) {
    labelsList.innerHTML = '<li class="empty-state" style="padding:24px">No deleted labels.</li>';
  } else {
    state.deletedCategories.forEach(name => {
      const li = document.createElement('li');
      li.className = 'deleted-label-item';

      const labelName = document.createElement('span');
      labelName.className = 'deleted-label-name';
      labelName.textContent = name;

      const restore = document.createElement('button');
      restore.className = 'btn-restore';
      restore.textContent = 'Restore';
      restore.dataset.label = name;

      li.append(labelName, restore);
      labelsList.appendChild(li);
    });
  }
}

function renderDashboard() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.done).length;
  const pending = total - completed;
  const deleted = state.deletedTasks.length;

  document.getElementById('d-total').textContent = total;
  document.getElementById('d-completed').textContent = completed;
  document.getElementById('d-pending').textContent = pending;
  document.getElementById('d-deleted').textContent = deleted;

  const container = document.getElementById('category-breakdown');
  container.innerHTML = '';

  const allCats = [...new Set([...state.categories, ...state.tasks.map(t => t.category)])];
  if (!allCats.length) {
    container.innerHTML = '<p class="empty-state" style="padding:24px">No categories yet.</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'breakdown-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Category</th><th>Total</th><th>Done</th><th>Pending</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  allCats.forEach(c => {
    const catTasks = state.tasks.filter(t => t.category === c);
    const catDone = catTasks.filter(t => t.done).length;
    const catPending = catTasks.length - catDone;
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="cat-name">' + c + '</td>' +
      '<td>' + catTasks.length + '</td>' +
      '<td class="done-count">' + catDone + '</td>' +
      '<td class="pending-count">' + catPending + '</td>';
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

/* ========== Event Listeners ========== */
document.querySelectorAll('.nav-item').forEach(btn =>
  btn.addEventListener('click', () => switchView(btn.dataset.view))
);

document.getElementById('task-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) return;
  addTask(text, document.getElementById('category-select').value);
  input.value = '';
  input.focus();
});

document.getElementById('task-list').addEventListener('click', e => {
  const li = e.target.closest('.task-item');
  if (!li) return;
  if (e.target.classList.contains('task-check')) toggleTask(li.dataset.id);
  else if (e.target.classList.contains('task-delete')) deleteTask(li.dataset.id);
});

document.getElementById('deleted-list').addEventListener('click', e => {
  const li = e.target.closest('.deleted-item');
  if (!li) return;
  if (e.target.classList.contains('btn-restore')) restoreTask(li.dataset.id);
  else if (e.target.classList.contains('btn-perm-delete')) permanentDeleteTask(li.dataset.id);
});

document.getElementById('empty-bin-btn').addEventListener('click', emptyBin);

document.getElementById('deleted-labels-list').addEventListener('click', e => {
  if (e.target.classList.contains('btn-restore')) restoreCategory(e.target.dataset.label);
});

document.getElementById('category-tags').addEventListener('click', e => {
  if (e.target.classList.contains('cat-tag-del')) removeCategory(e.target.dataset.category);
});

document.getElementById('add-category-btn').addEventListener('click', () => {
  const input = document.getElementById('new-category-input');
  const name = input.value.trim();
  if (name) { addCategory(name); input.value = ''; }
});

document.getElementById('new-category-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('add-category-btn').click();
  }
});

/* ========== Init ========== */
load();
if (!['dashboard', 'tasks', 'bin'].includes(state.currentView)) state.currentView = 'tasks';
switchView(state.currentView);
