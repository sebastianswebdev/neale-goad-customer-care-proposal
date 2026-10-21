'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-AU', {timeZone:'Australia/Melbourne',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
const addDays = (iso, days) => { const date = new Date(`${iso}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0,10); };
const weekday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const nextWorkday = (iso) => { let result = addDays(iso, 1); while ([0,6].includes(weekday(result))) result = addDays(result,1); return result; };
const dateLabel = (iso) => new Intl.DateTimeFormat('en-AU', {day:'numeric',month:'short',year:'numeric',timeZone:'Australia/Melbourne'}).format(new Date(`${iso}T12:00:00Z`));
const dueDate = addDays(today, 14);
const statusLabels = {due:'Due soon',overdue:'Overdue',requested:'Request pending',confirmed:'Confirmed',completed:'Completed',held:'Contact held'};
const makeRecords = () => [
  {id:'alex',name:'Alex',initials:'AL',vehicle:'Toyota Corolla',registration:'DEMO-01',service:'Logbook / vehicle service',status:'due',due:dueDate,odometer:'72,400 km',dueKm:'80,000 km',permission:true,validContact:true,reminder:false,request:null},
  {id:'morgan',name:'Morgan',initials:'MO',vehicle:'Ford Ranger',registration:'DEMO-02',service:'Diesel / truck',status:'overdue',due:addDays(today,-10),odometer:'118,600 km',dueKm:'125,000 km',permission:true,validContact:true,reminder:false,request:null},
  {id:'jamie',name:'Jamie',initials:'JA',vehicle:'Mazda CX-5',registration:'DEMO-03',service:'Logbook / vehicle service',status:'due',due:addDays(today,5),odometer:'54,100 km',dueKm:'60,000 km',permission:true,validContact:true,reminder:false,request:null},
  {id:'casey',name:'Casey',initials:'CA',vehicle:'Hyundai i30',registration:'DEMO-04',service:'Logbook / vehicle service',status:'held',due:addDays(today,8),odometer:'88,200 km',dueKm:'90,000 km',permission:false,validContact:true,reminder:false,request:null}
];
let records = makeRecords();
let selectedId = 'alex';
let filter = 'all';
let query = '';
let reminderRecordId = null;
let activeView = 'staff';
const record = () => records.find((item) => item.id === selectedId);
const alex = () => records.find((item) => item.id === 'alex');
const eligible = (item) => ['due','overdue'].includes(item.status) && item.permission && item.validContact && !item.reminder;

function announce(message) { $('#demo-status').textContent = message; }
function setView(view, focusTab = false) {
  activeView = view;
  ['staff','customer'].forEach((name) => {
    const active = name === view;
    $(`#${name}-tab`).setAttribute('aria-selected', String(active));
    $(`#${name}-tab`).tabIndex = active ? 0 : -1;
    $(`#${name}-panel`).hidden = !active;
  });
  if (focusTab) $(`#${view}-tab`).focus();
  renderCustomer();
}

