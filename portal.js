'use strict';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dateParts = Object.fromEntries(new Intl.DateTimeFormat('en-AU', {timeZone:'Australia/Melbourne',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(p => p.type !== 'literal').map(p => [p.type,p.value]));
const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
const days = (date, count) => {const d=new Date(`${date}T01:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);};
const labelDate = date => date ? new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'Australia/Melbourne'}).format(new Date(`${date}T01:00:00Z`)) : 'To be arranged';
const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(`${date}T01:00:00Z`).toISOString().slice(0,10) === date;
const km = value => `${Number(value).toLocaleString('en-AU')} km`;
const money = value => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(value);
const id = () => crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const now = () => new Date().toISOString();
const photoSafe = src => typeof src==='string' && (/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(src) || ['assets/example-workshop.png','assets/brake-example.svg'].includes(src));
const stages = ['booked','working','ready','completed'];
const statusLabels = {requested:'Awaiting workshop',booked:'Booked',working:'Mechanic is working',awaiting:'Awaiting',ready:'Ready for pickup',completed:'Completed'};
const statusNotes = {requested:'Your request is with the workshop. A visit is not booked yet.',booked:'Your visit is booked. The workshop will update you when work starts.',working:'Your mechanic is working on the service below.',ready:'Your vehicle is ready. Arrange collection with the workshop.',completed:'This service is complete. You can still message us about it.'};
function seed() {
  return {version:3,vehicles:[{id:'corolla',name:'Toyota Corolla',year:'2018',rego:'DEMO-01',customer:'Alex'},{id:'ranger',name:'Ford Ranger',year:'2020',rego:'DEMO-02',customer:'Alex'}],jobs:[
    {id:'current-brakes',vehicle:'corolla',reference:'NGA-1042',title:'Brake inspection & repair',status:'working',opened:today,appointment:today,odometer:75020,services:['Inspect front brake noise','Check brake pads and discs'],summary:'',completedDate:null,waitingReason:'',addons:[],needsReply:false,recommendation:null,messages:[
      {id:'active-1',role:'customer',type:'text',text:'There is a squeaking noise when I brake. Could you check it?',time:today+'T00:00:00Z'},
      {id:'active-2',role:'workshop',type:'update',text:'Your Corolla is in the workshop. We are checking the front brakes and will update you before any extra work.',time:today+'T00:20:00Z',photos:[{src:'assets/example-workshop.png',caption:'Illustrative workshop photo — not this sample vehicle.'}]}
    ]},
    {id:'corolla-oil',vehicle:'corolla',reference:'NGA-1018',title:'Logbook service',status:'completed',opened:days(today,-14),appointment:days(today,-14),completedDate:days(today,-14),odometer:74210,services:['Engine oil and filter replaced','Fluid levels, tyres and lights checked'],summary:'Scheduled service and safety checks completed.',waitingReason:'',addons:[],needsReply:false,recommendation:{title:'Next logbook service',date:days(today,168),dueKm:84210},messages:[
      {id:'oil-1',role:'workshop',type:'update',text:'Your logbook service is complete. Oil, filter and safety checks done.',time:days(today,-14)+'T01:00:00Z',photos:[]},
      {id:'oil-2',role:'customer',type:'text',text:'Thanks! When is the next service due?',time:days(today,-13)+'T01:00:00Z'},
      {id:'oil-3',role:'workshop',type:'text',text:'By '+labelDate(days(today,168))+' or 84,210 km, whichever comes first.',time:days(today,-13)+'T01:15:00Z'}
    ]},
    {id:'corolla-brakes',vehicle:'corolla',reference:'NGA-0972',title:'Front brake pads replaced',status:'completed',opened:days(today,-70),appointment:days(today,-70),completedDate:days(today,-70),odometer:71640,services:['Front brake pads replaced','Road test completed'],summary:'Front pads replaced after approval. Brakes checked and road tested.',waitingReason:'',addons:[],needsReply:false,recommendation:null,messages:[{id:'brake-1',role:'workshop',type:'update',text:'Front brake pads replaced and road test completed.',time:days(today,-70)+'T01:00:00Z',photos:[{src:'assets/brake-example.svg',caption:'Illustrative brake diagram — not a photo of this sample vehicle.'}]}]},
    {id:'ranger-service',vehicle:'ranger',reference:'NGA-1009',title:'Diesel service',status:'completed',opened:days(today,-35),appointment:days(today,-35),completedDate:days(today,-35),odometer:118600,services:['Oil and filters replaced','Vehicle inspection completed'],summary:'Diesel service completed.',waitingReason:'',addons:[],needsReply:false,recommendation:{title:'Next diesel service',date:days(today,145),dueKm:128600},messages:[{id:'ranger-1',role:'workshop',type:'text',text:'Your diesel service is complete. Let us know if you have a question.',time:days(today,-35)+'T01:00:00Z'}]}
  ]};
}
const storageKey='nga-customer-care-jobs-v3';
function migrateOld() {
  const old=JSON.parse(localStorage.getItem('nga-customer-portal-demo-v2')||'null');
  if (!old || old.version!==2 || !Array.isArray(old.entries)) return seed();
  const result=seed();
  const migrated=old.entries.map(e => ({id:e.id,vehicle:e.vehicle,reference:'NGA-H'+e.id.slice(-5).toUpperCase(),title:e.title,status:e.kind==='completed'?'completed':'working',opened:e.date,appointment:e.date,completedDate:e.kind==='completed'?e.date:null,odometer:e.odometer,services:e.work?.length?e.work:[e.title],summary:e.notes,waitingReason:'',addons:[],needsReply:Boolean(e.needsReply),recommendation:null,messages:[{id:'update-'+e.id,role:'workshop',type:'update',text:e.notes,time:e.date+'T01:00:00Z',photos:e.photos||[]},...(e.comments||[]).map(c=>({...c,type:'text'}))]}));
  const unfinished=new Set([...migrated.filter(j=>j.status!=='completed').map(j=>j.vehicle),...(old.requests||[]).map(r=>r.vehicle)]);
  result.jobs=[...result.jobs.filter(j=>j.status!=='completed'&&!unfinished.has(j.vehicle)),...migrated];
  for (const rec of old.recommendations||[]) {if(!rec.completedEntry){const j=result.jobs.find(j=>j.id===rec.entry);if(j&&!j.recommendation)j.recommendation={title:rec.title,date:rec.date,dueKm:rec.dueKm};}}
  for (const request of old.requests||[]) {
    result.jobs.push({id:request.id,vehicle:request.vehicle,reference:request.reference,title:request.subject,status:request.status==='confirmed'?'booked':'requested',opened:request.created.slice(0,10),appointment:request.appointment?.date||null,appointmentTime:request.appointment?.time||null,preferredDate:request.preferredDate||null,odometer:null,services:[request.subject],summary:'',completedDate:null,waitingReason:'',addons:[],needsReply:request.status==='pending',recommendation:null,messages:[{id:'request-'+request.id,role:'customer',type:'text',text:request.description,time:request.created},...((request.appointment?.time||request.preferredTime||request.pickup)?[{id:'details-'+request.id,role:'system',type:'text',text:[request.appointment?.time?'Confirmed arrival time: '+request.appointment.time:'',request.preferredTime?'Preferred time: '+request.preferredTime:'',request.pickup?'Pickup requested; arrangements need workshop confirmation.':''].filter(Boolean).join(' · '),time:request.created}]:[]),...(request.replies||[]).map(r=>({...r,type:'text'}))]});
  }
  return result;
}
let data;
try {const saved=JSON.parse(localStorage.getItem(storageKey)||'null');data=saved?.version===3&&Array.isArray(saved.vehicles)&&saved.vehicles.length&&Array.isArray(saved.jobs)?saved:migrateOld();} catch {data=seed();}
let role='customer',view='overview',vehicleId=data.vehicles[0].id,selectedJobId=null,requestMode='service',requestOrigin=null,pendingPhotos=[],uploading=false,uploadToken=0,toastTimer;
const drafts=new Map();
const vehicle=()=>data.vehicles.find(v=>v.id===vehicleId);
const jobs=()=>data.jobs.filter(j=>j.vehicle===vehicleId);
const activeJobs=()=>jobs().filter(j=>j.status!=='completed').sort((a,b)=>b.opened.localeCompare(a.opened));
const history=()=>jobs().filter(j=>j.status==='completed').sort((a,b)=>(b.completedDate||b.opened).localeCompare(a.completedDate||a.opened));
const selectedJob=()=>jobs().find(j=>j.id===selectedJobId) || (view==='overview'?activeJobs()[0]:null);
const draftKey=job=>`${role}:${job}`;
const userName=who=>who==='workshop'?'Workshop':who==='system'?'Service update':vehicle().customer;
function notify(text) {clearTimeout(toastTimer);$('#portal-status').textContent=text;$('#portal-status').classList.add('visible');toastTimer=setTimeout(()=>$('#portal-status').classList.remove('visible'),5000);}
function save(text) {try {localStorage.setItem(storageKey,JSON.stringify(data));if(text)notify(text);} catch {notify('Visible for this session. Device storage is unavailable; changes may be lost on refresh.');}}
function addMessage(job,who,text,type='text',extras={}) {job.messages.push({id:id(),role:who,text,type,time:now(),...extras});if(who!=='system')job.needsReply=who==='customer';}
function discardPhotos() {uploadToken++;pendingPhotos=[];uploading=false;}
function pill(job) {return `<span class="status-pill ${esc(job.status)}">${esc(statusLabels[job.status])}</span>`;}
function dateTime(iso) {const date=String(iso).slice(0,10);if(!validDate(date))return '';return labelDate(date)+' · '+new Intl.DateTimeFormat('en-AU',{hour:'numeric',minute:'2-digit',timeZone:'Australia/Melbourne'}).format(new Date(iso));}
function renderHeader() {
  const completed=selectedJob();
  const title=view==='history'?(completed?'Past service':'Service history'):'My Vehicle';
  $('#page-heading').innerHTML=`<h1 tabindex="-1" id="view-title">${title}</h1>${role==='workshop'?'<button type="button" class="button secondary small" data-action="add-vehicle">＋ Link vehicle</button>':''}`;
  $('#account-name').textContent=role==='customer'?`${vehicle().customer}’s vehicles`:'Workshop';
  $('#account-description').textContent=role==='customer'?'Customer view':'Staff view';
  $('#vehicle-name').textContent=vehicle().name;
  $('#vehicle-meta').textContent=`${vehicle().year} · ${vehicle().rego}`;
  $('#vehicle-select').innerHTML=data.vehicles.map(v=>`<option value="${esc(v.id)}" ${v.id===vehicleId?'selected':''}>${esc(v.name)} · ${esc(v.rego)}</option>`).join('');
  $('#overview-label').textContent='My Vehicle';
  const unanswered=history().filter(j=>j.needsReply).length;
  $('#history-count').hidden=role!=='workshop'||!unanswered;
  $('#history-count').textContent=unanswered;
  $$('[data-role]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.role===role)));
  $$('[data-nav]').forEach(b=>{b.classList.toggle('active',b.dataset.nav===view);if(b.dataset.nav===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  document.title=`${title} — Neale Goad Customer Care`;
}
function statusTrack(job) {
  const current=job.status==='awaiting'?1:stages.indexOf(job.status);
  const names=['Booked','In progress','Ready','Completed'];
  return `<ol class="status-track" aria-label="Service progress">${stages.map((s,i)=>`<li class="${current>i?'done':current===i?'current':'future'}" ${current===i?'aria-current="step"':''}><span class="step-dot" aria-hidden="true">${current>i?'✓':i+1}</span><span>${names[i]}</span></li>`).join('')}</ol>`;
}
function workshopControls(job) {
  if(role!=='workshop'||job.status==='completed')return '';
  return `<details class="staff-controls"><summary>Update service status</summary><form class="status-form" data-job="${esc(job.id)}"><div class="field"><label for="job-status">Status</label><select id="job-status" name="status"><option value="requested" ${job.status==='requested'?'selected':''}>Awaiting workshop</option><option value="booked" ${job.status==='booked'?'selected':''}>Booked</option><option value="working" ${job.status==='working'?'selected':''}>Mechanic is working</option><option value="awaiting" ${job.status==='awaiting'?'selected':''}>Awaiting approval / parts</option><option value="ready" ${job.status==='ready'?'selected':''}>Ready for pickup</option><option value="completed">Completed</option></select></div><div class="field status-appointment" ${job.status==='booked'?'':'hidden'}><label for="job-appointment">Agreed visit date</label><input id="job-appointment" type="date" name="appointment" value="${esc(job.appointment||'')}" ${job.status==='booked'?'':'disabled'}></div><div class="field status-waiting" ${job.status==='awaiting'?'':'hidden'}><label for="job-waiting">What are we waiting for?</label><input id="job-waiting" name="waitingReason" maxlength="160" placeholder="e.g. Replacement parts due tomorrow" value="${esc(job.waitingReason||'')}" ${job.status==='awaiting'?'':'disabled'}></div><div class="completion-fields" hidden><div class="field-row"><div class="field"><label for="completion-date">Completed on</label><input id="completion-date" type="date" name="completedDate" value="${today}" max="${today}" disabled></div><div class="field"><label for="completion-km">Odometer (km)</label><input id="completion-km" type="number" name="odometer" min="0" max="2000000" step="1" value="${job.odometer??''}" disabled></div></div><div class="field"><label for="completion-summary">Work completed</label><textarea id="completion-summary" name="summary" rows="2" maxlength="2000" disabled>${esc(job.summary||'')}</textarea></div><details class="optional-details"><summary>Next service <span>Optional</span></summary><div class="field"><label for="next-title">Recommendation</label><input id="next-title" name="nextTitle" maxlength="100" disabled></div><div class="field-row"><div class="field"><label for="next-date">Due date</label><input id="next-date" type="date" name="nextDate" disabled></div><div class="field"><label for="next-km">Or odometer (km)</label><input id="next-km" type="number" name="nextKm" min="0" max="2000000" step="1" disabled></div></div></details></div><p class="form-error" role="alert"></p><button type="submit" class="button primary small">Save status</button></form></details>`;
}
function jobPanel(job) {
  const accepted=job.addons.filter(a=>a.status==='approved');
  const work=job.status==='completed';
  const note=job.status==='awaiting'?`Waiting for: ${job.waitingReason||'Workshop update'}`:statusNotes[job.status];
  const parent=job.parentId?data.jobs.find(j=>j.id===job.parentId):null;
  return `<section class="job-panel panel ${work?'is-completed':''}" aria-label="${work?'Completed service':'Current service'}"><div class="job-top"><span class="eyebrow">${work?'Past service':'Current service'}</span>${pill(job)}</div><h2>${esc(job.title)}</h2><p class="job-reference">${esc(job.reference)}${work?' · '+labelDate(job.completedDate):job.appointment?' · Visit '+labelDate(job.appointment)+(job.appointmentTime?' · '+esc(job.appointmentTime):''):job.preferredDate?' · Requested '+labelDate(job.preferredDate):''}</p>${parent?`<p class="related-job">Follow-up to <button type="button" class="text-button" data-action="open-job" data-id="${esc(parent.id)}">${esc(parent.reference)}</button></p>`:''}${statusTrack(job)}<p class="status-note ${job.status==='awaiting'?'waiting':''}">${esc(note)}</p><div class="service-items"><h3>${work?'Work carried out':'Service requested'}</h3><ul>${job.services.map(s=>`<li>${esc(s)}</li>`).join('')}${accepted.map(a=>`<li>${esc(a.title)} <span class="item-approved">Approved · ${money(a.amount)}</span></li>`).join('')}</ul></div>${work?`<div class="completion-summary"><p>${esc(job.summary)}</p><p class="recorded-km">${km(job.odometer)} recorded</p></div>`:''}${work&&job.recommendation?`<div class="maintenance-card"><h3>${esc(job.recommendation.title)}</h3><p>${job.recommendation.date?labelDate(job.recommendation.date):''}${job.recommendation.dueKm?(job.recommendation.date?' or ':'')+km(job.recommendation.dueKm):''}</p>${job.recommendation.date&&job.recommendation.dueKm?'<small>Whichever comes first</small>':''}</div>`:''}${role==='customer'?`<div class="job-actions"><button type="button" class="button ${work?'secondary':'primary'}" data-action="${work?'follow-up':'additional'}" data-id="${esc(job.id)}">${work?'Request a follow-up service':'＋ Request additional service'}</button></div>`:''}<button type="button" class="text-button chat-shortcut" data-action="chat">Go to conversation ↓</button>${workshopControls(job)}</section>`;
}
function addonHTML(addon,job) {
  const labels={requested:'Extra service requested',quoted:'Your approval needed',approved:'Approved',declined:'Not added',withdrawn:'Quote withdrawn'};
  return `<div class="addon-card ${esc(addon.status)}"><span class="addon-label">${labels[addon.status]}</span><h4>${esc(addon.title)}</h4><p>${esc(addon.description)}</p>${addon.amount!=null?`<p class="quote-price">${money(addon.amount)} <small>AUD · total incl. GST</small></p><p>${esc(addon.scope||'')}</p>`:''}${addon.status==='requested'?role==='workshop'?`<form class="quote-form" data-job="${esc(job.id)}" data-addon="${esc(addon.id)}"><div class="field"><label for="quote-scope-${esc(addon.id)}">Work included</label><textarea id="quote-scope-${esc(addon.id)}" name="scope" rows="2" maxlength="1000" required>${esc(addon.title)}</textarea></div><div class="field"><label for="quote-amount-${esc(addon.id)}">Total quote (AUD, incl. GST)</label><input id="quote-amount-${esc(addon.id)}" name="amount" type="number" min="0" max="100000" step="0.01" required></div><p class="form-error" role="alert"></p><div class="addon-actions"><button type="submit" class="button primary small">Send quote for approval</button><button type="button" class="text-button" data-action="decline-addon" data-job="${esc(job.id)}" data-id="${esc(addon.id)}">Decline request</button></div></form>`:'<p class="addon-hint">The workshop will review this before adding any work.</p>':addon.status==='quoted'?role==='customer'?`<div class="addon-actions"><button type="button" class="button primary small" data-action="approve-addon" data-job="${esc(job.id)}" data-id="${esc(addon.id)}">Approve ${money(addon.amount)}</button><button type="button" class="button secondary small" data-action="decline-addon" data-job="${esc(job.id)}" data-id="${esc(addon.id)}">Decline</button></div><p class="addon-hint">Approves this scope and total for this demo job.</p>`:`<p class="addon-hint">Waiting for the customer’s approval.</p><button type="button" class="text-button" data-action="withdraw-addon" data-job="${esc(job.id)}" data-id="${esc(addon.id)}">Withdraw quote</button>`:addon.status==='approved'?'<p class="addon-hint">Included in this service. Approval saved in this conversation.</p>':''}</div>`;
}
function messageHTML(message,job) {
  if(message.type==='addon') {const addon=job.addons.find(a=>a.id===message.addonId);return addon?`<div class="chat-event">${addonHTML(addon,job)}</div>`:'';}
  if(message.role==='system')return `<p class="chat-system"><span>${esc(message.text)}</span><time>${esc(dateTime(message.time))}</time></p>`;
  return `<article class="chat-message ${esc(message.role)}"><div class="chat-meta"><strong>${esc(userName(message.role))}</strong><time>${esc(dateTime(message.time))}</time></div><p>${esc(message.text)}</p>${message.photos?.length?`<div class="chat-photos">${message.photos.filter(p=>photoSafe(p.src)).map((p,index)=>`<figure><button type="button" class="photo-button" data-action="photo" data-job="${esc(job.id)}" data-message="${esc(message.id)}" data-index="${index}" aria-label="Open workshop photo"><img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy"></button><figcaption>${esc(p.caption)}</figcaption></figure>`).join('')}</div>`:''}</article>`;
}
function chatPanel(job) {
  return `<section class="chat-panel panel" aria-label="Service conversation"><div class="chat-heading"><h2>Chat with ${role==='customer'?'the workshop':vehicle().customer}</h2><p>About this ${job.status==='completed'?'past':'current'} service</p></div><div class="chat-messages" id="chat-messages" tabindex="0" aria-label="Messages for ${esc(job.title)}">${job.messages.map(m=>messageHTML(m,job)).join('')||'<p class="chat-empty">Start the conversation about this service.</p>'}</div><form class="chat-form" data-job="${esc(job.id)}"><label class="sr-only" for="chat-text">Your message</label><textarea id="chat-text" name="message" rows="2" maxlength="2000" required placeholder="${job.status==='completed'?'Have a concern about this service?':'Write a message…'}">${esc(drafts.get(draftKey(job.id))||'')}</textarea><p class="form-error" role="alert"></p><button type="submit" class="button dark">Send message</button></form>${role==='workshop'?`<details class="update-details"><summary>Add a work update or photo</summary><form id="work-update-form" data-job="${esc(job.id)}"><div class="field"><label for="update-notes">Update for the customer</label><textarea id="update-notes" name="notes" rows="2" maxlength="2000" required></textarea></div><div class="field"><label for="update-photos">Photos <small>Up to 3 · max 3 MB each</small></label><input type="file" id="update-photos" accept="image/jpeg,image/png,image/webp" multiple><button type="button" class="text-button" data-action="sample-photo">Try a sample photo</button><div id="upload-preview" class="upload-preview"></div><p id="upload-error" class="form-error" role="alert"></p></div><button id="post-update" type="submit" class="button primary small">Post update</button></form></details>`:''}</section>`;
}
function jobView(job) {return `<div class="job-layout">${jobPanel(job)}${chatPanel(job)}</div>`;}
function overviewHTML() {
  const active=activeJobs();
  if(!active.length) {
    const rec=history().find(j=>j.recommendation)?.recommendation;
    return `<section class="empty-state panel"><span class="empty-icon" aria-hidden="true">✓</span><h2>No current service</h2><p>${role==='customer'?'Your completed visits are in Service History.':'Start a service when the vehicle comes in.'}</p><div class="empty-actions"><button type="button" class="button primary" data-action="new-service">${role==='customer'?'Request a service':'Start a service'}</button><button type="button" class="button secondary" data-nav="history">Service history</button></div>${rec?`<div class="maintenance-card"><h3>${esc(rec.title)}</h3><p>${rec.date?labelDate(rec.date):''}${rec.dueKm?(rec.date?' or ':'')+km(rec.dueKm):''}</p></div>`:''}</section>`;
  }
  const selected=active.find(j=>j.id===selectedJobId)||active[0];selectedJobId=selected.id;
  const otherQuestions=history().filter(j=>j.needsReply);
  return `${role==='workshop'&&otherQuestions.length?`<p class="question-alert"><button type="button" class="text-button" data-action="open-job" data-id="${esc(otherQuestions[0].id)}">${otherQuestions.length} past service${otherQuestions.length>1?'s':''} with a new message ↗</button></p>`:''}${active.length>1?`<div class="job-tabs" aria-label="Active services">${active.map(j=>`<button type="button" data-action="open-job" data-id="${esc(j.id)}" aria-pressed="${j.id===selected.id}">${esc(j.title)}</button>`).join('')}</div>`:''}${jobView(selected)}`;
}
function historyHTML() {
  const selected=jobs().find(j=>j.id===selectedJobId&&j.status==='completed');
  if(selected)return `<button type="button" class="text-button back-link" data-action="history-list">← All past services</button>${jobView(selected)}`;
  const items=history();
  return `<div class="history-list">${items.length?items.map(j=>`<article class="history-card panel"><div class="history-date">${labelDate(j.completedDate||j.opened)}</div><div class="history-description"><h2>${esc(j.title)}</h2><p>${km(j.odometer)} · Completed${j.needsReply&&role==='workshop'?' · New message':''}</p></div><button type="button" class="button secondary" data-action="open-job" data-id="${esc(j.id)}">View service & chat ↗</button></article>`).join(''):'<section class="empty-state panel"><h2>No past services yet</h2><p>Completed work will appear here with its photos and conversation.</p></section>'}</div>`;
}
function render(focus=false,scrollChat=false) {
  renderHeader();
  $('#view-overview').hidden=view!=='overview';$('#view-history').hidden=view!=='history';
  $('#view-overview').innerHTML=view==='overview'?overviewHTML():'';
  $('#view-history').innerHTML=view==='history'?historyHTML():'';
  if(role==='workshop')renderUploads();
  if(scrollChat&&$('#chat-messages'))$('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;
  if(focus){$('#view-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function openJob(jobId) {const job=jobs().find(j=>j.id===jobId);if(!job)return;discardPhotos();selectedJobId=job.id;view=job.status==='completed'?'history':'overview';render(true,true);}
function setView(next) {view=next==='history'?'history':'overview';selectedJobId=null;discardPhotos();render(true);}
function openRequest(mode='service',originId=null) {
  const origin=jobs().find(j=>j.id===originId);
  if(mode==='additional'&&(!origin||origin.status==='completed'||role!=='customer'))return;
  if(mode!=='additional'&&activeJobs().length){openJob(activeJobs()[0].id);notify('There is already a current service. Request additional work in its conversation.');return;}
  requestMode=mode;requestOrigin=origin?.id||null;
  $('#service-request-form').reset();$('#request-error').textContent='';
  $('#request-title').textContent=mode==='additional'?'Request additional service':role==='workshop'?'Start a service':mode==='follow-up'?'Request a follow-up service':'Request a service';
  $('#request-context').textContent=vehicle().name+' · '+vehicle().rego+(origin?' · '+origin.reference:'');
  $('#request-subject').placeholder=mode==='additional'?'e.g. Air conditioning check':'e.g. Logbook service or brake noise';
  $('#visit-preference').hidden=mode==='additional'||role==='workshop';
  $('#request-date').disabled=mode==='additional'||role==='workshop';
  $('#request-date').min=today;
  $('#request-explanation').textContent=mode==='additional'?'The workshop will review your request. Any quote needs your approval before the work is added.':role==='workshop'?'Creates a service in progress for this linked vehicle.':'The workshop will confirm the visit. Sending this request does not make a booking.';
  $('#send-request').textContent=role==='workshop'?'Start service':'Send request';
  $('#request-dialog').showModal();
}
function renderUploads() {
  const target=$('#upload-preview');if(!target)return;
  target.innerHTML=pendingPhotos.map((p,i)=>`<figure><img src="${esc(p.src)}" alt="${esc(p.caption)}"><button type="button" class="text-button" data-action="remove-upload" data-index="${i}">Remove</button></figure>`).join('');
  $('#update-photos').disabled=uploading;
  $$('[data-action="sample-photo"],[data-action="remove-upload"]').forEach(b=>b.disabled=uploading);
  $('#post-update').disabled=uploading;$('#post-update').textContent=uploading?'Preparing photos…':'Post update';
}
function readPhoto(file) {return new Promise((resolve,reject)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return reject(new Error('Choose JPG, PNG or WebP images.'));
  if(file.size>3*1024*1024)return reject(new Error('Each photo must be 3 MB or smaller.'));
  const reader=new FileReader();reader.onerror=()=>reject(new Error('Photo could not be read.'));reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('Unreadable image.'));img.onload=()=>{try {const scale=Math.min(1,1200/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const src=canvas.toDataURL('image/jpeg',.8);if(src.length>900000)throw new Error('Choose a smaller image for this demo.');resolve({src,caption:'Workshop sample upload · '+file.name.slice(0,80)});}catch(e){reject(e);}};img.src=reader.result;};reader.readAsDataURL(file);
});}
function setStatusFields(form) {
  const status=form.elements.status.value;
  [['.status-appointment',status==='booked'],['.status-waiting',status==='awaiting'],['.completion-fields',status==='completed']].forEach(([selector,enabled])=>{const group=form.querySelector(selector);group.hidden=!enabled;group.querySelectorAll('input,textarea').forEach(i=>i.disabled=!enabled);});
}

document.addEventListener('click',event=>{
  const roleButton=event.target.closest('[data-role]');if(roleButton){role=roleButton.dataset.role;discardPhotos();render(false,true);return;}
  const nav=event.target.closest('[data-nav]');if(nav){setView(nav.dataset.nav);return;}
  const closer=event.target.closest('[data-close]');if(closer){$('#'+closer.dataset.close).close();return;}
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='open-job')openJob(button.dataset.id);
  if(action==='history-list')setView('history');
  if(action==='chat'){$('.chat-panel')?.scrollIntoView({behavior:'smooth',block:'start'});$('#chat-text')?.focus({preventScroll:true});}
  if(action==='new-service')openRequest();
  if(action==='additional')openRequest('additional',button.dataset.id);
  if(action==='follow-up')openRequest('follow-up',button.dataset.id);
  if(action==='add-vehicle'&&role==='workshop'){$('#vehicle-form').reset();$('#vehicle-error').textContent='';$('#vehicle-dialog').showModal();}
  if(['approve-addon','decline-addon','withdraw-addon'].includes(action)){
    const job=jobs().find(j=>j.id===button.dataset.job);const addon=job?.addons.find(a=>a.id===button.dataset.id);if(!job||job.status==='completed'||!addon)return;
    if(action==='approve-addon'&&(role!=='customer'||addon.status!=='quoted'))return;
    if(action==='withdraw-addon'&&(role!=='workshop'||addon.status!=='quoted'))return;
    if(action==='decline-addon'&&!((role==='customer'&&addon.status==='quoted')||(role==='workshop'&&addon.status==='requested')))return;
    addon.status=action==='approve-addon'?'approved':action==='withdraw-addon'?'withdrawn':'declined';addon.decidedAt=now();
    addMessage(job,role,addon.status==='approved'?`Approved: ${addon.title} — ${money(addon.amount)} total (AUD incl. GST). Scope: ${addon.scope}`:addon.status==='withdrawn'?`Workshop withdrew the quote for ${addon.title}. This extra work is not included.`:`${role==='customer'?'Declined the quote':'Declined the extra service request'}: ${addon.title}.`);
    render(false,true);save(addon.status==='approved'?'Extra service approved and added.':'Extra service was not added.');
  }
  if(action==='sample-photo'&&role==='workshop'&&!uploading){if(pendingPhotos.length>=3){$('#upload-error').textContent='Up to 3 photos per update.';return;}pendingPhotos.push({src:'assets/example-workshop.png',caption:'Illustrative workshop photo — not this sample vehicle.'});renderUploads();}
  if(action==='remove-upload'&&!uploading){pendingPhotos.splice(Number(button.dataset.index),1);renderUploads();}
  if(action==='photo'){
    const job=jobs().find(j=>j.id===button.dataset.job);const m=job?.messages.find(m=>m.id===button.dataset.message);const p=m?.photos?.[Number(button.dataset.index)];
    if(p&&photoSafe(p.src)){$('#full-photo').src=p.src;$('#full-photo').alt=p.caption;$('#full-photo-caption').textContent=p.caption;$('#photo-dialog').showModal();}
  }
});
$('#vehicle-select').addEventListener('change',event=>{vehicleId=event.target.value;selectedJobId=null;discardPhotos();render(true);});
$('#open-help').addEventListener('click',()=>$('#help-dialog').showModal());
$('#reset-portal').addEventListener('click',()=>{data=seed();vehicleId=data.vehicles[0].id;selectedJobId=null;view='overview';role='customer';drafts.clear();discardPhotos();render(true);save('Sample service restored.');});
document.addEventListener('input',event=>{if(event.target.id==='chat-text'){const job=selectedJob();if(job)drafts.set(draftKey(job.id),event.target.value);}});
document.addEventListener('change',async event=>{
  if(event.target.id==='job-status')setStatusFields(event.target.form);
  if(event.target.id==='update-photos'){
    if(uploading)return;const token=++uploadToken,context=selectedJob()?.id,files=[...event.target.files];$('#upload-error').textContent='';
    if(files.length+pendingPhotos.length>3){$('#upload-error').textContent='Up to 3 photos per update.';event.target.value='';return;}
    uploading=true;renderUploads();
    try{const prepared=[];for(const file of files)prepared.push(await readPhoto(file));if(token===uploadToken&&context===selectedJob()?.id&&role==='workshop')pendingPhotos.push(...prepared);}catch(e){if(token===uploadToken&&$('#upload-error'))$('#upload-error').textContent=e.message;}
    if(token===uploadToken){uploading=false;if($('#update-photos'))$('#update-photos').value='';renderUploads();}
  }
});
document.addEventListener('submit',event=>{
  const form=event.target;event.preventDefault();
  if(form.id==='service-request-form'){
    const title=$('#request-subject').value.trim(),description=$('#request-description').value.trim(),preferredDate=$('#request-date').disabled?'':$('#request-date').value;
    if(!title||!description){$('#request-error').textContent='Add a service and a short message.';return;}
    if(preferredDate&&(!validDate(preferredDate)||preferredDate<today)){$('#request-error').textContent='Choose today or a future date.';return;}
    if(requestMode==='additional'){
      const job=jobs().find(j=>j.id===requestOrigin&&j.status!=='completed');if(role!=='customer'||!job)return;
      const addon={id:id(),title,description,status:'requested',amount:null,scope:'',requestedAt:now()};job.addons.push(addon);addMessage(job,'customer','', 'addon',{addonId:addon.id});selectedJobId=job.id;view='overview';
    } else {
      if(activeJobs().length){$('#request-error').textContent='This vehicle already has a current service. Add extra work to that service.';return;}
      const job={id:id(),vehicle:vehicleId,reference:'NGA-D'+String(data.jobs.length+1).padStart(3,'0'),title,status:role==='workshop'?'working':'requested',opened:today,appointment:null,preferredDate:preferredDate||null,odometer:history()[0]?.odometer??null,services:[title],summary:'',completedDate:null,waitingReason:'',addons:[],needsReply:role==='customer',recommendation:null,parentId:requestMode==='follow-up'?requestOrigin:null,messages:[]};
      addMessage(job,role,description);data.jobs.unshift(job);selectedJobId=job.id;view='overview';
    }
    $('#request-dialog').close();discardPhotos();render(true,true);save(requestMode==='additional'?'Extra service requested. Awaiting workshop review.':role==='workshop'?'Service started.':'Request sent in this demo. Awaiting workshop confirmation.');
  }
  if(form.matches('.chat-form')){
    const job=jobs().find(j=>j.id===form.dataset.job);if(!job)return;const text=form.elements.message.value.trim();if(!text){form.querySelector('.form-error').textContent='Write a message first.';return;}
    addMessage(job,role,text);drafts.delete(draftKey(job.id));discardPhotos();render(false,true);$('#chat-text').focus({preventScroll:true});save('Message added.');
  }
  if(form.matches('.quote-form')){
    if(role!=='workshop')return;const job=jobs().find(j=>j.id===form.dataset.job&&j.status!=='completed');const addon=job?.addons.find(a=>a.id===form.dataset.addon&&a.status==='requested');if(!addon)return;
    const scope=form.elements.scope.value.trim(),raw=form.elements.amount.value,amount=Number(raw);
    if(!scope||raw===''||!Number.isFinite(amount)||amount<0||amount>100000){form.querySelector('.form-error').textContent='Add the included work and a valid total quote.';return;}
    addon.scope=scope;addon.amount=Math.round(amount*100)/100;addon.status='quoted';addon.quotedAt=now();addMessage(job,'workshop',`Quote sent for ${addon.title}: ${money(addon.amount)} total (AUD incl. GST). Please review the work and approve or decline.`);discardPhotos();render(false,true);save('Quote sent for customer approval.');
  }
  if(form.matches('.status-form')){
    if(role!=='workshop')return;const job=jobs().find(j=>j.id===form.dataset.job&&j.status!=='completed');if(!job)return;
    const next=form.elements.status.value,error=form.querySelector('.form-error');if(!Object.hasOwn(statusLabels,next))return;
    const waiting=form.elements.waitingReason.value.trim();
    if(next==='awaiting'&&!waiting){error.textContent='Explain what the service is waiting for.';return;}
    if(next==='booked'){const date=form.elements.appointment.value;if(!validDate(date)){error.textContent='Add the agreed visit date.';return;}if(date!==job.appointment)job.appointmentTime=null;job.appointment=date;}
    if(next==='completed'){
      if(job.addons.some(a=>['requested','quoted'].includes(a.status))){error.textContent='Resolve pending extra service requests or quotes before completing this service.';return;}
      const date=form.elements.completedDate.value,raw=form.elements.odometer.value,odo=Number(raw),summary=form.elements.summary.value.trim();
      if(!validDate(date)||date<job.opened||date>today||raw===''||!Number.isInteger(odo)||odo<0||odo>2000000||!summary){error.textContent='Add the completion date, odometer and work completed. The date must be between the request and today.';return;}
      if(job.odometer!=null&&odo<job.odometer){error.textContent='The completion odometer cannot be below the recorded reading.';return;}
      const nextTitle=form.elements.nextTitle.value.trim(),nextDate=form.elements.nextDate.value,nextKm=form.elements.nextKm.value;
      if((nextTitle||nextDate||nextKm)&&(!nextTitle||(!nextDate&&!nextKm))){error.textContent='For next service, add a title and date or odometer.';return;}
      if(nextDate&&(!validDate(nextDate)||nextDate<=date)){error.textContent='Next service must be after this completion date.';return;}
      if(nextKm&&(!Number.isInteger(Number(nextKm))||Number(nextKm)<=odo||Number(nextKm)>2000000)){error.textContent='Next service odometer must be greater than the completed reading.';return;}
      job.completedDate=date;job.odometer=odo;job.summary=summary;job.recommendation=nextTitle?{title:nextTitle,date:nextDate||null,dueKm:nextKm?Number(nextKm):null}:null;
    }
    job.status=next;job.waitingReason=next==='awaiting'?waiting:'';addMessage(job,'system',next==='awaiting'?'Service paused: '+waiting:next==='completed'?'Service completed. This conversation is now saved in Service History.':'Status updated: '+statusLabels[next]+(next==='booked'?' · '+labelDate(job.appointment):''));
    if(next==='completed')view='history';discardPhotos();render(true,true);save(next==='completed'?'Service moved to history. The same chat is still available.':'Service status updated.');
  }
  if(form.id==='work-update-form'){
    if(role!=='workshop'||uploading)return;const job=jobs().find(j=>j.id===form.dataset.job);const text=form.elements.notes.value.trim();if(!job||!text)return;
    addMessage(job,'workshop',text,'update',{photos:pendingPhotos.map(p=>({...p}))});discardPhotos();render(false,true);save('Work update and photos added to this conversation.');
  }
  if(form.id==='vehicle-form'){
    if(role!=='workshop')return;const name=$('#new-vehicle-name').value.trim(),year=$('#new-vehicle-year').value,rego=$('#new-vehicle-rego').value.trim().toUpperCase(),error=$('#vehicle-error');
    if(!name||!rego||!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>Number(dateParts.year)+1){error.textContent='Add the model, year and sample registration.';return;}
    if(data.vehicles.some(v=>v.rego.replace(/\s/g,'')===rego.replace(/\s/g,''))){error.textContent='This registration is already linked.';return;}
    const newVehicle={id:id(),name,year,rego,customer:'Alex'};data.vehicles.push(newVehicle);vehicleId=newVehicle.id;view='overview';selectedJobId=null;$('#vehicle-dialog').close();discardPhotos();render(true);save('Sample vehicle linked to Alex’s account by the workshop.');
  }
});
render();
