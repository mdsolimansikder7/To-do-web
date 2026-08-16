(function(){
  const STORAGE_KEY = 'todos_app_tasks_v1';
  let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  let editingTaskId = null;   // id of task being edited, or null when creating a brand-new reminder
  let creatingNew = false;

  const emptyState = document.getElementById('emptyState');
  const taskListEl = document.getElementById('taskList');
  const addBar = document.getElementById('addBar');
  const addInput = document.getElementById('addInput');
  const addSendBtn = document.getElementById('addSendBtn');
  const fabBtn = document.getElementById('fabBtn');

  const menuBtn = document.getElementById('menuBtn');
  const menuDropdown = document.getElementById('menuDropdown');
  const menuAddReminder = document.getElementById('menuAddReminder');
  const menuAddAlarm = document.getElementById('menuAddAlarm');

  const screenReminder = document.getElementById('screen-reminder');
  const remTitleInput = document.getElementById('remTitleInput');
  const remTaskPreview = document.getElementById('remTaskPreview');
  const datePill = document.getElementById('datePill');
  const timePill = document.getElementById('timePill');
  const repeatSelect = document.getElementById('repeatSelect');
  const alarmToggle = document.getElementById('alarmToggle');
  const remCancel = document.getElementById('remCancel');
  const remSave = document.getElementById('remSave');

  // sensible defaults so pendingReminder is NEVER null while the reminder screen exists
  function defaultReminder(){
    const now = new Date();
    let h = now.getHours() % 12; if(h===0) h = 12;
    return {
      dateISO: now.toISOString().slice(0,10),
      hour12: h,
      minute: 0,
      ampm: now.getHours() >= 12 ? 'PM' : 'AM',
      repeat: 'Never',
      alarm: false
    };
  }
  let pendingReminder = defaultReminder();

  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function fmtDatePretty(iso){
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
  }

  function fmtReminderShort(t){
    if(!t.reminder) return '';
    const d = new Date(t.reminder.dateISO + 'T00:00:00');
    const md = d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
    return `${md}, ${t.reminder.hour12}:${String(t.reminder.minute).padStart(2,'0')} ${t.reminder.ampm}`;
  }

  function render(){
    if(tasks.length === 0){
      emptyState.style.display = 'flex';
      taskListEl.style.display = 'none';
      return;
    }
    emptyState.style.display = 'none';
    taskListEl.style.display = 'block';
    taskListEl.innerHTML = '';
    tasks.forEach(t=>{
      const item = document.createElement('div');
      item.className = 'task-item';

      const cb = document.createElement('div');
      cb.className = 'checkbox' + (t.done ? ' checked' : '');
      cb.onclick = ()=>{ t.done = !t.done; save(); render(); };

      const body = document.createElement('div');
      body.className = 'task-body';
      const txt = document.createElement('div');
      txt.className = 'task-text' + (t.done ? ' done' : '');
      txt.textContent = t.text;
      const meta = document.createElement('div');
      meta.className = 'task-meta' + (t.reminder ? '' : ' none');
      meta.textContent = '⏰ ' + fmtReminderShort(t);
      body.appendChild(txt);
      body.appendChild(meta);
      body.onclick = ()=> openReminderScreen(t.id);

      const del = document.createElement('button');
      del.className = 'task-delete';
      del.textContent = '✕';
      del.onclick = ()=>{ tasks = tasks.filter(x=>x.id!==t.id); save(); render(); };

      item.appendChild(cb);
      item.appendChild(body);
      item.appendChild(del);
      taskListEl.appendChild(item);
    });
  }

  // ---- Add task bar ----
  fabBtn.onclick = ()=>{
    addBar.classList.add('active');
    fabBtn.style.display = 'none';
    addInput.focus();
  };
  addInput.addEventListener('input', ()=>{
    addSendBtn.disabled = addInput.value.trim().length === 0;
  });
  addInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') commitAdd();
  });
  addSendBtn.onclick = commitAdd;

  function commitAdd(){
    const val = addInput.value.trim();
    if(!val) return;
    tasks.unshift({ id: Date.now().toString(), text: val, done:false, reminder:null });
    save();
    addInput.value = '';
    addSendBtn.disabled = true;
    addBar.classList.remove('active');
    fabBtn.style.display = 'flex';
    render();
  }

  document.addEventListener('click', (e)=>{
    if(addBar.classList.contains('active') && !addBar.contains(e.target) && e.target !== fabBtn){
      if(addInput.value.trim().length === 0){
        addBar.classList.remove('active');
        fabBtn.style.display = 'flex';
      }
    }
    if(menuDropdown.classList.contains('open') && !menuDropdown.contains(e.target) && e.target !== menuBtn){
      menuDropdown.classList.remove('open');
    }
  });

  // ---- 3-dot menu: quick access to Reminder / Alarm ----
  menuBtn.onclick = (e)=>{
    e.stopPropagation();
    menuDropdown.classList.toggle('open');
  };
  menuAddReminder.onclick = ()=>{
    menuDropdown.classList.remove('open');
    openReminderScreen(null, {alarmOn:false});
  };
  menuAddAlarm.onclick = ()=>{
    menuDropdown.classList.remove('open');
    openReminderScreen(null, {alarmOn:true});
  };

  // ---- Reminder screen ----
  function buildWheel(el, values, selectedIndex, onChange){
    el.innerHTML = '<div class="wheel-pad"></div>' +
      values.map(v=>`<div class="wheel-item">${v}</div>`).join('') +
      '<div class="wheel-pad"></div>';
    const items = el.querySelectorAll('.wheel-item');
    function updateSelected(){
      const center = el.scrollTop + el.clientHeight/2;
      let closest = 0, closestDist = Infinity;
      items.forEach((it, i)=>{
        const dist = Math.abs((it.offsetTop + it.offsetHeight/2) - center);
        if(dist < closestDist){ closestDist = dist; closest = i; }
      });
      items.forEach((it,i)=> it.classList.toggle('selected', i===closest));
      return closest;
    }
    let scrollTimer;
    el.addEventListener('scroll', ()=>{
      clearTimeout(scrollTimer);
      updateSelected();
      scrollTimer = setTimeout(()=>{
        const idx = updateSelected();
        onChange(values[idx]);
      }, 120);
    });
    requestAnimationFrame(()=>{
      const target = items[selectedIndex];
      if(target) el.scrollTop = target.offsetTop - el.clientHeight/2 + target.offsetHeight/2;
      updateSelected();
    });
  }

  // taskId === null  -> creating a brand new reminder (not tied to an existing task yet)
  function openReminderScreen(taskId, opts){
    opts = opts || {};
    editingTaskId = taskId;
    creatingNew = (taskId === null);

    let existing = null;
    if(!creatingNew){
      const t = tasks.find(x=>x.id===taskId);
      if(!t){ return; }
      existing = t.reminder;
      remTaskPreview.style.display = 'block';
      remTaskPreview.textContent = t.text;
      remTitleInput.style.display = 'none';
    } else {
      remTaskPreview.style.display = 'none';
      remTitleInput.style.display = 'block';
      remTitleInput.value = '';
    }

    pendingReminder = existing ? {...existing} : defaultReminder();
    if(opts.alarmOn) pendingReminder.alarm = true;

    datePill.textContent = fmtDatePretty(pendingReminder.dateISO);
    timePill.textContent = `${pendingReminder.hour12}:${String(pendingReminder.minute).padStart(2,'0')} ${pendingReminder.ampm}`;
    repeatSelect.value = pendingReminder.repeat;
    alarmToggle.classList.toggle('on', pendingReminder.alarm);

    const hours = Array.from({length:12}, (_,i)=> i+1);
    const minutes = Array.from({length:60}, (_,i)=> String(i).padStart(2,'0'));
    const ampms = ['AM','PM'];

    buildWheel(document.getElementById('hourWheel'), hours, pendingReminder.hour12-1, v=>{
      pendingReminder.hour12 = v;
      timePill.textContent = `${pendingReminder.hour12}:${String(pendingReminder.minute).padStart(2,'0')} ${pendingReminder.ampm}`;
    });
    buildWheel(document.getElementById('minWheel'), minutes, pendingReminder.minute, v=>{
      pendingReminder.minute = parseInt(v,10);
      timePill.textContent = `${pendingReminder.hour12}:${String(pendingReminder.minute).padStart(2,'0')} ${pendingReminder.ampm}`;
    });
    buildWheel(document.getElementById('ampmWheel'), ampms, pendingReminder.ampm==='AM'?0:1, v=>{
      pendingReminder.ampm = v;
      timePill.textContent = `${pendingReminder.hour12}:${String(pendingReminder.minute).padStart(2,'0')} ${pendingReminder.ampm}`;
    });

    screenReminder.classList.add('active');
  }

  datePill.onclick = ()=> openCalendar();

  alarmToggle.onclick = ()=>{
    if(!pendingReminder) pendingReminder = defaultReminder();
    pendingReminder.alarm = !pendingReminder.alarm;
    alarmToggle.classList.toggle('on', pendingReminder.alarm);
  };
  repeatSelect.onchange = ()=>{
    if(!pendingReminder) pendingReminder = defaultReminder();
    pendingReminder.repeat = repeatSelect.value;
  };

  remCancel.onclick = ()=>{
    screenReminder.classList.remove('active');
    editingTaskId = null;
    creatingNew = false;
  };
  remSave.onclick = ()=>{
    if(creatingNew){
      const title = remTitleInput.value.trim();
      if(!title){ remTitleInput.focus(); return; }
      tasks.unshift({ id: Date.now().toString(), text: title, done:false, reminder: {...pendingReminder} });
    } else {
      const t = tasks.find(x=>x.id===editingTaskId);
      if(t) t.reminder = { ...pendingReminder };
    }
    save();
    render();
    screenReminder.classList.remove('active');
    editingTaskId = null;
    creatingNew = false;
  };

  // ---- Custom calendar popup (replaces native <input type=date>, which
  //      fails with a SecurityError inside sandboxed / cross-origin iframes) ----
  const calendarOverlay = document.getElementById('calendarOverlay');
  const calGrid = document.getElementById('calGrid');
  const calTitle = document.getElementById('calTitle');
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');
  const calCancel = document.getElementById('calCancel');
  const calToday = document.getElementById('calToday');

  let calViewYear, calViewMonth; // 0-indexed month, for the month currently shown
  const DOW = ['S','M','T','W','T','F','S'];
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function openCalendar(){
    const sel = new Date(pendingReminder.dateISO + 'T00:00:00');
    calViewYear = sel.getFullYear();
    calViewMonth = sel.getMonth();
    renderCalendar();
    calendarOverlay.classList.add('open');
  }
  function closeCalendar(){ calendarOverlay.classList.remove('open'); }

  function renderCalendar(){
    calTitle.textContent = `${MONTH_NAMES[calViewMonth]} ${calViewYear}`;
    calGrid.innerHTML = '';
    DOW.forEach(d=>{
      const el = document.createElement('div');
      el.className = 'cal-dow';
      el.textContent = d;
      calGrid.appendChild(el);
    });

    const firstOfMonth = new Date(calViewYear, calViewMonth, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(calViewYear, calViewMonth+1, 0).getDate();

    const todayISO = new Date().toISOString().slice(0,10);
    const selectedISO = pendingReminder.dateISO;

    for(let i=0;i<startOffset;i++){
      const el = document.createElement('div');
      calGrid.appendChild(el);
    }
    for(let day=1; day<=daysInMonth; day++){
      const iso = `${calViewYear}-${String(calViewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const el = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = day;
      if(iso === todayISO) el.classList.add('today');
      if(iso === selectedISO) el.classList.add('selected');
      el.onclick = ()=>{
        pendingReminder.dateISO = iso;
        datePill.textContent = fmtDatePretty(iso);
        closeCalendar();
      };
      calGrid.appendChild(el);
    }
  }

  calPrev.onclick = ()=>{
    calViewMonth--;
    if(calViewMonth < 0){ calViewMonth = 11; calViewYear--; }
    renderCalendar();
  };
  calNext.onclick = ()=>{
    calViewMonth++;
    if(calViewMonth > 11){ calViewMonth = 0; calViewYear++; }
    renderCalendar();
  };
  calCancel.onclick = closeCalendar;
  calToday.onclick = ()=>{
    const now = new Date();
    const iso = now.toISOString().slice(0,10);
    pendingReminder.dateISO = iso;
    datePill.textContent = fmtDatePretty(iso);
    closeCalendar();
  };
  calendarOverlay.addEventListener('click', (e)=>{
    if(e.target === calendarOverlay) closeCalendar();
  });

  render();
})();
