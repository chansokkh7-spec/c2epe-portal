/* ---------- leveled books (A1–C2): lessons + level test ---------- */
var SKI={listening:'🎧',reading:'📖',speaking:'🎤',writing:'✍️',grammar:'🧩'};
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function bReport(T,key,title,score,total,self){
  var me=who()||{name:'(no name)',cls:'',studentId:'',login:false},now=new Date();
  send({prefix:'ielts',level:'IELTS '+T.level+' '+cap(T.skill),setId:T.id+'-'+key,setTitle:T.title+' · '+title,kind:'exam',exam:'IELTS '+T.level,section:T.skill,band:null,selfAssessed:!!self,
    studentId:me.studentId,studentName:me.name,cls:me.cls,login:!!me.login,score:score,total:total,pct:Math.round(score*100/Math.max(1,total)),attempt:1,at:now.toISOString(),day:now.toISOString().slice(0,10)});
}
function bBest(T,key,o){var k='ep-best-'+T.id+'-'+key,b=jget(k,null);if(!b||o.score>=b.score)store(k,JSON.stringify(o));}
function bGet(T,key){return jget('ep-best-'+T.id+'-'+key,null);}
function bookRoute(T,p){
  var seg=p[2];if(!seg)return bookHome(T);
  if(seg==='test')return bookTest(T);
  var n=parseInt(seg.slice(1),10),L=T.lessons[n-1];if(!L)return bookHome(T);
  bookLesson(T,L);
}
function bookHome(T){
  $('sub').textContent=T.title;
  var h=needName()+'<h2>'+SKI[T.skill]+' '+esc(T.title)+'</h2><p class="small">'+esc(T.about||'')+'</p><div class="grid">';
  T.lessons.forEach(function(L){var b=bGet(T,'L'+L.n);
    h+='<div class="card btn" onclick="go(\'#/'+location.hash.split('/')[1]+'/'+T.id+'/L'+L.n+'\')"><div class="small">Lesson '+L.n+'</div><h3>'+esc(L.title)+'</h3><div>'+(b?'Best: <b>'+b.score+' / '+b.total+'</b>':'<span class="tag soon">Not done yet</span>')+'</div></div>';});
  var tb=bGet(T,'test');
  h+='<div class="card btn" style="border:2px solid var(--gold)" onclick="go(\'#/'+location.hash.split('/')[1]+'/'+T.id+'/test\')"><div class="small">IELTS-style</div><h3>🏁 Level Test</h3><div class="small">'+esc(T.test.info||'')+'</div><div style="margin-top:6px">'+(tb?'Best: <b>'+tb.score+' / '+tb.total+'</b> ('+Math.round(tb.score*100/tb.total)+'%)':'<span class="tag soon">Not done yet</span>')+'</div></div></div>';
  main.innerHTML=h;
}
function vocabHTML(v){return v&&v.length?'<div class="card" style="margin-bottom:10px"><b>Key words</b><div class="row" style="margin-top:6px">'+v.map(function(x){return '<span class="tag" style="background:#eef2fb;color:#24407f;font-size:14px;padding:3px 10px">'+esc(x[0])+' · '+esc(x[1])+'</span>';}).join('')+'</div></div>':'';}
function ruleHTML(r){return r?'<div class="card" style="margin-bottom:10px;border-left:5px solid var(--gold)"><b>Grammar rule</b><ul style="margin:6px 0">'+r.en.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul><div style="background:#fffaf0;border-radius:8px;padding:6px 10px;font-size:15px">'+r.km.map(function(x){return '<div>'+esc(x)+'</div>';}).join('')+'</div><div class="small" style="margin-top:6px"><b>Examples:</b> '+r.ex.map(esc).join(' &nbsp;·&nbsp; ')+'</div></div>':'';}
function paraHTML(t){return '<div class="pass" style="max-height:none"><h3>'+esc(t.title)+'</h3>'+t.paras.map(function(x){return '<p>'+esc(x[1])+'</p>';}).join('')+'</div>';}
function scriptHTML(sc){return '<details class="script" style="margin:8px 0" open><summary><b>Transcript</b></summary>'+sc.map(function(l){return '<p>'+esc(l[1])+'</p>';}).join('')+'</details>';}
function bRecBox(id){return '<div class="rec"><button class="btn2 alt" onclick="bkRec(\''+id+'\',this)">🎙 Record my answer</button> <audio id="pl'+id+'" controls style="display:none;width:100%"></audio></div>';}
var bRecs={};
window.bkRec=function(id,btn){
  if(!navigator.mediaDevices||!window.MediaRecorder){alert('Recording is not supported on this device.');return;}
  if(bRecs[id]&&bRecs[id].state==='recording'){bRecs[id].stop();btn.textContent='🎙 Record again';return;}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){var ch=[],r=new MediaRecorder(st);bRecs[id]=r;
    r.ondataavailable=function(e){ch.push(e.data);};r.onstop=function(){st.getTracks().forEach(function(t){t.stop();});var a=$('pl'+id);a.src=URL.createObjectURL(new Blob(ch,{type:r.mimeType}));a.style.display='block';};
    r.start();btn.textContent='⏹ Stop';}).catch(function(){alert('Please allow microphone access.');});
};
function spQ(q,id){return '<div class="q"><b>'+esc(q.q)+'</b>'+(q.au?'<audio controls preload="none" src="'+AUDIO+q.au+'"></audio>':'')+bRecBox(id)+'<details><summary>Model answer</summary><div class="model">'+esc(q.a)+'</div></details></div>';}
function cueHTML(c,id){return '<div class="grp"><h4>Talk about it · 1 minute</h4><div class="card"><b>'+esc(c.prompt)+'</b><br>You should say:<ul>'+c.bullets.map(function(b){return '<li>'+esc(b)+'</li>';}).join('')+'</ul>'+(c.au?'<audio controls preload="none" src="'+AUDIO+c.au+'"></audio>':'')+'</div><div class="row" style="margin:8px 0"><button class="btn2 alt" onclick="startTimer(1,function(){})">Start 1-minute talk timer</button></div>'+bRecBox(id)+'<details><summary>Model answer</summary><div class="model">'+(c.mau?'<audio controls preload="none" src="'+AUDIO+c.mau+'"></audio>':'')+'<p>'+esc(c.model)+'</p></div></details></div>';}
function wBlock(T,key,t,min){
  var dk='ep-w-'+T.id+'-'+key;
  return '<div class="grp"><h4>✍️ '+esc(t.title||'Writing task')+'</h4><div class="card"><p>'+esc(t.prompt)+'</p>'+(t.table?'<table style="border-collapse:collapse;margin:6px 0">'+t.table.map(function(r,i){return '<tr>'+r.map(function(c){return '<'+(i?'td':'th')+' style="border:1px solid #c9d2e8;padding:4px 10px">'+esc(c)+'</'+(i?'td':'th')+'>';}).join('')+'</tr>';}).join('')+'</table>':'')+'<span class="small">Write at least '+min+' words.</span></div>'
   +'<textarea id="wt'+key+'" style="min-height:170px" placeholder="Write here…">'+esc(store(dk)||'')+'</textarea><div class="row"><b id="wc'+key+'"></b></div>'
   +'<div class="row" style="margin:8px 0"><button class="btn2 gold" onclick="bkModel(\''+key+'\')">Show model answer &amp; self-check</button></div><div id="wm'+key+'"></div></div>';
}
function wInit(T,key,min){var ta=$('wt'+key),dk='ep-w-'+T.id+'-'+key;if(!ta)return;function u(){var n=wc(ta.value);$('wc'+key).textContent=n+' words'+(n>=min?' ✅':'');store(dk,ta.value);}ta.oninput=u;u();}
var BK={};
window.bkModel=function(key){
  var o=BK[key],h='<div class="model"><b>Model answer</b>'+o.model.map(function(p){return '<p>'+esc(p)+'</p>';}).join('')+'</div><div class="card chk"><b>Self-check</b> <span class="small">· tick what you did</span>'+o.check.map(function(c){return '<div style="margin-top:6px"><b>'+esc(c[0])+'</b>'+c[1].map(function(x){return '<label><input type="checkbox" class="ck'+key+'"> '+esc(x)+'</label>';}).join('')+'</div>';}).join('')+'<button class="btn2" style="margin-top:8px" onclick="bkWSave(\''+key+'\')">Save</button> <span class="small" id="wsv'+key+'"></span></div>';
  $('wm'+key).innerHTML=h;
};
window.bkWSave=function(key){var o=BK[key],cks=document.querySelectorAll('.ck'+key),n=[].filter.call(cks,function(c){return c.checked;}).length;
  $('wsv'+key).textContent='✔ Saved · '+n+' / '+cks.length+' ticked';bReport(o.T,'W'+key,'Writing self-check '+key,n,cks.length,true);};
