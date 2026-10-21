'use strict';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Melbourne',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
const today = `${parts.year}-${parts.month}-${parts.day}`;
const days = (date, count) => {const value=new Date(`${date}T01:00:00Z`);value.setUTCDate(value.getUTCDate()+count);return value.toISOString().slice(0,10);};
const labelDate = (value) => value ? new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'Australia/Melbourne'}).format(new Date(`${value}T01:00:00Z`)) : 'Not set';
const dayNumber = (value) => new Date(`${value}T01:00:00Z`).getUTCDay();
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T01:00:00Z`).toISOString().slice(0,10)===value;
const km = (value) => `${Number(value).toLocaleString('en-AU')} km`;
const newId = () => crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const vehicles = [{id:'corolla',name:'Toyota Corolla',year:'2018',rego:'DEMO-01',customer:'Alex'},{id:'ranger',name:'Ford Ranger',year:'2020',rego:'DEMO-02',customer:'Alex'}];
const seed = () => ({version:2,entries:[
  {id:'corolla-oil',vehicle:'corolla',kind:'completed',title:'Logbook service & inspection',date:days(today,-14),odometer:74210,notes:'Scheduled service completed. Oil, filter and safety checks done.',work:['Engine oil and filter replaced','Fluid levels, tyres and lights checked','Inspection results explained to the customer'],photos:[{src:'assets/example-workshop.png',caption:'Example image from the workshop website — not this sample vehicle.'}],comments:[{id:'comment-seed-1',role:'customer',text:'Thanks for the update. When should I book the next service?',time:days(today,-13)+'T00:00:00Z'},{id:'comment-seed-2',role:'workshop',text:'The next recommendation is listed above: '+labelDate(days(today,168))+' or 84,210 km, whichever comes first. Let us know when you would like to arrange a visit.',time:days(today,-13)+'T00:15:00Z'}],needsReply:false},
  {id:'corolla-brakes',vehicle:'corolla',kind:'completed',title:'Front brake pads replaced',date:days(today,-70),odometer:71640,notes:'Front brake pads replaced after approval. Brakes checked and road tested.',work:['Front brake pads replaced','Brake condition checked','Road test completed'],photos:[{src:'assets/brake-example.svg',caption:'Illustrative brake diagram — not a repair photo of this sample vehicle.'}],comments:[],needsReply:false},
  {id:'ranger-service',vehicle:'ranger',kind:'completed',title:'Diesel service & inspection',date:days(today,-35),odometer:118600,notes:'Diesel service and vehicle inspection completed.',work:['Oil and filters replaced','Vehicle inspection recorded'],photos:[],comments:[],needsReply:false}
],recommendations:[
  {id:'rec-oil',vehicle:'corolla',entry:'corolla-oil',title:'Next logbook service',date:days(today,168),dueKm:84210,notes:'Workshop-set sample interval. Book by the date or mileage, whichever comes first.'},
  {id:'rec-brakes',vehicle:'corolla',entry:'corolla-brakes',title:'Brake condition recheck',date:days(today,28),dueKm:null,notes:'A follow-up inspection recommendation, not another completed repair or a diagnosis.'},
  {id:'rec-diesel',vehicle:'ranger',entry:'ranger-service',title:'Next diesel service',date:days(today,145),dueKm:128600,notes:'Workshop-set sample recommendation. The actual schedule needs the workshop’s approval.'}
],requests:[]});
const storageKey='nga-customer-portal-demo-v2';
let store;
try {const saved=JSON.parse(localStorage.getItem(storageKey)||'null');store=saved?.version===2&&Array.isArray(saved.entries)&&Array.isArray(saved.requests)&&Array.isArray(saved.recommendations)?saved:seed();} catch {store=seed();}
let role='customer',view='overview',vehicleId='corolla',pendingPhotos=[],uploading=false,uploadRun=0,toastTimer;
const drafts=new Map();
const draftKey=(type,id)=>`${type}:${role}:${id}`;
function discardUploads(){uploadRun++;uploading=false;pendingPhotos=[];}
const openThreads=new Set();
const openEntries=new Set();
const currentVehicle=()=>vehicles.find(v=>v.id===vehicleId);
const entries=()=>store.entries.filter(e=>e.vehicle===vehicleId).sort((a,b)=>b.date.localeCompare(a.date));
const recommendations=()=>store.recommendations.filter(r=>r.vehicle===vehicleId&&!r.completedEntry).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
const requests=()=>store.requests.filter(r=>r.vehicle===vehicleId).sort((a,b)=>b.created.localeCompare(a.created));
const latestService=()=>entries().find(e=>e.kind==='completed');
const safePhoto=(source)=>typeof source==='string'&&(/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(source)||['assets/example-workshop.png','assets/brake-example.svg'].includes(source));
function message(text){clearTimeout(toastTimer);$('#portal-status').textContent=text;$('#portal-status').classList.add('visible');toastTimer=setTimeout(()=>$('#portal-status').classList.remove('visible'),6500);}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(store));return true;}catch{message('This change is visible for this session, but browser storage is full or unavailable. It may disappear on refresh.');return false;}}
function commit(text){if(save())message(text+' Saved on this browser only.');}
const statusPill=(text,color='grey')=>`<span class="status-pill ${color}">${esc(text)}</span>`;
const requestLabels={pending:'Awaiting workshop',replied:'Workshop replied',discussion:'Quote discussion',confirmed:'Appointment confirmed'};
const commentAuthor=(who)=>who==='workshop'?'Workshop team':'Alex';
const createdLabel=(iso)=>{const date=String(iso).slice(0,10);return validDate(date)?labelDate(date):'Demo update';};

function renderHeader(){
  const titles={overview:role==='customer'?'My garage':'Workshop',history:'Service history',requests:'Messages',workshop:'Add service update'};
  $('#page-heading').innerHTML=`<div><h1 tabindex="-1" id="view-title">${titles[view]}</h1></div><div class="heading-actions">${role==='customer'?'<button type="button" class="button primary" data-action="new-request">Ask the workshop <span aria-hidden="true">↗</span></button>':view!=='workshop'?'<button type="button" class="button primary" data-action="post">＋ Add update</button>':''}</div>`;
  $('#vehicle-name').textContent=currentVehicle().name;
  $('#vehicle-meta').textContent=`${currentVehicle().year} · ${currentVehicle().rego}`;
  $('#vehicle-select').value=vehicleId;
  $('#account-name').textContent=role==='customer'?'Alex’s garage':'Workshop team';
  $('#account-description').textContent=role==='customer'?'Customer view':'Staff view';
  $('#overview-label').textContent=role==='customer'?'My garage':'Overview';
  $('#post-navigation').hidden=role!=='workshop';
  const waiting=requests().filter(r=>r.status==='pending').length;
  $('#request-count').textContent=String(waiting);
  $('#request-count').hidden=!waiting;
  $$('[data-role]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.role===role)));
  $$('[data-nav]').forEach(b=>{const active=b.dataset.nav===view;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  document.title=`${titles[view]} — Neale Goad Customer Care`;
}
function recommendationHTML(rec){
  return `<article class="recommendation-row"><div><h3>${esc(rec.title)}</h3><p>${rec.date?labelDate(rec.date):'Date to be agreed'}${rec.dueKm?' or '+km(rec.dueKm):''}${rec.date&&rec.date<today?' · Overdue':''}</p></div>${role==='customer'?`<button type="button" class="button secondary small" data-action="ask-recommendation" data-id="${esc(rec.id)}">Enquire</button>`:''}</article>`;
}
function photoHTML(photo,entryId,index){
  if(!safePhoto(photo.src))return '';
  return `<figure><button type="button" class="photo-button" data-action="photo" data-id="${esc(entryId)}" data-index="${index}" aria-label="View photo ${index+1} for this service"><img src="${esc(photo.src)}" alt="${esc(photo.caption)}" loading="lazy"></button><figcaption>${esc(photo.caption)}</figcaption></figure>`;
}
function threadHTML(entry){
  const comments=entry.comments||[];
  return `<div class="thread" id="thread-${esc(entry.id)}" ${openThreads.has(entry.id)?'':'hidden'}><h4 class="thread-title" tabindex="-1">Comments</h4>${comments.length?comments.map(c=>`<div class="comment ${c.role==='workshop'?'staff':''}"><div class="comment-meta"><strong>${commentAuthor(c.role)}</strong><time>${createdLabel(c.time)}</time></div><p>${esc(c.text)}</p></div>`).join(''):'<p class="empty-comment">Ask a question about this service.</p>'}<form class="comment-form" data-entry="${esc(entry.id)}"><label for="comment-${esc(entry.id)}">${role==='customer'?'Ask about this work':'Reply as the workshop'}</label><textarea id="comment-${esc(entry.id)}" name="comment" rows="2" maxlength="1500" required placeholder="${role==='customer'?'Write your question or comment…':'Write a helpful reply…'}">${esc(drafts.get(draftKey('comment',entry.id))||'')}</textarea><button type="submit" class="button ${role==='customer'?'dark':'primary'} small">${role==='customer'?'Send comment':'Reply'} ↗</button><p class="form-error" role="alert"></p></form></div>`;
}
function entryHTML(entry){
  const linked=store.recommendations.filter(r=>r.entry===entry.id);
  const date=new Date(`${entry.date}T01:00:00Z`);
  return `<article class="service-entry" id="entry-${esc(entry.id)}"><details class="service-record" data-entry-details="${esc(entry.id)}" ${openEntries.has(entry.id)?'open':''}><summary class="service-summary"><span class="record-date"><strong>${date.getUTCDate()}</strong><span>${new Intl.DateTimeFormat('en-AU',{month:'short',year:'numeric',timeZone:'Australia/Melbourne'}).format(date)}</span></span><span class="record-heading"><h3>${esc(entry.title)}</h3><span class="record-meta">${km(entry.odometer)} · ${entry.kind==='completed'?'Completed':'Progress update'}${entry.needsReply?' · New question':''}${entry.photos?.length?' · '+entry.photos.length+' photo'+(entry.photos.length>1?'s':''):''}</span></span><span class="record-toggle"><span class="when-closed">View details</span><span class="when-open">Close</span><span aria-hidden="true">⌄</span></span></summary><div class="entry-body"><p>${esc(entry.notes)}</p>${entry.work?.length?`<ul class="work-list">${entry.work.map(work=>`<li>${esc(work)}</li>`).join('')}</ul>`:''}${entry.photos?.length?`<div class="photo-grid">${entry.photos.map((photo,index)=>photoHTML(photo,entry.id,index)).join('')}</div>`:''}${linked.length?`<div class="entry-recommendations"><h4>Recommended after this visit</h4>${linked.map(r=>`<p><strong>${esc(r.title)}</strong><br>${r.completedEntry?'Completed in a later service':(r.date?labelDate(r.date):'Date to agree')+(r.dueKm?' or '+km(r.dueKm):'')}${!r.completedEntry&&r.date&&r.dueKm?' · whichever comes first':''}</p>`).join('')}</div>`:''}</div><footer class="entry-footer"><span>Added by the workshop</span><button type="button" class="comment-toggle text-button" data-action="thread" data-id="${esc(entry.id)}" aria-expanded="${openThreads.has(entry.id)}" aria-controls="thread-${esc(entry.id)}">${openThreads.has(entry.id)?'Hide comments':'Comments'} (${entry.comments?.length||0})</button></footer>${threadHTML(entry)}</details></article>`;
}
function overviewHTML(){
  const latest=latestService(),recs=recommendations(),items=entries(),next=recs[0],questions=items.filter(e=>e.needsReply);
  return `${role==='workshop'&&questions.length?`<p class="question-alert"><button type="button" class="text-button" data-action="questions">${questions.length} service question${questions.length>1?'s':''} to answer ↗</button></p>`:''}<div class="overview-grid"><article class="panel next-service"><p class="eyebrow">Last service</p><h2>${latest?labelDate(latest.date):'No service yet'}</h2><h3>${latest?esc(latest.title):'Your workshop will add it here.'}</h3><p>${latest?km(latest.odometer):''}</p>${latest?`<button type="button" class="text-button" data-action="record" data-id="${esc(latest.id)}">View service & photos ↗</button>`:''}</article><article class="panel next-service next-recommendation"><p class="eyebrow">Next due</p><h2>${next?.date?labelDate(next.date):next?.dueKm?km(next.dueKm):'Nothing scheduled'}</h2><h3>${esc(next?.title||'Your workshop will advise you.')}</h3><p>${next?.date&&next?.dueKm?'or '+km(next.dueKm)+' · whichever comes first':next?'Workshop recommendation':''}</p>${next&&role==='customer'?`<button type="button" class="text-button" data-action="ask-recommendation" data-id="${esc(next.id)}">Request this service ↗</button>`:''}</article></div>${recs.length>1?`<details class="upcoming-details"><summary>Other recommended work <span>${recs.length-1}</span></summary><div class="upcoming-list">${recs.slice(1).map(recommendationHTML).join('')}</div></details>`:''}<div class="section-heading"><h2>Recent visits</h2><button type="button" class="text-button" data-action="history">View all ↗</button></div><div class="timeline">${items.slice(0,2).map(entryHTML).join('')||'<div class="empty-state">Your workshop will add service updates here.</div>'}</div>`;
}
function historyHTML(){const items=entries();return `<p class="view-intro">${items.length} visits · Open a visit for work, photos and comments.</p><div class="timeline">${items.map(entryHTML).join('')||'<div class="empty-state">No service records yet.</div>'}</div>`;}
function requestHTML(request){
  return `<article class="request-card" id="request-${esc(request.id)}"><header class="request-header"><div><p class="eyebrow">${esc(request.reference)} · ${request.kind==='question'?'CUSTOMER QUESTION':'SERVICE / REPAIR REQUEST'}</p><h3>${esc(request.subject)}</h3></div>${statusPill(requestLabels[request.status],request.status==='confirmed'?'green':request.status==='pending'?'amber':'blue')}</header><div class="request-meta"><span>${esc(currentVehicle().name)} · ${esc(currentVehicle().rego)}</span><span>Opened ${createdLabel(request.created)}</span></div><div class="request-body"><p>${esc(request.description)}</p>${request.preferredDate?`<p><strong>Customer preference:</strong> ${labelDate(request.preferredDate)} · ${esc(request.preferredTime)}. ${request.status!=='confirmed'?'Not confirmed yet.':''}</p>`:''}${request.pickup?'<p>Pickup requested · awaiting confirmation.</p>':''}${request.appointment?`<div class="appointment-note"><strong>Confirmed in this demo:</strong> ${labelDate(request.appointment.date)} · ${esc(request.appointment.time)}. No real slot is reserved.</div>`:''}</div><div class="reply-list">${request.replies.length?request.replies.map(reply=>`<div class="reply ${reply.role==='workshop'?'staff':''}"><div class="comment-meta"><strong>${commentAuthor(reply.role)}</strong><time>${createdLabel(reply.time)}</time></div><p>${esc(reply.text)}</p></div>`).join(''):'<p class="empty-comment">Awaiting a reply from the workshop.</p>'}</div><form class="reply-form" data-request="${esc(request.id)}"><div class="field"><label for="reply-${esc(request.id)}">${role==='workshop'?'Reply to the customer':'Your message'}</label><textarea id="reply-${esc(request.id)}" name="reply" rows="2" maxlength="1500" required placeholder="Write a message…">${esc(drafts.get(draftKey('reply',request.id))||'')}</textarea></div>${role==='workshop'?`<div class="field"><label for="status-${esc(request.id)}">Request status</label><select id="status-${esc(request.id)}" name="status" data-request-status><option value="replied" ${request.status==='replied'?'selected':''}>Workshop replied</option><option value="discussion" ${request.status==='discussion'?'selected':''}>Quote discussion</option><option value="confirmed" ${request.status==='confirmed'?'selected':''}>Confirm appointment</option><option value="pending">Awaiting workshop</option></select></div><div class="field-row appointment-fields" ${request.status==='confirmed'?'':'hidden'}><div class="field"><label for="confirm-date-${esc(request.id)}">Confirmed date</label><input type="date" id="confirm-date-${esc(request.id)}" name="confirmedDate" ${request.status==='confirmed'?'':'disabled'} value="${esc(request.appointment?.date||request.preferredDate||'')}"></div><div class="field"><label for="confirm-time-${esc(request.id)}">Confirmed arrival time</label><input type="time" id="confirm-time-${esc(request.id)}" name="confirmedTime" ${request.status==='confirmed'?'':'disabled'} value="${esc(request.appointment?.time||'')}"></div></div>`:''}<p class="form-error" role="alert"></p><button type="submit" class="button ${role==='workshop'?'primary':'dark'} small">${role==='workshop'?'Send reply':'Send message'} ↗</button></form></article>`;
}
function requestsHTML(){const items=requests();return `<div class="requests-list">${items.length?items.map(requestHTML).join(''):`<div class="empty-state"><span class="empty-icon" aria-hidden="true">↔</span><h2>No messages yet</h2><p>Ask about a repair, a quote or your next service.</p>${role==='customer'?'<button type="button" class="button primary" data-action="new-request">Start a conversation</button>':'<p>Customer requests will appear here.</p>'}</div>`}</div>`;}
function composerHTML(){
  return `<div class="workshop-grid"><form class="panel composer" id="workshop-post-form"><div class="field"><label for="post-title">What was done?</label><input id="post-title" name="title" maxlength="100" placeholder="e.g. Front brake pads replaced" required></div><div class="field-row"><div class="field"><label for="post-date">Date</label><input type="date" id="post-date" name="date" value="${today}" max="${today}" required></div><div class="field"><label for="post-odometer">Odometer (km)</label><input type="number" id="post-odometer" name="odometer" min="0" max="2000000" step="1" placeholder="e.g. 75000" required></div></div><div class="field"><label for="post-notes">Notes for the customer</label><textarea id="post-notes" name="notes" rows="3" maxlength="2500" placeholder="Explain the work and anything the customer should know." required></textarea></div><div class="field file-field"><label for="post-photos">Photos <small>Optional · up to 3 · max 3 MB each</small></label><input type="file" id="post-photos" accept="image/jpeg,image/png,image/webp" multiple><button type="button" class="text-button" data-action="sample-photo">Try a sample photo</button><div class="upload-preview" id="upload-preview"></div><p class="form-error" id="upload-error" role="alert"></p></div><details class="optional-details"><summary>Add next service recommendation <span>Optional</span></summary><fieldset class="next-work-fields"><legend class="sr-only">Next recommended work</legend><div class="field"><label for="next-title">Recommended work</label><input id="next-title" name="nextTitle" maxlength="100" placeholder="e.g. Next logbook service"></div><div class="field-row"><div class="field"><label for="next-date">Due date</label><input type="date" id="next-date" name="nextDate" min="${days(today,1)}"></div><div class="field"><label for="next-km">Or odometer (km)</label><input type="number" id="next-km" name="nextKm" min="0" max="2000000" step="1" placeholder="e.g. 85000"></div></div><label class="approval-check"><input type="checkbox" id="recommendation-approved"><span>Approved by the workshop</span></label></fieldset></details><details class="optional-details"><summary>More service details <span>Optional</span></summary><div class="field"><label for="post-kind">Record type</label><select id="post-kind" name="kind"><option value="completed">Completed service / repair</option><option value="update">Work in progress</option></select></div><div class="field"><label for="related-recommendation">Mark a recommendation as completed</label><select id="related-recommendation" name="relatedRecommendation"><option value="">None</option>${recommendations().map(r=>`<option value="${esc(r.id)}">${esc(r.title)}</option>`).join('')}</select></div><div class="field"><label for="post-work">Work checklist <small>One item per line</small></label><textarea id="post-work" name="work" rows="3" maxlength="1200" placeholder="Pads replaced&#10;Road test completed"></textarea></div></details><p class="form-error" id="post-error" role="alert"></p><button type="submit" class="button primary" id="publish-update">Save update</button></form></div>`;
}
function render(focusHeading=false){
  if(role==='customer'&&view==='workshop')view='overview';
  renderHeader();
  ['overview','history','requests','workshop'].forEach(name=>{const panel=$('#view-'+name);panel.hidden=name!==view;if(name!==view)panel.innerHTML='';});
  $('#view-'+view).innerHTML=view==='overview'?overviewHTML():view==='history'?historyHTML():view==='requests'?requestsHTML():composerHTML();
  if(view==='workshop')renderUploads();
  if(focusHeading){$('#view-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function setView(next){view=next;discardUploads();render(true);}
function setRole(next){role=next;discardUploads();const returnToGarage=view==='workshop';if(returnToGarage)view='overview';render(returnToGarage);message(next==='customer'?'Customer demo view. Only this sample account’s vehicles are shown.':'Workshop demo view. You can publish updates and reply to customer messages.');}

function openRequest(recId){
  $('#service-request-form').reset();$('#request-error').textContent='';
  $('#request-context').textContent=`${currentVehicle().name} · ${currentVehicle().rego}`;
  $('#request-date').min=days(today,1);
  if(recId){const rec=store.recommendations.find(r=>r.id===recId&&r.vehicle===vehicleId);if(rec){$('#request-subject').value=rec.title;$('#request-description').value=`I’d like to ask about arranging the recommended ${rec.title.toLowerCase()} for my ${currentVehicle().name}.`;}}
  $('#request-dialog').showModal();
}

function renderUploads(){const target=$('#upload-preview');if(!target)return;target.innerHTML=pendingPhotos.map((photo,index)=>`<figure><img src="${esc(photo.src)}" alt="${esc(photo.caption)}"><figcaption>${esc(photo.caption)}</figcaption><button type="button" class="text-button" data-action="remove-upload" data-index="${index}">Remove</button></figure>`).join('');const picker=$('#post-photos');if(picker)picker.disabled=uploading;$$('[data-action="sample-photo"],[data-action="remove-upload"]').forEach(b=>b.disabled=uploading);const submit=$('#publish-update');if(submit){submit.disabled=uploading;submit.textContent=uploading?'Preparing photos…':'Save update';}}
function readPhoto(file){return new Promise((resolve,reject)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return reject(new Error('Choose JPG, PNG or WebP images. SVG and other files are not supported.'));
  if(file.size>3*1024*1024)return reject(new Error('Each photo must be 3 MB or smaller.'));
  const reader=new FileReader();reader.onerror=()=>reject(new Error('The photo could not be read.'));reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('This file is not a readable image.'));image.onload=()=>{try{const scale=Math.min(1,1200/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);const source=canvas.toDataURL('image/jpeg',0.8);if(source.length>900000)throw new Error('This image is too detailed for demo storage. Please choose a smaller photo.');resolve({src:source,caption:'Workshop-uploaded sample photo · '+file.name.slice(0,80)});}catch(error){reject(error);}};image.src=reader.result;};reader.readAsDataURL(file);
});}

document.addEventListener('click',(event)=>{
  const roleButton=event.target.closest('[data-role]');if(roleButton){setRole(roleButton.dataset.role);return;}
  const nav=event.target.closest('[data-nav]');if(nav){setView(nav.dataset.nav);return;}
  const close=event.target.closest('[data-close]');if(close){$('#'+close.dataset.close).close();return;}
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action,id=button.dataset.id;
  if(action==='new-request'&&role==='customer')openRequest();
  if(action==='ask-recommendation'&&role==='customer')openRequest(id);
  if(action==='history')setView('history');
  if(action==='questions'){const question=entries().find(e=>e.needsReply);if(question){openEntries.add(question.id);openThreads.add(question.id);setView('history');$('#comment-'+question.id)?.focus();}}
  if(action==='record'){openEntries.add(id);setView('history');$('#entry-'+id+' summary')?.focus();}
  if(action==='post'&&role==='workshop')setView('workshop');
  if(action==='thread'){if(openThreads.has(id))openThreads.delete(id);else openThreads.add(id);const open=openThreads.has(id);$('#thread-'+id).hidden=!open;button.setAttribute('aria-expanded',String(open));const entry=store.entries.find(e=>e.id===id);button.textContent=`${open?'Hide comments':'Comments'} (${entry.comments.length})`;}
  if(action==='photo'){const entry=store.entries.find(e=>e.id===id&&e.vehicle===vehicleId);const photo=entry?.photos[Number(button.dataset.index)];if(photo&&safePhoto(photo.src)){$('#full-photo').src=photo.src;$('#full-photo').alt=photo.caption;$('#full-photo-caption').textContent=photo.caption;$('#photo-dialog').showModal();}}
  if(action==='sample-photo'&&role==='workshop'&&!uploading){if(pendingPhotos.length>=3){$('#upload-error').textContent='Up to 3 photos can be added to one update.';return;}pendingPhotos.push({src:'assets/example-workshop.png',caption:'Illustrative sample photo from the workshop website — not this sample vehicle.'});$('#upload-error').textContent='';renderUploads();}
  if(action==='remove-upload'&&!uploading){pendingPhotos.splice(Number(button.dataset.index),1);renderUploads();}
});
$('#vehicle-select').addEventListener('change',event=>{vehicleId=event.target.value;discardUploads();render(true);message(`Showing only ${currentVehicle().name} · ${currentVehicle().rego}.`);});
$('#open-help').addEventListener('click',()=>$('#help-dialog').showModal());
$('#reset-portal').addEventListener('click',()=>{store=seed();vehicleId='corolla';view='overview';role='customer';discardUploads();drafts.clear();openThreads.clear();openEntries.clear();render(true);commit('Demo reset. Sample history restored; demo posts, photos and conversations cleared.');});
document.addEventListener('toggle',event=>{const details=event.target;if(details.matches('.service-record')){if(details.open)openEntries.add(details.dataset.entryDetails);else openEntries.delete(details.dataset.entryDetails);}},true);
document.addEventListener('input',event=>{const form=event.target.closest('.comment-form,.reply-form');if(form&&event.target.tagName==='TEXTAREA')drafts.set(draftKey(form.matches('.comment-form')?'comment':'reply',form.dataset.entry||form.dataset.request),event.target.value);});

document.addEventListener('change',async(event)=>{
  if(event.target.id==='post-photos'){
    if(uploading)return;
    const token=++uploadRun,context=vehicleId,files=[...event.target.files];const error=$('#upload-error');error.textContent='';
    if(files.length+pendingPhotos.length>3){error.textContent='Add up to 3 photos per update.';event.target.value='';return;}
    uploading=true;renderUploads();
    try{const prepared=[];for(const file of files)prepared.push(await readPhoto(file));if(token===uploadRun&&context===vehicleId&&view==='workshop'&&role==='workshop')pendingPhotos.push(...prepared);}catch(problem){if(token===uploadRun&&$('#upload-error'))$('#upload-error').textContent=problem.message;}
    if(token===uploadRun){uploading=false;if($('#post-photos'))$('#post-photos').value='';renderUploads();}
  }
  if(event.target.id==='post-date'&&validDate(event.target.value))$('#next-date').min=days(event.target.value,1);
  if(event.target.matches('[data-request-status]')){const form=event.target.closest('form');const confirming=event.target.value==='confirmed';form.querySelector('.appointment-fields').hidden=!confirming;form.querySelectorAll('.appointment-fields input').forEach(input=>input.disabled=!confirming);}
});

document.addEventListener('submit',(event)=>{
  const form=event.target;
  if(form.id==='service-request-form'){
    event.preventDefault();if(role!=='customer')return;
    const subject=$('#request-subject').value.trim(),description=$('#request-description').value.trim(),preferredDate=$('#request-date').value;
    if(!subject||!description){$('#request-error').textContent='Add a service or question and a short description.';return;}
    if(preferredDate&&(!validDate(preferredDate)||preferredDate<=today||[0,6].includes(dayNumber(preferredDate)))){$('#request-error').textContent='Choose a future Monday–Friday date, or leave it blank to discuss with the workshop.';return;}
    const request={id:newId(),reference:'NGA-D'+String(store.requests.length+1).padStart(3,'0'),vehicle:vehicleId,kind:$('#request-kind').value,subject,description,preferredDate,preferredTime:$('#request-time').value,pickup:$('#request-pickup').checked,status:'pending',appointment:null,replies:[],created:new Date().toISOString()};
    store.requests.unshift(request);$('#request-dialog').close();view='requests';render(true);commit('Demo request received. It is awaiting a workshop reply, not a confirmed booking.');
  }
  if(form.matches('.comment-form')){
    event.preventDefault();const entry=store.entries.find(e=>e.id===form.dataset.entry&&e.vehicle===vehicleId);if(!entry)return;const text=form.elements.comment.value.trim();if(!text){form.querySelector('.form-error').textContent='Write a comment before posting.';return;}
    entry.comments.push({id:newId(),role,text,time:new Date().toISOString()});entry.needsReply=role==='customer';drafts.delete(draftKey('comment',entry.id));openThreads.add(entry.id);const y=window.scrollY;render();window.scrollTo({top:y,behavior:'instant'});$(`#comment-${entry.id}`)?.focus({preventScroll:true});commit(role==='customer'?'Comment added to this service record. Switch to Workshop view to reply.':'Workshop reply added to this service conversation.');
  }
  if(form.matches('.reply-form')){
    event.preventDefault();const request=store.requests.find(r=>r.id===form.dataset.request&&r.vehicle===vehicleId);if(!request)return;const text=form.elements.reply.value.trim();const error=form.querySelector('.form-error');if(!text){error.textContent='Write a message before sending.';return;}
    let appointment=null;
    if(role==='workshop'&&form.elements.status.value==='confirmed'){const date=form.elements.confirmedDate.value,time=form.elements.confirmedTime.value;const unchanged=request.appointment&&request.appointment.date===date&&request.appointment.time===time;if(!unchanged&&(!validDate(date)||date<=today||[0,6].includes(dayNumber(date))||!time)){error.textContent='Add a future Monday–Friday date and arrival time to confirm the sample appointment.';return;}appointment={date,time};}
    request.replies.push({id:newId(),role,text,time:new Date().toISOString()});drafts.delete(draftKey('reply',request.id));if(role==='workshop'){request.status=form.elements.status.value;request.appointment=appointment;}else if(request.status!=='confirmed')request.status='pending';const y=window.scrollY;render();window.scrollTo({top:y,behavior:'instant'});$(`#reply-${request.id}`)?.focus({preventScroll:true});commit(role==='workshop'?'Workshop response saved to this request. No real appointment was booked.':'Message added to your request.');
  }
  if(form.id==='workshop-post-form'){
    event.preventDefault();if(role!=='workshop'||uploading)return;
    const data=Object.fromEntries(new FormData(form).entries());const error=$('#post-error');const title=data.title.trim(),notes=data.notes.trim(),odometer=Number(data.odometer);const nextTitle=data.nextTitle.trim();const hasNext=Boolean(nextTitle||data.nextDate||data.nextKm);
    if(!title||!notes||!validDate(data.date)||data.date>today||!Number.isInteger(odometer)||odometer<0||odometer>2000000){error.textContent='Add a title, notes, a valid work date no later than today and a valid odometer.';return;}
    if(data.relatedRecommendation&&data.kind!=='completed'){error.textContent='Only a completed service or repair can close an existing recommendation.';return;}
    if(hasNext&&(!nextTitle||(!data.nextDate&&!data.nextKm)||!$('#recommendation-approved').checked)){error.textContent='For recommended work, add a title, date or odometer and tick workshop approval.';return;}
    if(data.nextDate&&(!validDate(data.nextDate)||data.nextDate<=data.date)){error.textContent='The next recommended date must be after the recorded work date.';return;}
    if(data.nextKm&&(!Number.isInteger(Number(data.nextKm))||Number(data.nextKm)<=odometer||Number(data.nextKm)>2000000)){error.textContent='The next odometer recommendation must be greater than the recorded odometer.';return;}
    const entry={id:newId(),vehicle:vehicleId,kind:data.kind,title,date:data.date,odometer,notes,work:data.work.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,10),photos:pendingPhotos.map(p=>({...p})),comments:[],needsReply:false};
    store.entries.unshift(entry);if(data.relatedRecommendation){const fulfilled=store.recommendations.find(r=>r.id===data.relatedRecommendation&&r.vehicle===vehicleId);if(fulfilled)fulfilled.completedEntry=entry.id;}if(hasNext)store.recommendations.push({id:newId(),vehicle:vehicleId,entry:entry.id,title:nextTitle,date:data.nextDate||null,dueKm:data.nextKm?Number(data.nextKm):null,notes:'Workshop-approved sample recommendation. Contact the workshop to discuss or request this work.'});
    pendingPhotos=[];openEntries.add(entry.id);view='history';render(true);commit('Workshop update published to this vehicle’s history. Switch to Customer view to see it and comment.');
  }
});
render();
