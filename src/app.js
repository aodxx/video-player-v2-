import { filterVideos, parseRawData } from './catalog.js';

/* ถ้าเปิดจาก GitHub Pages แล้ววิดีโอยัง 403 ให้ตั้งค่า เช่น
   const PROXY_PREFIX = 'https://your-worker.workers.dev/?url=';  */
const PROXY_PREFIX = 'https://video-player-proxy.pantipa3826.workers.dev/?url=';


/* ---------- State & DOM ---------- */
let DATA = [], currentList = [], currentIdx = -1, openToken = 0;
const $ = id => document.getElementById(id);
const grid=$('grid'), plList=$('plList'), countEl=$('count');
const searchEl=$('search'), sortEl=$('sort'), sourceEl=$('source');
const favoritesButton=$('showFavorites');
const playlist=$('playlist'), togglePlaylistButton=$('togglePlaylist');
const modal=$('modal'), stage=$('stage'), ui=$('ui'), player=$('player');
const detailsEl=$('details'), posEl=$('pos'), btnPrev=$('btnPrev'), btnNext=$('btnNext');
const bufferStatus=$('bufferStatus');
const btnFS=$('btnFS'), autonextEl=$('autonext'), autofsEl=$('autofs'), qualityEl=$('qualityMode'), errorBox=$('errorBox');
let visibleCardLimit = 300;
const QUALITY_KEY = 'video-player-v2:quality';
function normalizeQuality(value){return ['auto','original','max'].includes(value)?value:'auto';}
function readQualityPreference(){try{return normalizeQuality(localStorage.getItem(QUALITY_KEY));}catch(e){return 'auto';}}
function saveQualityPreference(){try{localStorage.setItem(QUALITY_KEY,normalizeQuality(qualityEl.value));}catch(e){console.warn('บันทึกคุณภาพไม่ได้',e);}}
qualityEl.value = readQualityPreference();

/* ---------- Favorites: เก็บเฉพาะ URL โพสต์ ไม่แก้ไขชุดข้อมูลต้นฉบับ ---------- */
const FAVORITES_KEY = 'video-player-v2:favorites';
let favoriteOnly = false;
let favorites = new Set();
try {
  const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  if (Array.isArray(stored)) favorites = new Set(stored.filter(x => typeof x === 'string'));
} catch (e) { console.warn('อ่านรายการโปรดไม่ได้', e); }
function isFavorite(d){ return favorites.has(d.postUrl); }
function syncFavoriteControls(){
  favoritesButton.classList.toggle('active', favoriteOnly);
  favoritesButton.setAttribute('aria-pressed', String(favoriteOnly));
  favoritesButton.textContent = `${favoriteOnly?'★':'☆'} รายการโปรด ${favorites.size}`;
  const current = currentList[currentIdx];
  const modalButton = $('favoriteCurrent');
  if(modalButton){
    modalButton.textContent = current && isFavorite(current) ? '★ บันทึกแล้ว' : '☆ เพิ่มรายการโปรด';
    modalButton.classList.toggle('is-favorite', !!current && isFavorite(current));
    modalButton.setAttribute('aria-pressed', String(!!current && isFavorite(current)));
  }
}
function toggleFavorite(d){
  if(!d) return;
  if(isFavorite(d)) favorites.delete(d.postUrl); else favorites.add(d.postUrl);
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); }
  catch(e){ console.warn('บันทึกรายการโปรดไม่ได้', e); }
  syncFavoriteControls();
  if(favoriteOnly) render();
  else document.querySelectorAll('.card').forEach(card=>{
    if(+card.dataset.i < currentList.length && currentList[+card.dataset.i].postUrl === d.postUrl){
      const button=card.querySelector('.favorite-btn');
      if(button){ const saved=isFavorite(d); button.classList.toggle('is-favorite',saved); button.textContent=saved?'★':'☆'; button.setAttribute('aria-label',saved?'นำออกจากรายการโปรด':'เพิ่มในรายการโปรด'); button.setAttribute('aria-pressed',String(saved)); }
    }
  });
}
function toggleCurrentFavorite(){ toggleFavorite(currentList[currentIdx]); }
/* ---------- Helpers ---------- */
function fmtDur(s){s=+s||0;return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function esc(s){return (s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));}
function fmtViews(n){n=+n||0;if(n>=1e6)return (n/1e6).toFixed(1)+'M';if(n>=1e3)return (n/1e3).toFixed(1)+'K';return n;}
function buildVideoUrl(u){return !u?'':(PROXY_PREFIX?PROXY_PREFIX+encodeURIComponent(u):u);}

