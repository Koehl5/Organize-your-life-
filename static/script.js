let events = localStorage.getItem('events') ? JSON.parse(localStorage.getItem('events')) : [];
let starredDays = localStorage.getItem('starredDays') ? JSON.parse(localStorage.getItem('starredDays')) : [];
let todos = localStorage.getItem('todos') ? JSON.parse(localStorage.getItem('todos')) : [];
let alarms = localStorage.getItem('alarms') ? JSON.parse(localStorage.getItem('alarms')) : [];
let shoppingItems = localStorage.getItem('shoppingItems') ? JSON.parse(localStorage.getItem('shoppingItems')) : [];
let transactions = localStorage.getItem('budget') ? JSON.parse(localStorage.getItem('budget')) : [];

const calendar = document.getElementById('calendarGrid');
const monthDisplay = document.getElementById('monthDisplay');

// State for current view
let dt = new Date();

function load() {
    const day = dt.getDate();
    const month = dt.getMonth();
    const year = dt.getFullYear();

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const paddingDays = firstDayOfMonth.getDay();

    if (monthDisplay) {
        monthDisplay.innerText = `${dt.toLocaleDateString('en-us', { month: 'long' })} ${year}`;
    }

    if (calendar) {
        calendar.innerHTML = '';

        for (let i = 1; i <= paddingDays + daysInMonth; i++) {
            const daySquare = document.createElement('div');
            const dayString = `${month + 1}/${i - paddingDays}/${year}`;

            if (i > paddingDays) {
                daySquare.innerText = i - paddingDays;

                const eventForDay = events.find(e => e.date === dayString);

                if (i - paddingDays === day && month === new Date().getMonth() && year === new Date().getFullYear()) {
                    daySquare.classList.add('active');
                }

                if (eventForDay) {
                    daySquare.classList.add('event-day');
                }

                if (starredDays.includes(dayString)) {
                    daySquare.classList.add('starred');
                }

                daySquare.addEventListener('click', () => {
                    window.location.href = `/day?date=${dayString}`;
                });
            } else {
                daySquare.classList.add('empty');
            }

            calendar.appendChild(daySquare);
        }
    }
}

function initButtons() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            dt.setMonth(dt.getMonth() + 1);
            load();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            dt.setMonth(dt.getMonth() - 1);
            load();
        });
    }
}

// --- Day View Logic ---
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function initDayView() {
    const dateStr = getQueryParam('date');
    if (!dateStr) return;

    const dateObj = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dayTitle = document.getElementById('dayTitle');
    if (dayTitle) {
        dayTitle.innerText = dateObj.toLocaleDateString('en-US', options);
    }

    renderDayEvents(dateStr);

    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) {
        addEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveDayEvent(dateStr);
        });
    }

    const starBtn = document.getElementById('starDayBtn');
    if (starBtn && dateStr) {
        updateStarButton(dateStr);
        starBtn.onclick = () => toggleStarDay(dateStr);
    }
}

function updateStarButton(dateStr) {
    const starBtn = document.getElementById('starDayBtn');
    if (starredDays.includes(dateStr)) {
        starBtn.innerText = '★';
        starBtn.classList.add('active');
    } else {
        starBtn.innerText = '☆';
        starBtn.classList.remove('active');
    }
}

function toggleStarDay(dateStr) {
    if (starredDays.includes(dateStr)) {
        starredDays = starredDays.filter(d => d !== dateStr);
    } else {
        starredDays.push(dateStr);
    }
    localStorage.setItem('starredDays', JSON.stringify(starredDays));
    updateStarButton(dateStr);
}