function bookLesson(T,L){
  $('sub').textContent=T.title+' · Lesson '+L.n;
  var sk=T.skill,fam=location.hash.split('/')[1],h=needName()+'<h2>'+SKI[sk]+' Lesson '+L.n+' · '+esc(L.title)+'</h2>';
  h+=ruleHTML(L.rule);
  if(sk==='reading'){h+=(L.audio?'<div class="card" style="margin-bottom:10px">🔊 Listen and read <audio controls preload="none" src="'+AUDIO+L.audio+'"></audio></div>':'')+vocabHTML(L.vocab)+paraHTML(L.text);}
  if(sk==='listening'){h+='<div class="card" style="margin-bottom:10px"><b>🎧 Listen</b> <span class="small">· Play the audio as many times as you need in a lesson.</span><audio controls preload="none" src="'+AUDIO+L.audio+'"></audio></div>'+vocabHTML(L.vocab);}
  if(sk==='speaking'){var S=L.speaking;h+='<div class="grp"><h4>Questions</h4><div class="instr">Listen to the question, record your answer, then open the model answer.</div>'+S.part1.map(function(q,i){return spQ(q,'1-'+i);}).join('')+'</div>'+cueHTML(S.cue,'c')+'<div class="card"><b>Useful language</b>'+L.phrases.map(function(x){return '<div class="small">'+esc(x)+'</div>';}).join('')+'</div>';}
  if(sk==='writing'){}
  h+=groupsHTML(L.groups,'B');
  if(sk==='writing'){var t=L.task;BK['W']={model:t.model,check:T.checklist,T:T};h+=wBlock(T,'W'+L.n,t,t.min);BK['W'+L.n]=BK['W'];}
  h+='<div class="row" style="margin:10px 0"><button class="btn2 gold" id="bchk">Check my answers ✓</button><button class="btn2 alt" id="bagain" style="display:none">Try again ↺</button></div><div id="bres"></div>';
  main.innerHTML=h;
  if(sk==='writing')wInit(T,'W'+L.n,L.task.min);
  $('bchk').onclick=function(){
    var r=mark(L.groups,'B');$('bchk').style.display='none';$('bagain').style.display='inline-block';
    var pct=Math.round(r.score*100/r.total),msg=pct>=80?'🌟 Excellent!':pct>=60?'👍 Good work!':'💪 Keep practising — try again.';
    var nx=L.n<T.lessons.length?'<button class="btn2" onclick="go(\'#/'+fam+'/'+T.id+'/L'+(L.n+1)+'\')">Next lesson →</button>':'<button class="btn2" onclick="go(\'#/'+fam+'/'+T.id+'/test\')">Go to the Level Test →</button>';
    $('bres').innerHTML='<div class="sum"><div>Your score</div><div class="band">'+r.score+' / '+r.total+' &nbsp;·&nbsp; '+pct+'%</div><div>'+msg+'</div></div>'+(sk==='listening'?scriptHTML(L.script):'')+'<div class="row">'+nx+'</div>';
    bBest(T,'L'+L.n,{score:r.score,total:r.total});bReport(T,'L'+L.n,'Lesson '+L.n+' · '+L.title,r.score,r.total,false);
    $('bres').scrollIntoView({behavior:'smooth'});
  };
  $('bagain').onclick=function(){bookLesson(T,L);};
}
function bookTest(T){
  var X=T.test,sk=T.skill,fam=location.hash.split('/')[1];
  $('sub').textContent=T.title+' · Level Test';
  var h=needName()+'<h2>🏁 Level Test · '+esc(T.title)+'</h2><div class="row"><label><input type="checkbox" id="exm"> Exam mode ('+X.time+'-minute timer'+(sk==='listening'?'; audio plays once':'')+')</label></div>',allG=[];
  var parts=X.parts||null;
  if(parts){parts.forEach(function(p,i){
    h+='<div class="grp" style="border:2px solid #e3e8f5"><h3 style="margin:0 0 6px;color:var(--navy)">'+esc(p.title)+'</h3>';
    if(p.audio)h+='<audio id="tau'+i+'" controls preload="none" src="'+AUDIO+p.audio+'"></audio>';
    if(p.text)h+=paraHTML(p.text);
    h+=groupsHTML(p.groups,'B')+'<div id="ttr'+i+'"></div></div>';allG=allG.concat(p.groups);});}
  else if(X.groups){h+=groupsHTML(X.groups,'B');allG=X.groups;}
  if(sk==='speaking'){var S=X.speaking;
    h+='<div class="grp"><h4>Part 1 · Questions</h4>'+S.part1.map(function(q,i){return spQ(q,'1-'+i);}).join('')+'</div>'+cueHTML(S.cue,'c')+'<div class="grp"><h4>Part 3 · Discussion</h4>'+S.part3.map(function(q,i){return spQ(q,'3-'+i);}).join('')+'</div>'
     +'<div class="card chk"><b>Self-assessment</b> <span class="small">· 1 = needs work, 5 = very good</span><div class="row" style="margin-top:6px">'+['Fluency','Vocabulary','Grammar','Pronunciation'].map(function(c){return '<label>'+c+' <select class="sb">'+[5,4,3,2,1].map(function(b){return '<option value="'+b+'"'+(b===3?' selected':'')+'>'+b+'</option>';}).join('')+'</select></label>';}).join('')+'</div></div>';}
  if(sk==='writing'){X.tasks.forEach(function(t,i){BK['T'+i]={model:t.model,check:T.checklist,T:T};h+=wBlock(T,'T'+i,t,t.min);});
    h+='<div class="card chk"><b>Self-assessment of the two tasks</b> <span class="small">· 1–5 each</span><div class="row" style="margin-top:6px">'+['Task 1','Task 2'].map(function(c){return '<label>'+c+' <select class="sw">'+[5,4,3,2,1].map(function(b){return '<option value="'+b+'"'+(b===3?' selected':'')+'>'+b+'</option>';}).join('')+'</select></label>';}).join('')+'</div></div>';}
  h+='<div class="row" style="margin:10px 0"><button class="btn2 gold" id="bchk">Finish the test ✓</button><button class="btn2 alt" id="bagain" style="display:none">Try again ↺</button></div><div id="bres"></div>';
  main.innerHTML=h;
  if(sk==='writing')X.tasks.forEach(function(t,i){wInit(T,'T'+i,t.min);});
  var done=false;
  function finish(){
    if(done)return;done=true;stopTimer();document.querySelectorAll('audio').forEach(function(a){a.pause();});
    var sc=0,tot=0,self=false;
    if(allG.length){var r=mark(allG,'B');sc=r.score;tot=r.total;}
    if(sk==='speaking'){[].forEach.call(document.querySelectorAll('.sb'),function(s){sc+=parseInt(s.value,10);tot+=5;});self=true;}
    if(sk==='writing'){[].forEach.call(document.querySelectorAll('.sw'),function(s){sc+=parseInt(s.value,10);tot+=5;});self=true;}
    if(sk==='listening'&&parts)parts.forEach(function(p,i){$('ttr'+i).innerHTML=scriptHTML(p.script);});
    var pct=Math.round(sc*100/tot),lv=pct>=80?'🌟 Excellent — ready for the next level!':pct>=60?'👍 Good — review the lessons you missed.':'💪 Keep practising — repeat the lessons, then try again.';
    $('bres').innerHTML='<div class="sum"><div>Level Test score'+(self?' (includes self-assessment)':'')+'</div><div class="band">'+sc+' / '+tot+' &nbsp;·&nbsp; '+pct+'%</div><div>'+lv+'</div></div>';
    $('bchk').style.display='none';$('bagain').style.display='inline-block';
    bBest(T,'test',{score:sc,total:tot});bReport(T,'test','Level Test',sc,tot,self);$('bres').scrollIntoView({behavior:'smooth'});
  }
  $('bchk').onclick=finish;$('bagain').onclick=function(){bookTest(T);};
  $('exm').onchange=function(){
    if(this.checked){startTimer(X.time,finish);
      if(sk==='listening'&&parts){document.querySelectorAll('audio').forEach(function(a){a.controls=false;});var seq=0,pl=function(){var a=$('tau'+seq);if(!a)return;a.play().catch(function(){});a.onended=function(){seq++;pl();};};
        var b=document.createElement('button');b.className='btn2';b.textContent='▶ Start the recording';b.onclick=function(){b.remove();pl();};this.parentNode.parentNode.appendChild(b);}}
    else stopTimer();
  };
}
