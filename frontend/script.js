// API base
const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = null;

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        document.getElementById('loginScreen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            initApp();
        }, 600);
    } catch (err) {
        alert(err.message);
    }
});

// Fungsi fetch dengan auth header
async function fetchAPI(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Request failed');
    }
    return res.json();
}

// Inisialisasi app setelah login
async function initApp() {
    await loadTodos();
    renderTodoList();
    updateTodoProgress();
    initCalendar();
    initDynamicGreeting();
    startRotatingQuoteTyping();
    // ... lainnya
}

// TODO: load, add, update, delete
let todos = [];
async function loadTodos() {
    todos = await fetchAPI('/todos');
    renderCalendar(); // untuk titik merah
}
async function addTodo(text, category, todoDate) {
    const newTodo = await fetchAPI('/todos', {
        method: 'POST',
        body: JSON.stringify({ text, category, todo_date: todoDate })
    });
    todos.push(newTodo);
    renderTodoList();
    updateTodoProgress();
    renderCalendar();
}
async function toggleTodo(id, completed) {
    await fetchAPI(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed })
    });
    await loadTodos();
    renderTodoList();
    updateTodoProgress();
    renderCalendar();
}
async function deleteTodo(id) {
    await fetchAPI(`/todos/${id}`, { method: 'DELETE' });
    await loadTodos();
    renderTodoList();
    updateTodoProgress();
    renderCalendar();
}

// Kalender dengan titik merah
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    // ... sama seperti sebelumnya, tapi cek todos untuk tanggal
    const datesWithEvents = todos.filter(t => t.todo_date).map(t => t.todo_date);
    // saat render, tambahkan class 'has-event' jika tanggal ada di datesWithEvents
}