function renderDayEvents(dateStr) {
    const listContainer = document.getElementById('dayEventsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const dayEvents = events.filter(e => e.date === dateStr);

    dayEvents.sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        return timeA.localeCompare(timeB);
    });

    if (dayEvents.length === 0) {
        listContainer.innerHTML = '<p class="no-events-msg">No events for this day.</p>';
        return;
    }

    dayEvents.forEach((event) => {
        const item = document.createElement('div');
        item.classList.add('event-item');
        const displayTime = event.time ? event.time : 'All Day';

        item.innerHTML = `
            <span class="event-time">${displayTime}</span>
            <div class="event-title">${event.title}</div>
            <div class="event-desc">${event.description || ''}</div>
            <button class="delete-event-btn" onclick="deleteEvent('${event.date}', '${event.time || ''}', '${event.title.replace(/'/g, "\\'")}')">×</button>
        `;
        listContainer.appendChild(item);
    });
}

function saveDayEvent(dateStr) {
    const titleInput = document.getElementById('eventTitle');
    const timeInput = document.getElementById('eventTime');
    const descInput = document.getElementById('eventDesc');

    if (titleInput.value && timeInput.value) {
        events.push({
            date: dateStr,
            title: titleInput.value,
            time: timeInput.value,
            description: descInput.value
        });
        localStorage.setItem('events', JSON.stringify(events));
        titleInput.value = '';
        timeInput.value = '';
        descInput.value = '';
        renderDayEvents(dateStr);
    }
}

window.deleteEvent = function (date, time, title) {
    const index = events.findIndex(e => e.date === date && (e.time || '') === time && e.title === title);
    if (index > -1) {
        events.splice(index, 1);
        localStorage.setItem('events', JSON.stringify(events));
        renderDayEvents(date);
    }
};

// --- To-Do List Logic ---
function initTodoList() {
    const todoInput = document.getElementById('todoInput');
    const addBtn = document.getElementById('addTodoBtn');

    if (todoInput && addBtn) {
        addBtn.addEventListener('click', addTodo);
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTodo();
        });
        renderTodos();
    }
}

function addTodo() {
    const todoInput = document.getElementById('todoInput');
    const text = todoInput.value.trim();

    if (text) {
        todos.push({
            id: Date.now(),
            text: text,
            completed: false,
            date: new Date().toLocaleDateString('en-us')
        });
        localStorage.setItem('todos', JSON.stringify(todos));
        todoInput.value = '';
        renderTodos();
    }
}

window.toggleTodo = function (id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodos();
    }
}

window.deleteTodo = function (id) {
    todos = todos.filter(t => t.id !== id);
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
};

function renderTodos() {
    const todoList = document.getElementById('todoList');
    if (!todoList) return;

    todoList.innerHTML = '';
    if (todos.length === 0) {
        todoList.innerHTML = '<p class="empty-msg">No tasks added.</p>';
        return;
    }

    todos.forEach(todo => {
        const item = document.createElement('div');
        item.classList.add('todo-item');
        item.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})">
            <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
            <button class="delete-todo" onclick="deleteTodo(${todo.id})">×</button>
        `;
        todoList.appendChild(item);
    });
}

// --- Sidebar Logic ---
function renderSidebar() {
    const upcomingContainer = document.getElementById('upcomingEvents');
    if (!upcomingContainer) return;

    upcomingContainer.innerHTML = '';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const getFormattedDate = (date) => `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    const todayDateStr = getFormattedDate(today);
    const tomorrowDateStr = getFormattedDate(tomorrow);

    const sidebarEvents = events.filter(e => e.date === todayDateStr || e.date === tomorrowDateStr);

    sidebarEvents.sort((a, b) => {
        if (a.date !== b.date) return a.date === todayDateStr ? -1 : 1;
        const timeA = a.time || '';
        const timeB = b.time || '';
        return timeA.localeCompare(timeB);
    });

    if (sidebarEvents.length === 0) {
        upcomingContainer.innerHTML = '<p class="empty-msg">No events for today or tomorrow.</p>';
        return;
    }

    sidebarEvents.forEach(e => {
        const item = document.createElement('div');
        item.classList.add('sidebar-event');
        const dateLabel = e.date === todayDateStr ? 'Today' : 'Tomorrow';
        const timeLabel = e.time ? e.time : 'All Day';
        item.innerHTML = `<strong>${e.title}</strong><span>${dateLabel} - ${timeLabel}</span>`;
        upcomingContainer.appendChild(item);
    });
}