function renderStats() {
  const stats = [
    ['Due / overdue',records.filter((item) => ['due','overdue'].includes(item.status)).length,'Sample vehicles'],
    ['Booking requests',records.filter((item) => item.status === 'requested').length,'Awaiting staff confirmation'],
    ['Confirmed visits',records.filter((item) => item.status === 'confirmed').length,'Sample appointments'],
    ['Completed returns',records.filter((item) => item.status === 'completed').length,'Simulated completed visits']
  ];
  $('#demo-stats').innerHTML = stats.map(([label,value,note]) => `<div class="dashboard-stat"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
}

function renderRecords() {
  const visible = records.filter((item) => (filter === 'all' || (filter === 'due' ? ['due','overdue'].includes(item.status) : item.status === filter)) && `${item.name} ${item.vehicle} ${item.registration}`.toLowerCase().includes(query.toLowerCase()));
  $('#records-list').innerHTML = visible.length ? visible.map((item) => `<button class="record-row ${item.id === selectedId ? 'selected' : ''}" data-record="${item.id}" aria-pressed="${item.id === selectedId}" aria-label="${item.name}, sample customer, ${item.vehicle}, ${statusLabels[item.status]}"><span class="avatar" aria-hidden="true">${item.initials}</span><span><span class="record-name">${item.name} <span class="fine">· sample</span></span><span class="record-vehicle">${item.vehicle} · ${item.registration}</span></span><span class="badge badge-${item.status === 'completed' ? 'confirmed' : item.status}">${statusLabels[item.status]}</span></button>`).join('') : '<p class="empty-records">No sample records match this filter. Try All vehicles or clear the search.</p>';
  $$('.filter-group button').forEach((button) => { const active = button.dataset.filter === filter; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
}

function renderDetail() {
  const item = record();
  let note = 'Last recorded mileage is not a live reading. Staff approve the next service interval.';
  let action = `<button class="button button-dark" data-action="reminder" ${eligible(item) ? '' : 'disabled'}>${item.reminder ? 'Reminder simulated' : 'Preview reminder'} <span aria-hidden="true">↗</span></button>`;
  if (!item.permission || !item.validContact) { note = 'Reminder blocked: contact permission is not recorded for this sample customer. Staff must resolve preferences before sending.'; action = '<button class="button button-outline" disabled>Reminder blocked · permission needed</button>'; }
  if (item.status === 'requested') { note = 'Follow-up is paused while staff review the request. A preferred date is not a confirmed appointment.'; action = '<button class="button button-dark" data-action="confirm">Confirm sample request ✓</button>'; }
  if (item.status === 'confirmed') { note = 'Confirmed in this demo. Obsolete service-due reminders are stopped. A live system would manage appointment reminders separately.'; action = '<button class="button button-dark" data-action="complete">Mark sample visit completed ✓</button>'; }
  if (item.status === 'completed') { note = 'Return visit recorded in the demo. The next service recommendation still needs workshop approval; no interval has been generated automatically.'; action = '<button class="button button-outline" disabled>Return visit recorded</button>'; }
  if (item.id === 'alex') action += '<button class="button button-outline" data-action="customer">Try customer view ↗</button>';
  const requestDetails = item.request ? `<div><dt>${item.status === 'requested' ? 'Preferred visit' : 'Sample appointment'}</dt><dd>${dateLabel(item.request.date)} · ${item.request.time}</dd></div><div><dt>Pickup request</dt><dd>${item.request.pickup ? 'Requested · staff to arrange' : 'Not requested'}</dd></div>` : '';
  $('#record-detail').innerHTML = `<p class="mini-label">SELECTED SAMPLE VEHICLE</p><h4 id="detail-heading" tabindex="-1">${item.vehicle}</h4><p class="detail-meta">${item.name} · ${item.registration} · fictional record</p><dl class="detail-list"><div><dt>Status</dt><dd><span class="badge badge-${item.status === 'completed' ? 'confirmed' : item.status}">${statusLabels[item.status]}</span></dd></div><div><dt>Service</dt><dd>${escapeHTML(item.request?.service || item.service)}</dd></div><div><dt>Recommended by</dt><dd>${dateLabel(item.due)} / ${item.dueKm}</dd></div><div><dt>Last recorded odometer</dt><dd>${item.odometer}<br><small>${dateLabel(addDays(today,-170))}</small></dd></div><div><dt>Contact permission</dt><dd>${item.permission ? 'Recorded · sample only' : 'Not recorded · held'}</dd></div>${requestDetails}</dl><p class="detail-note">${note}</p><div class="detail-actions">${action}</div>`;
}

function renderCustomer() {
  const item = alex();
  $('#customer-due').textContent = dateLabel(item.due);
  $('#customer-odometer-note').textContent = `Last recorded: 72,400 km on ${dateLabel(addDays(today,-170))}. Current mileage has not been checked.`;
  const requested = ['requested','confirmed','completed'].includes(item.status);
  $('#request-booking').disabled = requested;
  $$('#booking-form input, #booking-form select').forEach((input) => { input.disabled = requested; });
  $('#customer-state').textContent = item.status === 'requested' ? 'Request received · awaiting workshop confirmation.' : item.status === 'confirmed' ? 'Appointment confirmed in the demo.' : item.status === 'completed' ? 'Sample visit completed. Thank you for returning.' : 'Your workshop recommendation is ready when you are.';
  $('#booking-result').hidden = !requested;
  if (requested) {
    const title = item.status === 'requested' ? 'Sample request received — not yet confirmed.' : item.status === 'confirmed' ? 'Sample appointment confirmed by the workshop.' : 'Sample return visit completed.';
    $('#booking-result').innerHTML = `<strong>${title}</strong>${dateLabel(item.request.date)} · ${escapeHTML(item.request.time)}<br>${escapeHTML(item.request.service)}${item.request.pickup ? '<br>Pickup requested; arrangements still need staff confirmation.' : ''}<button type="button" id="back-to-workshop">${item.status === 'requested' ? 'Review & confirm in workshop view' : 'Back to workshop view'} ↗</button>`;
  }
}

function render() { renderStats(); renderRecords(); renderDetail(); renderCustomer(); }

function openReminder() {
  const item = record();
  if (!eligible(item)) return;
  reminderRecordId = item.id;
  const bookingLink = item.id === 'alex' ? '<a href="#customer-panel" id="message-customer-link">Request a service ↗</a>' : '<p class="fine" style="margin-top:15px">A customer-specific booking link would appear here. The interactive customer journey below uses Alex’s sample vehicle only.</p>';
  $('#reminder-content').innerHTML = `<div class="message-preview"><p>Hi ${item.name}, your ${item.vehicle} is recommended for its next service by ${dateLabel(item.due)} or ${item.dueKm}, whichever comes first. If you’d like to arrange a visit, request a preferred date and our team will confirm with you.</p>${bookingLink}<p class="fine" style="margin-top:15px">Neale Goad Automotive · (03) 5339 2056<br>Message preferences / opt-out: included in the approved live template.</p></div><div class="reminder-permission">✓ Contact permission recorded in this fictional record.</div>`;
  $('#simulate-reminder').disabled = false;
  $('#simulate-reminder').textContent = 'Simulate reminder';
  $('#view-customer').textContent = item.id === 'alex' ? 'Try customer view ↗' : 'Try Alex’s customer view ↗';
  $('#message-customer-link')?.addEventListener('click', (event) => { event.preventDefault(); $('#reminder-dialog').close(); setView('customer',true); });
  $('#reminder-dialog').showModal();
}

$('#staff-tab').addEventListener('click', () => setView('staff'));
$('#customer-tab').addEventListener('click', () => setView('customer'));
$$('.demo-tabs [role=tab]').forEach((tab) => tab.addEventListener('keydown', (event) => {
  if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); setView(event.key === 'Home' ? 'staff' : event.key === 'End' ? 'customer' : activeView === 'staff' ? 'customer' : 'staff',true); }
}));
$('.filter-group').addEventListener('click', (event) => { const button = event.target.closest('[data-filter]'); if (button) { filter = button.dataset.filter; renderRecords(); } });
$('#sample-search').addEventListener('input', (event) => { query = event.target.value; renderRecords(); });
$('#records-list').addEventListener('click', (event) => { const button = event.target.closest('[data-record]'); if (button) { selectedId = button.dataset.record; renderRecords(); renderDetail(); $(`[data-record="${selectedId}"]`)?.focus({preventScroll:true}); } });
$('#record-detail').addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'reminder') openReminder();
  if (action === 'customer') setView('customer',true);
  if (action === 'confirm' && record().status === 'requested') { record().status = 'confirmed'; render(); $('#detail-heading').focus({preventScroll:true}); announce('Sample appointment confirmed. Duplicate service-due reminders remain stopped. No real booking was made.'); }
  if (action === 'complete' && record().status === 'confirmed') { record().status = 'completed'; render(); $('#detail-heading').focus({preventScroll:true}); announce('Sample return visit completed. The next service date must be approved by workshop staff.'); }
});
$('#close-reminder').addEventListener('click', () => $('#reminder-dialog').close());
$('#view-customer').addEventListener('click', () => { $('#reminder-dialog').close(); setView('customer',true); });
$('#simulate-reminder').addEventListener('click', () => {
  const item = records.find((entry) => entry.id === reminderRecordId);
  if (!item || !eligible(item)) return;
  item.reminder = true;
  $('#simulate-reminder').textContent = 'Simulated · nothing sent';
  $('#simulate-reminder').disabled = true;
  render();
  announce(`Reminder simulated for ${item.name}. No SMS or email was sent. Try the customer view to request a visit.`);
});

$('#booking-date').min = nextWorkday(today);
$('#booking-date').value = nextWorkday(addDays(today, 6));
$('#booking-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!['due','overdue'].includes(alex().status)) return;
  const preferredDate = $('#booking-date').value;
  if (!preferredDate || preferredDate <= today || [0,6].includes(weekday(preferredDate))) { $('#booking-error').textContent = 'For this demo, choose a future Monday–Friday date. The workshop will confirm availability.'; return; }
  $('#booking-error').textContent = '';
  alex().request = {date:preferredDate,time:$('#booking-time').value,service:$('#booking-service').value,pickup:$('#pickup-request').checked};
  alex().status = 'requested';
  selectedId = 'alex';
  render();
  announce('Alex’s sample booking request is awaiting staff confirmation. Follow-up is paused while it is reviewed.');
});
$('#booking-result').addEventListener('click', (event) => {
  if (event.target.closest('#back-to-workshop')) { selectedId = 'alex'; filter = alex().status === 'completed' ? 'all' : alex().status; query = ''; $('#sample-search').value = ''; render(); setView('staff',true); }
});
$('#reset-demo').addEventListener('click', () => {
  records = makeRecords(); selectedId = 'alex'; filter = 'all'; query = ''; reminderRecordId = null;
  $('#sample-search').value = ''; $('#booking-form').reset(); $('#booking-date').value = nextWorkday(addDays(today,6)); $('#booking-error').textContent = '';
  render(); setView('staff'); announce('Demo reset. All records are fictional. No messages or bookings have been sent.');
});

const notesKey = 'nga-customer-care-proposal-notes-v1';
const notesForm = $('#discovery-form');
notesForm.addEventListener('submit', (event) => event.preventDefault());
const noteLabels = {system:'Current workshop software',bookingOwner:'Booking request owner',serviceOwner:'Service interval approval',channel:'First reminder channel',dataPath:'Record connection',pilotGoal:'Primary pilot outcome'};
function getNotes() { return Object.fromEntries(new FormData(notesForm).entries()); }
function notesStatus(message) { $('#notes-status').textContent = message; }
try { const saved = JSON.parse(localStorage.getItem(notesKey) || 'null'); if (saved && typeof saved === 'object') { Object.entries(saved).forEach(([key,value]) => { if (notesForm.elements.namedItem(key) && typeof value === 'string') notesForm.elements.namedItem(key).value = value; }); notesStatus('Saved notes loaded from this device.'); } } catch { /* The notes form works without browser storage. */ }
$('#save-notes').addEventListener('click', () => { try { localStorage.setItem(notesKey,JSON.stringify(getNotes())); notesStatus('Saved on this device only. Nothing submitted.'); } catch { notesStatus('Browser storage is unavailable. Download your notes instead.'); } });
$('#clear-notes').addEventListener('click', () => { notesForm.reset(); try { localStorage.removeItem(notesKey); } catch { /* Reset still works without storage. */ } notesStatus('Notes cleared on this device.'); });
$('#download-notes').addEventListener('click', () => {
  const notes = getNotes();
  const content = ['NEALE GOAD CUSTOMER CARE — DISCOVERY NOTES','Discussion draft; selections are not an approval or contract.','',...Object.keys(noteLabels).map((key) => `${noteLabels[key]}: ${notes[key]?.trim() || 'To confirm'}`),'','Before production: confirm authoritative records, supported integration, staff roles, hours/capacity, contact permissions, approved templates, opt-out handling, SMS sender setup, secure access, running costs and the pilot baseline.','','Proposal demo only. No real customer records or messages are included.'].join('\n');
  const url = URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'neale-goad-discovery-notes.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000);
  notesStatus('Discussion notes downloaded. Nothing submitted.');
});
$('#print-button').addEventListener('click', () => window.print());
render();