/* ---------- หาลิงก์ความละเอียดสูงสุด (ต้องตั้ง PROXY_PREFIX ก่อน) ---------- */
const HQ_BASE = PROXY_PREFIX ? PROXY_PREFIX.split('?')[0] : '';
const hqCache = new Map();   // post_url -> Promise<{url,width,height}|null>
function resolveHQ(d){
  if(!HQ_BASE) return Promise.resolve(null);
  if(hqCache.has(d.postUrl)) return hqCache.get(d.postUrl);
  const id = (d.postUrl.match(/status\/(\d+)/)||[])[1];
  const mid = (d.videoUrl.match(/(?:amplify_video|ext_tw_video)\/(\d+)\//)||[])[1] || '';
  const p = !id ? Promise.resolve(null) :
    fetch(`${HQ_BASE}?hq=${id}&m=${mid}`).then(r=>r.json()).then(j=>j.url?j:null).catch(()=>null);
  hqCache.set(d.postUrl, p);
  return p;
}
const withTimeout=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(()=>r(null),ms))]);
let bufferWatchdog=0;
function showBufferStatus(message='กำลังโหลดวิดีโอ…'){
  bufferStatus.textContent=message;
  bufferStatus.classList.add('active');
}
function clearBufferStatus(){
  clearTimeout(bufferWatchdog);
  bufferStatus.classList.remove('active');
}
function reloadPlayerAt(url,position,token,shouldPlayAfterRecovery=true){
  const shouldPlay=shouldPlayAfterRecovery && !player.ended;
  const restore=()=>{
    if(token!==openToken) return;
    if(position>0 && Number.isFinite(player.duration)) player.currentTime=Math.min(position,Math.max(0,player.duration-0.25));
    if(shouldPlay) player.play().catch(()=>{});
  };
  player.addEventListener('loadedmetadata',restore,{once:true});
  player.src=buildVideoUrl(url);
  player.load();
  if(shouldPlay) player.play().catch(()=>{});
}
function fallbackFromHQ(d,token,message='กำลังสลับไปใช้ไฟล์ต้นฉบับ…'){
  if(!d || !d._usingHQ || token!==openToken) return false;
  const position=Number.isFinite(player.currentTime)?player.currentTime:0;
  d._usingHQ=false; d._hqFailed=true; d._res='';
  updateDetails(d);
  showBufferStatus(message);
  reloadPlayerAt(d.videoUrl,position,token,true);
  return true;
}
function scheduleBufferRecovery(){
  clearTimeout(bufferWatchdog);
  const token=openToken;
  bufferWatchdog=setTimeout(()=>{
    const d=currentList[currentIdx];
    if(!d || token!==openToken || player.paused || player.readyState>=3) return;
    if(fallbackFromHQ(d,token,'ไฟล์ความละเอียดสูงโหลดช้า กำลังสลับเป็นไฟล์ที่เสถียรกว่า…')) return;
    if((d._stallRetries||0)<1){
      d._stallRetries=(d._stallRetries||0)+1;
      showBufferStatus('การเชื่อมต่อสะดุด กำลังลองโหลดต่อ…');
      reloadPlayerAt(d.videoUrl,Number.isFinite(player.currentTime)?player.currentTime:0,token,true);
      return;
    }
    $('errInfo').textContent='โหลดวิดีโอไม่ต่อเนื่อง ลองกด “ลองอีกครั้ง” หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    errorBox.classList.add('active');
  },12000);
}
function pixels(u){const m=/\/(\d+)x(\d+)\//.exec(u||'');return m?+m[1]*+m[2]:0;}
function resolutionLabel(u){const m=/\/(\d+)x(\d+)\//.exec(u||'');return m?m[2]+'p':'';}

/* ---------- รายการ / แสดงผล ---------- */
function buildList(){
  const k = sortEl.value;
  const list = filterVideos(DATA, { source: sourceEl.value, query: searchEl.value, favorites: favoriteOnly ? favorites : null });
  list.sort((a,b)=>{
    if(k==='views')    return (+b.views)-(+a.views);
    if(k==='duration') return (+b.durationSeconds)-(+a.durationSeconds);
    const key = value => { const [date,time='00:00'] = value.postedAt.split(' '); return `${date}T${time.padStart(5,'0')}`; };
    return key(b).localeCompare(key(a));
  });
  return list;
}

function render(){
  currentList = buildList();
  countEl.textContent = `${currentList.length} วิดีโอ`;
  if(!currentList.length){
    grid.innerHTML = '<div class="loading">ไม่พบวิดีโอ</div>';
    plList.innerHTML = '';
    syncFavoriteControls();
    return;
  }
  grid.innerHTML = currentList.slice(0, visibleCardLimit).map((d,i)=>{
    const thumb = d.thumbnailUrl
      ? `<img src="${d.thumbnailUrl}" loading="lazy" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none'">`
      : '🎬';
    const cls = ({ SoMay:'src-so', Rewaida:'src-rw', 'Rabbit Rayong':'src-cx' })[d.source] || '';
    return `<div class="card ${i===currentIdx?'playing':''}" data-i="${i}">
      <div class="thumb">${thumb}<button class="favorite-btn ${isFavorite(d)?'is-favorite':''}" type="button" aria-label="${isFavorite(d)?'นำออกจากรายการโปรด':'เพิ่มในรายการโปรด'}" aria-pressed="${isFavorite(d)}">${isFavorite(d)?'★':'☆'}</button></div>
      <div class="info">
        <div><span class="badge ${cls}">${d.sourceLabel}</span>
          <span class="badge">👁 ${fmtViews(d.views)}</span>
          <span class="badge">⏱ ${fmtDur(d.durationSeconds)}</span></div>
        <div class="meta">${d.postedAt}</div>
      </div></div>`;
  }).join('');
  if(currentList.length > visibleCardLimit){
    grid.insertAdjacentHTML('beforeend', `<div id="loadMoreWrap"><button id="loadMore" type="button">โหลดเพิ่ม (${Math.min(visibleCardLimit, currentList.length)} / ${currentList.length})</button></div>`);
    $('loadMore').onclick = () => { visibleCardLimit += 300; render(); };
  }
  grid.querySelectorAll('.card').forEach(el=>{
    el.onclick=()=>openAt(+el.dataset.i,true);
    el.querySelector('.favorite-btn').onclick=e=>{ e.stopPropagation(); toggleFavorite(currentList[+el.dataset.i]); };
  });
  syncFavoriteControls();
  renderPlaylist();
}

function renderPlaylist(){
  plList.innerHTML = currentList.slice(0,200).map((d,i)=>`
    <div class="pl-item ${i===currentIdx?'active':''}" data-i="${i}">
      <span class="num">${i+1}.</span>
      <span>${fmtDur(d.durationSeconds)} · 👁${fmtViews(d.views)} · ${d.sourceLabel}</span>
    </div>`).join('');
  plList.querySelectorAll('.pl-item').forEach(el=>{ el.onclick=()=>{
    openAt(+el.dataset.i,true);
    playlist.classList.remove('mobile-open');
    togglePlaylistButton.setAttribute('aria-expanded','false');
  }; });
}

function updateActive(){
  document.querySelectorAll('.card').forEach(c=>c.classList.toggle('playing',+c.dataset.i===currentIdx));
  document.querySelectorAll('.pl-item').forEach(c=>{
    const a=+c.dataset.i===currentIdx; c.classList.toggle('active',a);
    if(a) c.scrollIntoView({block:'nearest'});
  });
}

/* ---------- เต็มจอ (ทั้ง modal ไม่ใช่แค่ตัววิดีโอ) ---------- */
const fsEl = ()=>document.fullscreenElement||document.webkitFullscreenElement;
function enterFS(){
  const f = modal.requestFullscreen||modal.webkitRequestFullscreen;
  if(f){try{const r=f.call(modal);r&&r.catch&&r.catch(()=>{});}catch(e){}}
}
function exitFS(){
  const f = document.exitFullscreen||document.webkitExitFullscreen;
  if(f&&fsEl()){try{const r=f.call(document);r&&r.catch&&r.catch(()=>{});}catch(e){}}
}
function toggleFS(){ fsEl()?exitFS():enterFS(); }
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>
  document.addEventListener(ev,()=>{
    btnFS.textContent = fsEl()?'⤢ ออกเต็มจอ':'⛶ เต็มจอ';
    showUI();
  }));

/* ---------- ซ่อน/แสดงปุ่มอัตโนมัติ ---------- */
let uiTimer;
function showUI(){
  ui.classList.remove('hide');
  clearTimeout(uiTimer);
  uiTimer = setTimeout(()=>{ if(!player.paused) ui.classList.add('hide'); },3000);
}
['mousemove','touchstart','click'].forEach(ev=>stage.addEventListener(ev,showUI,{passive:true}));
player.addEventListener('play',showUI);
player.addEventListener('pause',showUI);

/* ---------- Player ---------- */
function openAt(i,fromUser){
  if(i<0||i>=currentList.length) return;
  if(fromUser && autofsEl.checked && !fsEl()) enterFS();  // ต้องเรียกตอนผู้ใช้กดเท่านั้น
  currentIdx = i;
  const d = currentList[i];
  errorBox.classList.remove('active');
  const token = ++openToken;
  clearBufferStatus();
  d._usingHQ = false; d._res = ''; d._stallRetries = 0; d._networkRetries = 0;
  const startPlay = (url, useHQ=false, height=0)=>{
    if(token!==openToken) return;
    d._usingHQ = useHQ; d._hqUrl = useHQ ? url : '';
    d._res = useHQ ? (height ? height+'p' : resolutionLabel(url)) : resolutionLabel(url);
    updateDetails(d);
    player.src = buildVideoUrl(url);
    player.load();
    player.play().catch(err=>console.log('autoplay blocked:',err.message));
    const nx=currentList[i+1]; if(nx && qualityEl.value!=='original') resolveHQ(nx);   // โหลดล่วงหน้าคลิปถัดไป
  };
  const mode = qualityEl.value;
  if(mode!=='original' && HQ_BASE){
    withTimeout(resolveHQ(d),2500).then(h=>{
      if(token!==openToken) return;
      if(h && (mode==='max' || pixels(h.url) > pixels(d.videoUrl))) startPlay(h.url,true,h.height);
      else startPlay(d.videoUrl);
    });
  } else startPlay(d.videoUrl);

  posEl.textContent = `${i+1} / ${currentList.length}`;
  btnPrev.disabled = (i<=0);
  btnNext.disabled = (i>=currentList.length-1);
  updateDetails(d);
  modal.classList.add('active');
  updateActive();
  showUI();
}
function updateDetails(d){
  const playingQuality = d._usingHQ ? `สูงสุด${d._res?' · '+d._res:''}` : `ต้นฉบับ${d._res?' · '+d._res:''}`;
  detailsEl.innerHTML = `${d.sourceLabel}${d.text?' · '+esc(d.text):''} · 👁 ${d.views} · ⏱ ${fmtDur(d.durationSeconds)} · กำลังเล่น: ${playingQuality}`
    + ` · <a href="${d.postUrl}" target="_blank" rel="noopener">ทวีต ↗</a> · <button id="favoriteCurrent" class="favorite-action ${isFavorite(d)?'is-favorite':''}" type="button" aria-pressed="${isFavorite(d)}">${isFavorite(d)?'★ บันทึกแล้ว':'☆ เพิ่มรายการโปรด'}</button>`;
}
function applyQualityMode(){
  saveQualityPreference();
  if(currentIdx<0) return;
  const d=currentList[currentIdx]; if(!d) return;
  const token=++openToken;
  const playbackPosition=()=>Number.isFinite(player.currentTime)?player.currentTime:0;
  const shouldResume=()=>!player.paused;
  const mode=qualityEl.value;
  clearBufferStatus(); errorBox.classList.remove('active');
  d._usingHQ=false; d._hqUrl=''; d._res=''; d._hqFailed=false; d._stallRetries=0; d._networkRetries=0;
  const useOriginal=()=>{
    if(token!==openToken) return;
    d._usingHQ=false; d._hqUrl=''; d._res=resolutionLabel(d.videoUrl);
    updateDetails(d); reloadPlayerAt(d.videoUrl,playbackPosition(),token,shouldResume());
  };
  if(mode==='original' || !HQ_BASE){useOriginal();return;}
  showBufferStatus('กำลังเปลี่ยนคุณภาพวิดีโอ…');
  withTimeout(resolveHQ(d),2500).then(h=>{
    if(token!==openToken) return;
    if(h && (mode==='max' || pixels(h.url)>pixels(d.videoUrl))){
      d._usingHQ=true; d._hqUrl=h.url; d._res=h.height?h.height+'p':resolutionLabel(h.url);
      updateDetails(d); reloadPlayerAt(h.url,playbackPosition(),token,shouldResume());
    } else useOriginal();
  });
}
function retryCurrent(){ if(currentIdx>=0) openAt(currentIdx); }
function nextVideo(){ if(currentIdx<currentList.length-1) openAt(currentIdx+1); }
function prevVideo(){ if(currentIdx>0) openAt(currentIdx-1); }

function closeModal(){
  exitFS();
  modal.classList.remove('active');
  player.pause(); player.removeAttribute('src'); player.load();
  errorBox.classList.remove('active');
  currentIdx = -1;
  render();
}

player.addEventListener('loadstart',()=>{ showBufferStatus(); scheduleBufferRecovery(); });
player.addEventListener('waiting',()=>{ showBufferStatus('กำลังรอข้อมูลวิดีโอ…'); scheduleBufferRecovery(); });
player.addEventListener('stalled',()=>{ showBufferStatus('การเชื่อมต่อช้ากว่าปกติ…'); scheduleBufferRecovery(); });
['playing','canplay','loadeddata'].forEach(ev=>player.addEventListener(ev,clearBufferStatus));
player.addEventListener('error',()=>{
  clearBufferStatus();
  const cur = currentList[currentIdx];
  const token = openToken;
  if(cur && fallbackFromHQ(cur,token,'ไฟล์ความละเอียดสูงเล่นไม่ได้ กำลังสลับเป็นไฟล์ต้นฉบับ…')) return;
  const c = player.error ? player.error.code : '?';
  if(cur && c===2 && (cur._networkRetries||0)<1){
    cur._networkRetries=(cur._networkRetries||0)+1;
    showBufferStatus('เครือข่ายสะดุด กำลังลองเชื่อมต่ออีกครั้ง…');
    reloadPlayerAt(cur.videoUrl,Number.isFinite(player.currentTime)?player.currentTime:0,token,true);
    return;
  }
  const names = {1:'ถูกยกเลิก',2:'เครือข่าย/ถูกบล็อก (มักเป็น 403)',3:'ถอดรหัสไฟล์ไม่ได้',4:'ไม่พบไฟล์หรือเบราว์เซอร์ไม่รองรับ'};
  $('errInfo').textContent = `รหัสข้อผิดพลาด ${c}: ${names[c]||'ไม่ทราบสาเหตุ'}`
    + (PROXY_PREFIX ? ' (ผ่าน proxy แล้ว)' : ' — ถ้ากด "เปิด MP4 ตรงๆ" แล้วเล่นได้ แปลว่าเว็บนี้ถูกบล็อก ต้องใช้ proxy');
  console.error('video error', player.error, player.src);
  errorBox.classList.add('active');
});
player.addEventListener('ended',()=>{ if(autonextEl.checked) nextVideo(); });
player.addEventListener('loadeddata',()=>errorBox.classList.remove('active'));

/* ---------- ปุ่มและตัวกรอง ---------- */
btnPrev.onclick = prevVideo;
btnNext.onclick = nextVideo;
searchEl.oninput = ()=>{currentIdx=-1;visibleCardLimit=300;render();};
sortEl.onchange  = ()=>{currentIdx=-1;visibleCardLimit=300;render();};
sourceEl.onchange= ()=>{currentIdx=-1;visibleCardLimit=300;render();};
qualityEl.onchange = applyQualityMode;
favoritesButton.onclick=()=>{favoriteOnly=!favoriteOnly; currentIdx=-1; render();};
$('btnClose').onclick = closeModal;
btnFS.onclick = toggleFS;
$('btnRetry').onclick = retryCurrent;
$('btnSkip').onclick = nextVideo;
$('btnOpenVideo').onclick = () => { const current = currentList[currentIdx]; if (current) window.open(current.videoUrl, '_blank', 'noopener'); };
detailsEl.addEventListener('click', event => { if (event.target.closest('#favoriteCurrent')) toggleCurrentFavorite(); });
togglePlaylistButton.onclick = () => {
  const opened = playlist.classList.toggle('mobile-open');
  togglePlaylistButton.setAttribute('aria-expanded', String(opened));
};

/* มือถือ: ปัดขึ้น = ถัดไป, ปัดลง = ก่อนหน้า (ไม่นับแถบควบคุมวิดีโอด้านล่าง) */
let tx=0,ty=0,tOK=false;
stage.addEventListener('touchstart',e=>{
  const t=e.touches[0]; tx=t.clientX; ty=t.clientY;
  tOK = ty < innerHeight-90 && !e.target.closest('button,input,select,a,video,.bottombar');
},{passive:true});
stage.addEventListener('touchend',e=>{
  if(!tOK) return;
  const t=e.changedTouches[0], dx=t.clientX-tx, dy=t.clientY-ty;
  if(Math.abs(dy)>80 && Math.abs(dx)<60) (dy<0?nextVideo():prevVideo());
},{passive:true});

/* คีย์บอร์ด */
document.addEventListener('keydown',e=>{
  if(!modal.classList.contains('active')) return;
  if(e.key==='Escape' && !fsEl()) closeModal();
  else if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();nextVideo();}
  else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();prevVideo();}
  else if(e.key==='f'||e.key==='F') toggleFS();
  else if(e.key===' '){e.preventDefault();player.paused?player.play():player.pause();}
});

/* ---------- เริ่มต้น ---------- */
(async function init(){
  try{
    const dataResponse = await fetch('./data/videos.txt');
    if (!dataResponse.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (${dataResponse.status})`);
    DATA = parseRawData(await dataResponse.text());
    console.log(`✓ โหลด ${DATA.length} วิดีโอ`);
    syncFavoriteControls();
    if(!DATA.length){
      grid.innerHTML = '<div class="loading">ยังไม่มีข้อมูลวิดีโอ<br>ไฟล์ data/videos.txt ว่างเปล่า</div>';
      return;
    }
    render();
  }catch(e){
    console.error(e);
    grid.innerHTML = `<div class="loading">❌ เกิดข้อผิดพลาด: ${esc(e.message)}</div>`;
  }
})();