// --- Alarms Logic ---
let currentAudio = null;

function initAlarms() {
    updateClock();
    setInterval(updateClock, 1000);
    renderAlarms();

    const addBtn = document.getElementById('addAlarmBtn');
    if (addBtn) addBtn.addEventListener('click', addAlarm);

    const stopBtn = document.getElementById('stopAlarmBtn');
    if (stopBtn) stopBtn.addEventListener('click', stopAlarm);

    const snoozeBtn = document.getElementById('snoozeAlarmBtn');
    if (snoozeBtn) snoozeBtn.addEventListener('click', snoozeAlarm);

    const syncBtn = document.getElementById('syncAlarmsBtn');
    if (syncBtn) syncBtn.addEventListener('click', syncAlarmsWithCalendar);

    setInterval(checkAlarms, 1000);
}

function updateClock() {
    const clock = document.getElementById('digitalClock');
    const dateEl = document.getElementById('currentDate');
    const now = new Date();

    if (clock) clock.innerText = now.toLocaleTimeString('en-US', { hour12: false });
    if (dateEl) dateEl.innerText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function snoozeAlarm() {
    stopAlarm(); // Stop current sound

    // Add 10 minutes to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const snoozeTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    alarms.push({
        id: Date.now(),
        time: snoozeTime,
        label: 'Snooze',
        sound: 'chime', // Default snooze sound
        enabled: true
    });
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
    alert(`Alarm snoozed until ${snoozeTime}`);
}

function syncAlarmsWithCalendar() {
    // Get today's date in M/D/YYYY format to match event storage
    const now = new Date();
    const todayStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

    // Filter for today's timed events
    const todayEvents = events.filter(e => e.date === todayStr && e.time);

    if (todayEvents.length === 0) {
        alert("No timed events found for today.");
        return;
    }

    // Sort by time
    todayEvents.sort((a, b) => a.time.localeCompare(b.time));
    const firstEvent = todayEvents[0];

    // Check if alarm already exists
    const exists = alarms.some(a => a.time === firstEvent.time && a.label === firstEvent.title);
    if (exists) {
        alert(`Alarm already set for ${firstEvent.title} at ${firstEvent.time}`);
        return;
    }

    alarms.push({
        id: Date.now(),
        time: firstEvent.time,
        label: firstEvent.title,
        sound: 'alert',
        enabled: true
    });
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
    alert(`Synced: Alarm set for ${firstEvent.title} at ${firstEvent.time}`);
}

function addAlarm() {
    const timeInput = document.getElementById('alarmTimeInput');
    const labelInput = document.getElementById('alarmLabelInput');
    const soundInput = document.getElementById('alarmSoundInput');

    if (timeInput.value) {
        alarms.push({
            id: Date.now(),
            time: timeInput.value,
            label: labelInput.value || 'Alarm',
            sound: soundInput.value,
            enabled: true
        });
        localStorage.setItem('alarms', JSON.stringify(alarms));
        renderAlarms();
    }
}

window.deleteAlarm = function (id) {
    alarms = alarms.filter(a => a.id !== id);
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
};

window.toggleAlarm = function (id) {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
        alarm.enabled = !alarm.enabled;
        localStorage.setItem('alarms', JSON.stringify(alarms));
        renderAlarms();
    }
};

