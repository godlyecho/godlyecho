(() => {
'use strict';
const C=window.SITE_CONFIG, content=window.SITE_CONTENT, $=s=>document.querySelector(s);
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const ease=t=>1-Math.pow(1-t,4), duration=440;
const pointer=matchMedia('(hover: hover) and (pointer: fine)');
let entered=false,current=0,mediaIndex=0,gallery=[],toastTimer,activeGesture=null,suppressClickUntil=0;
const requestedFont=new URLSearchParams(location.search).get('font');
const fonts=['manrope','oswald','unbounded','plex'];
document.documentElement.dataset.font=fonts.includes(requestedFont)?requestedFont:C.fontStyle;
const requestedIcons=new URLSearchParams(location.search).get('icons');
const iconStyle=['outline','duotone','fill'].includes(requestedIcons)?requestedIcons:C.iconStyle;
document.body.dataset.iconStyle=iconStyle;
const outline={'profile-msn.png':'user-round','videos-youtube.png':'tv-minimal-play','photos-album-crystal.png':'images','skate-noto.png':'clapperboard','movie.png':'clapperboard','projects-folder.png':'folder-open','links.png':'globe','info.png':'info','file.png':'file'};
const solid={...outline,'profile-msn.png':'user','videos-youtube.png':'youtube-logo','skate-noto.png':'film-slate','movie.png':'film-slate'};
const icon=name=>name.endsWith('.svg')?'assets/icons/social/'+name:'assets/icons/choices/'+iconStyle+'/'+((iconStyle==='outline'?outline:solid)[name]||'file')+'.svg';
const normalize=items=>items.map(item=>({...item,subtitle:item.caption||'',src:item.video||item.image||'',poster:item.video?item.image:undefined}));
const sections=[
 {id:'profile',label:C.name,icon:'profile-msn.png',items:[{title:C.profile.title,subtitle:C.profile.description,src:C.profile.avatar,alt:C.profile.avatarAlt,profile:true}]},
 {id:'projects',label:'Проекты',icon:'projects-folder.png',description:content.projectsDescription,items:normalize(content.projects)},
 {id:'links',label:'Линки',icon:'links.png',items:C.links},
 {id:'about',label:'Об этом сайте',icon:'info.png',items:[
  {title:'Phosphor Duotone — иконки',subtitle:'Двухтонные иконки сайта',url:'https://phosphoricons.com/',icon:'palette.svg'},
  {title:'Unbounded — шрифт',subtitle:'Шрифт сайта · Google Fonts',url:'https://fonts.google.com/specimen/Unbounded',icon:'text-aa.svg'},
  ...(C.background.source?[{title:'Видеофон — '+(C.background.sourceLabel||'Pinterest'),subtitle:'Оригинальное видео',url:C.background.source,icon:'film-strip.svg'}]:[]),
  {title:'Визиты',subtitle:'Открытия страницы',counter:true,note:true,icon:'info.png'}
 ]}
];
current=Math.max(0,sections.findIndex(s=>s.id===location.hash.slice(1)));
const tabs=[],panels=[],viewports=[],lists=[],rows=[],selected=sections.map(()=>0),scrollFrames=sections.map(()=>0);
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node}
function image(src,alt=''){const img=el('img');img.src=src;img.alt=alt;if(!alt)img.setAttribute('aria-hidden','true');img.draggable=false;return img}
sections.forEach((s,k)=>{
 const tab=el('button','category');tab.type='button';tab.id='tab-'+s.id;tab.setAttribute('role','tab');tab.setAttribute('aria-label',s.label);tab.setAttribute('aria-controls','panel-'+s.id);tab.append(image(icon(s.icon)),el('span','',s.label));tab.onclick=()=>switchTo(k);$('#categories').append(tab);tabs.push(tab);
 const panel=el('section','panel');panel.id='panel-'+s.id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);$('#panels').append(panel);panels.push(panel);
 const description=el('p','section-description',s.description);description.hidden=!s.description;if(s.description){description.id='description-'+s.id;panel.setAttribute('aria-describedby',description.id)}panel.append(description);
 const viewport=el('div','list-viewport'),list=el('div','item-list');viewport.append(list);panel.append(viewport);viewports.push(viewport);lists.push(list);
 const group=[];
 s.items.forEach((item,i)=>{
  const wrap=el('article','item'+(item.profile?' profile-card':'')+(item.note?' item-note':''));
  const row=el(item.note?'div':'button','row');row.dataset.index=String(i);
  if(!item.note){row.type='button';row.setAttribute('aria-label',item.title)}
  const picture=el('span','item-icon');
  if((s.type==='photo'||item.profile)&&item.src){picture.classList.add('photo');if(item.profile)picture.classList.add('profile-avatar');const img=image(item.src,item.alt||item.title);img.loading=item.profile?'eager':'lazy';picture.append(img)}else picture.append(image(icon(item.icon||s.icon)));
  const text=el('span','text');text.append(el('span','title',item.title));if(item.subtitle)text.append(el('span',item.profile?'subtitle profile-intro':'subtitle',item.subtitle));row.append(picture,text);wrap.append(row);
  if(item.profile){const facts=el('aside','facts');facts.append(el('p','',C.profile.note));const dl=el('dl');C.profile.facts.forEach(([key,value])=>{const entry=el('div');entry.append(el('dt','',key),el('dd','',value));dl.append(entry)});facts.append(dl);wrap.append(facts)}
  if(item.counter){wrap.hidden=true;requestAnimationFrame(()=>loadVisits(wrap,text))}
  if(!item.note)row.onclick=()=>{if(k!==current||!row.classList.contains('is-hit-safe'))return;selected[k]=i;paint();scrollSelection(k,true);openItem(item,s)};
  list.append(wrap);group.push(wrap);
 });rows.push(group);
 viewport.addEventListener('scroll',()=>updateHitAreas(k),{passive:true});
});
// Native scroll positions and normal-flow rows keep visual and hit geometry identical.
function visibleRows(k){return rows[k].filter(row=>!row.hidden)}
function updateHitAreas(k){
 const bounds=viewports[k].getBoundingClientRect(),safeBottom=bounds.bottom-32;viewports[k].classList.toggle('has-scroll-top',viewports[k].scrollTop>2);
 rows[k].forEach((wrap,i)=>{const row=wrap.querySelector('.row'),rect=row.getBoundingClientRect();const safe=k===current&&entered&&!wrap.hidden&&Number(getComputedStyle(row).opacity)>.7&&rect.top>=bounds.top+2&&rect.bottom<=safeBottom&&rect.right>bounds.left&&rect.left<bounds.right;row.classList.toggle('is-hit-safe',safe);row.tabIndex=safe&&i===selected[k]&&row.tagName==='BUTTON'?0:-1});
}
function layoutLists(){
 viewports.forEach((viewport,k)=>{const last=visibleRows(k).at(-1);lists[k].style.paddingBottom=Math.max(32,viewport.clientHeight-(last?.offsetHeight||120)-(innerWidth<=640?10:22))+'px'});
}
function paint(){
 const section=sections[current];document.title=section.id==='profile'?C.name+' — О себе':section.label+' — '+C.name;
 const intro=$('.profile-intro');if(intro)intro.textContent=innerWidth<=1180?(C.profile.mobileDescription||C.profile.description):C.profile.description;
 const step=innerWidth<=640?82:Math.min(160,Math.max(112,innerWidth*.1));
 tabs.forEach((tab,k)=>{tab.style.transform=`translate3d(${(k-current)*step}px,0,0)`;tab.setAttribute('aria-selected',String(k===current));tab.tabIndex=k===current?0:-1;const label=tab.querySelector('span'),center=(innerWidth<=640?innerWidth*.08:innerWidth*.2)+(innerWidth<=640?22:34)+(k-current)*step;tab.style.setProperty('--label-nudge',Math.max(0,8-(center-label.offsetWidth/2))+'px')});
 panels.forEach((panel,k)=>{panel.classList.toggle('is-current',k===current);panel.inert=k!==current||!entered;panel.setAttribute('aria-hidden',String(k!==current));panel.style.transform=motion.matches?'none':`translate3d(${Math.sign(k-current)*36}px,0,0)`;rows[k].forEach((row,i)=>row.classList.toggle('active',i===selected[k]));updateHitAreas(k)});
 $('#back').disabled=current===0;$('#next').disabled=current===sections.length-1;$('#sectionStatus').textContent=section.label;updateInputHint();layoutLists();
}
function stopScroll(k){cancelAnimationFrame(scrollFrames[k]);scrollFrames[k]=0}
function scrollSelection(k,smooth=true){
 stopScroll(k);const row=rows[k][selected[k]];if(!row)return;
 const viewport=viewports[k],from=viewport.scrollTop,to=Math.max(0,row.offsetTop-(innerWidth<=640?10:22)),start=performance.now();
 if(!smooth||motion.matches||Math.abs(to-from)<1){viewport.scrollTop=to;updateHitAreas(k);return}
 function frame(now){if(k!==current){stopScroll(k);return}const t=Math.min(1,(now-start)/duration);viewport.scrollTop=from+(to-from)*ease(t);updateHitAreas(k);if(t<1)scrollFrames[k]=requestAnimationFrame(frame);else scrollFrames[k]=0}
 scrollFrames[k]=requestAnimationFrame(frame);
}
function enterRows(){
 panels.forEach(p=>p.querySelectorAll('.row').forEach(row=>row.getAnimations().forEach(a=>a.cancel())));
 if(motion.matches)return;
 const k=current;rows[k].filter(row=>!row.hidden).forEach((wrap,i)=>{const row=wrap.querySelector('.row');row.classList.remove('is-hit-safe');row.animate([{opacity:0},{opacity:1}],{duration:360,delay:Math.min(i*40,200),fill:'backwards'}).finished.then(()=>updateHitAreas(k)).catch(()=>{})});
}
function switchTo(index){
 const next=Math.max(0,Math.min(sections.length-1,index));if(next===current)return;
 const focusInApp=$('#xmb').contains(document.activeElement);panels.forEach((_,k)=>stopScroll(k));current=next;
 // Reset the incoming panel while transparent; its entrance supplies the animation.
 selected[current]=rows[current].findIndex(row=>!row.hidden);viewports[current].scrollTop=0;
 history.replaceState(null,'','#'+sections[current].id);paint();layoutLists();enterRows();scrollSelection(current,false);
 if(focusInApp)tabs[current].focus({preventScroll:true});
}
function move(delta){
 const visible=visibleRows(current);if(!visible.length)return;
 const index=visible.indexOf(rows[current][selected[current]]);selected[current]=rows[current].indexOf(visible[Math.max(0,Math.min(visible.length-1,index+delta))]);
 // Keep keyboard focus stable; moving focus into a scroller can cause native jumps.
 if(document.activeElement?.classList.contains('row'))tabs[current].focus({preventScroll:true});
 paint();scrollSelection(current,true);
}
function loadVisits(wrap,text){
 if(!C.visits?.badge||location.protocol==='file:')return;
 const img=new Image();let settled=false;
 const timer=setTimeout(()=>finish(false),C.visits.timeoutMs||8000);
 function finish(ok){
  if(settled)return;settled=true;clearTimeout(timer);img.onload=img.onerror=null;
  if(!ok)return;
  // Keep only the badge's white digits; remove its colored rectangles.
  if(!document.getElementById('visit-ink')){
   const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),filter=document.createElementNS(ns,'filter'),matrix=document.createElementNS(ns,'feColorMatrix');
   svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');svg.style.position='absolute';
   filter.id='visit-ink';filter.setAttribute('color-interpolation-filters','sRGB');
   matrix.setAttribute('type','matrix');matrix.setAttribute('values','0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3 3 3 0 -7');
   filter.append(matrix);svg.append(filter);document.body.append(svg);
  }
  const count=el('span','visit-count');img.alt='Общее число открытий страницы';count.append(img);
  const title=text.querySelector('.title');title.classList.add('visit-title');title.append(count);
  wrap.hidden=false;layoutLists();paint();
 }
 // Image embeds work across origins without a CORS-enabled JSON API.
 // This request runs once per page load, never on section changes.
 img.referrerPolicy='no-referrer';img.onload=()=>finish(img.naturalWidth===80&&img.naturalHeight===20);
 img.onerror=()=>finish(false);img.src=C.visits.badge;
}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2500)}
function openItem(item,section){
 if(!item||item.note)return;
 if(section.type==='photo'||section.type==='video'||item.profile){gallery=item.profile?[item]:section.items;mediaIndex=Math.max(0,gallery.indexOf(item));showMedia(section.type==='video'?'video':'photo');return}
 if(section.id==='projects'){showDetails(item);return}
 if(item.url){const url=new URL(item.url,location.href);if(['https:','http:'].includes(url.protocol))window.open(url.href,'_blank','noopener,noreferrer')}
}
function photoFrame(item){
 const [w,h,top,bottom]=item.crop,frame=el('div','photo-frame'),height=bottom-top;
 frame.style.setProperty('--photo-ratio',w/height);frame.style.setProperty('--photo-height',`${h/height*100}%`);frame.style.setProperty('--photo-top',`${-top/height*100}%`);frame.append(image(item.src,item.alt||item.title));return frame;
}
function showMedia(type){
 const viewer=$('#viewer'),media=$('#media'),item=gallery[mediaIndex];media.replaceChildren();
 let tag;if(type==='photo'&&item.crop)tag=photoFrame(item);else if(type==='photo')tag=image(item.src,item.alt||item.title);else{tag=el('video');tag.src=item.src;tag.controls=true;tag.autoplay=true;tag.playsInline=true;tag.preload='metadata';tag.setAttribute('aria-label',item.title);if(item.poster)tag.poster=item.poster}
 media.append(tag);$('#caption').textContent=item.title+(gallery.length>1?` · ${mediaIndex+1} / ${gallery.length}`:'');$('#mediaCaption').textContent=item.subtitle||'';$('#mediaCaption').hidden=!item.subtitle;viewer.dataset.type=type;
 $('#previousMedia').hidden=$('#nextMedia').hidden=gallery.length<2;$('#previousMedia').setAttribute('aria-label',type==='video'?'Предыдущее видео':'Предыдущее фото');$('#nextMedia').setAttribute('aria-label',type==='video'?'Следующее видео':'Следующее фото');
 if(type==='video')pauseMusic();if(!viewer.open)viewer.showModal();
}
function showDetails(item){
 const card=el('article','details-card');card.append(image(icon(item.icon||'robot.svg')),el('h2','',item.title),el('p','',item.subtitle));
 if(item.url){const link=el('a','detail-link','Открыть в Telegram ↗');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';card.append(link)}
 $('#media').replaceChildren(card);$('#mediaCaption').hidden=true;$('#caption').textContent=item.title;$('#viewer').dataset.type='details';$('#previousMedia').hidden=$('#nextMedia').hidden=true;$('#viewer').showModal();
}
function nextMedia(delta){if(gallery.length<2||$('#viewer').dataset.type==='details')return;mediaIndex=(mediaIndex+delta+gallery.length)%gallery.length;showMedia($('#viewer').dataset.type)}
$('#previousMedia').onclick=()=>nextMedia(-1);$('#nextMedia').onclick=()=>nextMedia(1);$('#viewer .close').onclick=()=>$('#viewer').close();
$('#viewer').addEventListener('close',()=>{$('#media').replaceChildren();playMusic()});$('#back').onclick=()=>switchTo(current-1);$('#next').onclick=()=>switchTo(current+1);
document.addEventListener('keydown',event=>{
 if(!entered||event.target.closest('.sound-dock'))return;
 if(event.target.closest('.controls')&&event.key==='Enter')return;
 if($('#viewer').open){if(event.key==='ArrowLeft'){event.preventDefault();nextMedia(-1)}if(event.key==='ArrowRight'){event.preventDefault();nextMedia(1)}return}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Enter'].includes(event.key))event.preventDefault();
 if(event.key==='ArrowLeft')switchTo(current-1);if(event.key==='ArrowRight')switchTo(current+1);if(event.key==='ArrowUp')move(-1);if(event.key==='ArrowDown')move(1);if(event.key==='Home')move(-rows[current].length);if(event.key==='End')move(rows[current].length);
 if(event.key==='Enter'&&!event.repeat)openItem(sections[current].items[selected[current]],sections[current]);
});
let wheelAt=0;$('#panels').addEventListener('wheel',event=>{const caption=event.target.closest('.subtitle');if(caption&&caption.scrollHeight>caption.clientHeight)return;event.preventDefault();if(Date.now()-wheelAt<140)return;wheelAt=Date.now();if(Math.abs(event.deltaX)>Math.abs(event.deltaY))switchTo(current+Math.sign(event.deltaX));else move(Math.sign(event.deltaY))},{passive:false});
$('#xmb').addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'||!event.isPrimary)return;const caption=event.target.closest('.subtitle');activeGesture={id:event.pointerId,x:event.clientX,y:event.clientY,axis:null,delta:0,caption:caption&&caption.scrollHeight>caption.clientHeight?caption:null,scrollTop:caption?.scrollTop||0}});
$('#xmb').addEventListener('pointermove',event=>{if(!activeGesture||event.pointerId!==activeGesture.id)return;const dx=event.clientX-activeGesture.x,dy=event.clientY-activeGesture.y;if(activeGesture.caption){activeGesture.caption.scrollTop=activeGesture.scrollTop-dy;activeGesture.delta=dy;return}if(!activeGesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>8)activeGesture.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';if(activeGesture.axis)activeGesture.delta=activeGesture.axis==='x'?dx:dy});
function endSwipe(event){if(!activeGesture||event.pointerId!==activeGesture.id)return;const gesture=activeGesture;activeGesture=null;if(gesture.caption){if(Math.abs(gesture.delta)>8)suppressClickUntil=performance.now()+350;return}if(event.type==='pointercancel'||!gesture.axis)return;suppressClickUntil=performance.now()+350;if(Math.abs(gesture.delta)<35)return;if(gesture.axis==='x')switchTo(current+(gesture.delta<0?1:-1));else move(gesture.delta<0?1:-1)}
window.addEventListener('pointerup',endSwipe);window.addEventListener('pointercancel',endSwipe);$('#xmb').addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation()}},true);
window.addEventListener('resize',()=>{layoutLists();paint();scrollSelection(current,false)});window.addEventListener('hashchange',()=>{const index=sections.findIndex(s=>s.id===location.hash.slice(1));if(index>=0)switchTo(index)});
function updateInputHint(){$('.keyboard-hint').hidden=!pointer.matches||navigator.maxTouchPoints>0}
pointer.addEventListener('change',updateInputHint);window.addEventListener('pointerdown',event=>{$('.keyboard-hint').hidden=event.pointerType!=='mouse'||!pointer.matches||navigator.maxTouchPoints>0});
const bg=$('#background');bg.muted=true;bg.defaultMuted=true;bg.autoplay=true;bg.loop=true;bg.playsInline=true;bg.preload='auto';bg.poster=C.background.poster;bg.src=C.background.video;
function playBackground(){if(!document.hidden)bg.play().catch(()=>{})}
bg.addEventListener('canplay',playBackground);bg.addEventListener('error',()=>{console.error('Background video failed:',bg.currentSrc,bg.error?.code)});
document.addEventListener('pointerdown',playBackground,{once:true});document.addEventListener('keydown',playBackground,{once:true});
const music=$('#ambientMusic'),musicToggle=$('#musicToggle'),soundDock=$('#soundDock'),mixer=$('#musicMixer'),slider=$('#musicVolume'),muteButton=$('#mixerMute');
let musicWanted=true,volume=15,lastVolume=15,audioContext=null,gainNode=null,mixerOpen=false;
try{const saved=JSON.parse(localStorage.getItem('godlyecho.sound')||'null');if(saved){volume=Math.max(0,Math.min(100,Number(saved.volume)||0));lastVolume=Math.max(1,Math.min(100,Number(saved.lastVolume)||15));musicWanted=saved.enabled===true&&volume>0}}catch{}
function saveSound(){try{localStorage.setItem('godlyecho.sound',JSON.stringify({enabled:musicWanted,volume,lastVolume}))}catch{}}
music.src=C.music.src;music.preload='auto';music.volume=volume/100;
function applyGain(){if(gainNode)gainNode.gain.setTargetAtTime(volume/100,audioContext.currentTime,.025);else music.volume=volume/100}
function prepareAudio(){
 // A MediaElementAudioSource for file:// can be CORS-silenced. Use native audio there.
 if(location.protocol!=='file:'&&!audioContext){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)try{audioContext=new Audio();gainNode=audioContext.createGain();gainNode.gain.value=volume/100;const source=audioContext.createMediaElementSource(music);source.connect(gainNode);gainNode.connect(audioContext.destination);music.volume=1;audioContext.addEventListener('statechange',updateMusicButton)}catch{gainNode=null;audioContext=null}}
 if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});applyGain();
}
function updateMusicButton(){
 const muted=!musicWanted||volume===0;
 soundDock.classList.toggle('is-muted',muted);
 musicToggle.setAttribute('aria-label','Открыть регулятор громкости'+(muted?' — звук выключен':''));
 musicToggle.title=C.music.title;
 muteButton.setAttribute('aria-pressed',String(muted));
 muteButton.setAttribute('aria-label',muted?'Включить музыку':'Выключить музыку');
}
function pauseMusic(){music.pause();updateMusicButton()}
function playMusic(){if(!entered||!musicWanted||volume===0||document.hidden||($('#viewer').open&&$('#viewer').dataset.type==='video'))return;music.play().then(()=>{if(!musicWanted||document.hidden||($('#viewer').open&&$('#viewer').dataset.type==='video'))music.pause();updateMusicButton()}).catch(error=>{updateMusicButton();console.warn('Music playback pending user interaction:',error.name)})}
function syncVolume(){slider.value=String(volume);slider.style.setProperty('--level',volume+'%');slider.setAttribute('aria-valuetext',volume+'%');$('#volumeValue').value=volume+'%'}
function setVolume(value){volume=Math.max(0,Math.min(100,Number(value)||0));if(volume>0)lastVolume=volume;musicWanted=volume>0;syncVolume();saveSound();prepareAudio();if(musicWanted)playMusic();else pauseMusic();updateMusicButton()}
function toggleMute(){setVolume(musicWanted&&volume>0?0:lastVolume||15)}
function openMixer(open){
 mixerOpen=open;soundDock.classList.toggle('open',open);mixer.inert=!open;
 mixer.setAttribute('aria-hidden',String(!open));
 musicToggle.setAttribute('aria-expanded',String(open));
 if(open)muteButton.focus({preventScroll:true});
 musicToggle.inert=open;
}
slider.addEventListener('input',()=>setVolume(slider.value));muteButton.onclick=toggleMute;
musicToggle.onclick=()=>openMixer(true);
document.addEventListener('pointerdown',event=>{if(mixerOpen&&!event.target.closest('.sound-dock'))openMixer(false)});
soundDock.addEventListener('focusout',event=>{if(mixerOpen&&!soundDock.contains(event.relatedTarget))openMixer(false)});
soundDock.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();openMixer(false);musicToggle.focus({preventScroll:true})}});
music.addEventListener('play',updateMusicButton);music.addEventListener('pause',updateMusicButton);music.addEventListener('error',()=>console.error('Audio failed:',music.currentSrc,music.error?.code));
motion.addEventListener('change',()=>{paint();scrollSelection(current,false);playBackground()});
$('#enterSite').onclick=event=>{if(entered)return;const keyboard=event.detail===0;entered=true;prepareAudio();playMusic();playBackground();$('#enterSite').disabled=true;$('#entryScreen').classList.add('leaving');document.body.classList.remove('entry-pending');$('#xmb').inert=false;$('.controls').inert=false;soundDock.inert=false;paint();setTimeout(()=>{$('#entryScreen').hidden=true;if(keyboard)tabs[current].focus({preventScroll:true})},motion.matches?120:450)};
document.addEventListener('visibilitychange',()=>{if(document.hidden){bg.pause();pauseMusic();openMixer(false)}else{playBackground();playMusic()}});
syncVolume();updateMusicButton();updateInputHint();layoutLists();paint();scrollSelection(current,false);playBackground();$('#enterSite').focus({preventScroll:true});
})();