function renderAlarms() {
    const list = document.getElementById('alarmsList');
    if (!list) return;

    list.innerHTML = '';
    alarms.sort((a, b) => a.time.localeCompare(b.time));

    if (alarms.length === 0) {
        list.innerHTML = '<p class="empty-msg">No alarms set.</p>';
        return;
    }

    alarms.forEach(alarm => {
        const item = document.createElement('div');
        item.classList.add('alarm-item');
        if (!alarm.enabled) item.classList.add('disabled');

        item.innerHTML = `
            <div class="alarm-info"><span class="alarm-time">${alarm.time}</span><span class="alarm-label">${alarm.label}</span></div>
            <div class="alarm-controls">
                <label class="switch"><input type="checkbox" ${alarm.enabled ? 'checked' : ''} onchange="toggleAlarm(${alarm.id})"><span class="slider round"></span></label>
                <button class="delete-btn" onclick="deleteAlarm(${alarm.id})"><i class="ph ph-trash"></i></button>
            </div>
        `;
        list.appendChild(item);
    });
}

function checkAlarms() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    if (now.getSeconds() !== 0) return;

    alarms.forEach(alarm => {
        if (alarm.enabled && alarm.time === currentTime) triggerAlarm(alarm);
    });
}

// --- Weather Station Logic ---
function initWeatherStation() {
    const loading = document.getElementById('weatherLoading');
    const content = document.getElementById('weatherContent');
    const errorEl = document.getElementById('weatherError');
    const locationName = document.getElementById('locationName');

    if (!loading || !content) return;

    if (!navigator.geolocation) {
        showWeatherError("Geolocation is not supported by this browser.");
        return;
    }

    loading.classList.remove('hidden');
    content.classList.add('hidden');
    errorEl.classList.add('hidden');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            locationName.innerText = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
            fetchWeatherData(lat, lon);

            // Log location to server
            fetch('/api/log_location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: lat, lon: lon })
            }).catch(e => console.error("Error logging location:", e));
        },
        (error) => {
            let msg = "Unable to retrieve your location.";
            if (error.code === error.PERMISSION_DENIED) {
                msg = "Location access denied. Please enable location services.";
            }
            showWeatherError(msg);
        }
    );
}

function showWeatherError(msg) {
    const loading = document.getElementById('weatherLoading');
    const errorEl = document.getElementById('weatherError');
    const content = document.getElementById('weatherContent');

    // Check if elements exist before accessing classList
    if (loading) loading.classList.add('hidden');
    if (content) content.classList.add('hidden');

    if (errorEl) {
        errorEl.classList.remove('hidden');
        const p = errorEl.querySelector('p');
        if (p) p.innerText = msg;
    }
}

async function fetchWeatherData(lat, lon) {
    // Open-Meteo API (Free, No Key)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');
        const data = await response.json();
        renderWeather(data);
    } catch (e) {
        console.error(e);
        showWeatherError("Failed to fetch weather data.");
    }
}

function renderWeather(data) {
    const loading = document.getElementById('weatherLoading');
    const content = document.getElementById('weatherContent');

    if (loading) loading.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    // Current
    const current = data.current;

    const tempEl = document.getElementById('currentTemp');
    if (tempEl) tempEl.innerText = Math.round(current.temperature_2m);

    const windSpeedEl = document.getElementById('windSpeed');
    if (windSpeedEl) windSpeedEl.innerText = `${current.wind_speed_10m} mph`;

    const windDirEl = document.getElementById('windDir');
    if (windDirEl) windDirEl.innerText = `${current.wind_direction_10m}°`;

    const elevationEl = document.getElementById('elevation');
    if (elevationEl) elevationEl.innerText = `${Math.round(data.elevation)} m`;

    // Condition
    const code = current.weather_code;
    const condition = getWeatherCondition(code);

    const descEl = document.getElementById('weatherDesc');
    if (descEl) descEl.innerText = condition.desc;

    const iconEl = document.getElementById('weatherIcon');
    if (iconEl) iconEl.className = `ph ${condition.icon}`;

    // Forecast
    const daily = data.daily;
    const grid = document.getElementById('forecastGrid');
    if (grid) {
        grid.innerHTML = '';
        // 5 days
        for (let i = 0; i < 5; i++) {
            const date = new Date(daily.time[i]);
            // Add timezone offset to fix off-by-one day issue due to UTC
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

            const dayName = adjustedDate.toLocaleDateString('en-US', { weekday: 'short' });

            const dayCode = daily.weather_code[i];
            const cond = getWeatherCondition(dayCode);
            const maxTemp = Math.round(daily.temperature_2m_max[i]);
            const minTemp = Math.round(daily.temperature_2m_min[i]);

            const el = document.createElement('div');
            el.className = 'forecast-day';
            el.innerHTML = `
                <span class="day-name">${dayName}</span>
                <i class="day-icon ph ${cond.icon}"></i>
                <span class="day-temp">${maxTemp}° / ${minTemp}°</span>
            `;
            grid.appendChild(el);
        }
    }
}

function getWeatherCondition(code) {
    // WMO Weather interpretation codes (WW)
    // 0: Clear sky
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    // 45, 48: Fog
    // 51, 53, 55: Drizzle
    // 61, 63, 65: Rain
    // 71, 73, 75: Snow fall
    // 80, 81, 82: Rain showers
    // 95, 96, 99: Thunderstorm

    if (code === 0) return { desc: 'Clear Sky', icon: 'ph-sun' };
    if (code >= 1 && code <= 3) return { desc: 'Cloudy', icon: 'ph-cloud' };
    if (code === 45 || code === 48) return { desc: 'Foggy', icon: 'ph-cloud-fog' };
    if (code >= 51 && code <= 55) return { desc: 'Drizzle', icon: 'ph-cloud-rain' };
    if (code >= 61 && code <= 82) return { desc: 'Rain', icon: 'ph-cloud-rain' };
    if (code >= 71 && code <= 77) return { desc: 'Snow', icon: 'ph-snowflake' };
    if (code >= 95) return { desc: 'Thunderstorm', icon: 'ph-cloud-lightning' };

    return { desc: 'Unknown', icon: 'ph-question' };
}

function triggerAlarm(alarm) {
    const modal = document.getElementById('alarmModal');
    const label = document.getElementById('triggerLabel');
    const time = document.getElementById('triggerTime');

    if (modal) {
        label.innerText = alarm.label;
        time.innerText = alarm.time;
        modal.style.display = 'flex';

        if (alarm.sound === 'silent') return;

        const audioEl = document.getElementById(`sound-${alarm.sound}`);
        if (audioEl) {
            audioEl.currentTime = 0;
            audioEl.loop = true;
            audioEl.play().catch(e => console.log('Audio play failed:', e));
            currentAudio = audioEl;
        }
    }
}

function stopAlarm() {
    const modal = document.getElementById('alarmModal');
    if (modal) modal.style.display = 'none';
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

// --- Shopping List Logic ---
function initShoppingList() {
    const input = document.getElementById('shoppingInput');
    const addBtn = document.getElementById('addShoppingBtn');

    if (input && addBtn) {
        renderShoppingList();
        addBtn.addEventListener('click', addShoppingItem);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addShoppingItem(); });
    }
}

function addShoppingItem() {
    const input = document.getElementById('shoppingInput');
    const qtyInput = document.getElementById('shoppingQty');
    const text = input.value.trim();
    const qty = qtyInput.value || 1;

    if (text) {
        shoppingItems.push({ id: Date.now(), text: text, qty: qty, checked: false });
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
        input.value = '';
        renderShoppingList();
    }
}

window.toggleShoppingItem = function (id) {
    const item = shoppingItems.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
        renderShoppingList();
    }
};

window.deleteShoppingItem = function (id) {
    shoppingItems = shoppingItems.filter(i => i.id !== id);
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    renderShoppingList();
};

function renderShoppingList() {
    const list = document.getElementById('shoppingList');
    if (!list) return;

    list.innerHTML = '';
    if (shoppingItems.length === 0) {
        list.innerHTML = '<p class="empty-msg">Your list is empty.</p>';
        return;
    }

    shoppingItems.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('shopping-item');
        if (item.checked) div.classList.add('checked');

        div.innerHTML = `
            <div class="item-left">
                <div class="checkbox-wrapper" onclick="toggleShoppingItem(${item.id})">${item.checked ? '<i class="ph ph-check-square"></i>' : '<i class="ph ph-square"></i>'}</div>
                <span class="item-text">${item.text}</span>
                <span class="item-qty">x${item.qty}</span>
            </div>
            <button class="delete-btn" onclick="deleteShoppingItem(${item.id})"><i class="ph ph-trash"></i></button>
        `;
        list.appendChild(div);
    });
}

// --- Budget Tracker Logic ---
function initBudget() {
    const form = document.getElementById('budgetForm');
    if (form) {
        updateBudgetDisplay();
        renderBudgetChart();
        renderTransactions();
        form.addEventListener('submit', addTransaction);
    }
}

function addTransaction(e) {
    e.preventDefault();
    const descInput = document.getElementById('transDesc');
    const amountInput = document.getElementById('transAmount');
    const typeInput = document.getElementById('transType');
    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = typeInput.value;

    if (desc && !isNaN(amount)) {
        transactions.push({ id: Date.now(), desc: desc, amount: amount, type: type, date: new Date().toLocaleDateString('en-US') });
        localStorage.setItem('budget', JSON.stringify(transactions));
        descInput.value = '';
        amountInput.value = '';
        updateBudgetDisplay();
        renderBudgetChart();
        renderTransactions();
    }
}

window.deleteTransaction = function (id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('budget', JSON.stringify(transactions));
    updateBudgetDisplay();
    renderBudgetChart();
    renderTransactions();
};

let budgetChartInstance = null;

function renderBudgetChart() {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;

    // Calculate totals
    let income = 0;
    let expenses = 0;

    transactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        if (t.type === 'expense') expenses += t.amount;
    });

    if (budgetChartInstance) {
        budgetChartInstance.destroy();
    }

    budgetChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [income, expenses],
                backgroundColor: [
                    '#00ff88', // Success/Income color
                    '#ff0055'  // Danger/Expense color
                ],
                borderColor: [
                    'rgba(0,0,0,0.1)',
                    'rgba(0,0,0,0.1)'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#a0a0b0',
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        boxWidth: 10,
                        padding: 15
                    }
                }
            },
            cutout: '70%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function updateBudgetDisplay() {
    const balanceEl = document.getElementById('totalBalance');
    const incomeEl = document.getElementById('totalIncome');
    const expenseEl = document.getElementById('totalExpense');

    const total = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0).toFixed(2);
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0).toFixed(2);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0).toFixed(2);

    if (balanceEl) balanceEl.innerText = `$${total}`;
    if (incomeEl) incomeEl.innerText = `+ $${income}`;
    if (expenseEl) expenseEl.innerText = `- $${expense}`;
}

function renderTransactions() {
    const list = document.getElementById('transactionsList');
    if (!list) return;

    list.innerHTML = '';
    transactions.sort((a, b) => b.id - a.id);

    if (transactions.length === 0) {
        list.innerHTML = '<p class="empty-msg">No transactions yet.</p>';
        return;
    }

    transactions.forEach(t => {
        const item = document.createElement('div');
        item.classList.add('trans-item');
        if (t.type === 'income') item.classList.add('income');
        else item.classList.add('expense');

        item.innerHTML = `
            <div class="trans-info">
                <span class="trans-desc">${t.desc}</span>
                <span class="trans-date">${t.date}</span>
            </div>
            <div class="trans-right">
                <span class="trans-amount">${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</span>
                <button class="delete-trans" onclick="deleteTransaction(${t.id})">×</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    load();
    initButtons();
    initDayView();
    initTodoList();

    // Check which page we are on to init specific features
    if (document.getElementById('alarmsList')) {
        initAlarms();
    } else if (document.getElementById('shoppingList')) {
        initShoppingList();
    } else if (document.getElementById('totalBalance')) {
        initBudget();
    } else if (document.getElementById('weatherCard')) {
        initWeatherStation();
    }

    renderSidebar(); // Sidebar exists on all pages
});