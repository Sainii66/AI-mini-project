let gestureChanges=0;
let commandLocked=false;

let threatIndex=0;
let systemMode="NORMAL";

let logData=[];

let systemStarted=false;

let lastGesture="";
let stableCount=0;

let confirmedGesture="No Hand";

/* NEW gesture hold */
let gestureHold=false;
let gestureHoldTime=1500;

let model,webcam;

let authenticated=false;

let passwordSequence=[
"Fist",
"Palm",
"Two Fingers"
];

let userSequence=[];


/* ========================= */

async function init(){

if(systemStarted){
return;
}

systemStarted=true;

document.getElementById(
"startBtn"
).disabled=true;

document.getElementById(
"startBtn"
).innerText=
"System Running";

let boot=
document.getElementById(
"bootScreen"
);

if(boot){
boot.style.display="flex";
}

setTimeout(async function(){

if(boot){
boot.style.display="none";
}

model=
await tmImage.load(
"model/model.json",
"model/metadata.json"
);

webcam=
new tmImage.Webcam(
400,
400,
true
);

await webcam.setup();

await webcam.play();

document.getElementById(
"webcam-container"
).appendChild(
webcam.canvas
);

window.requestAnimationFrame(
loop
);

},2500);

}


/* ========================= */

async function loop(){

webcam.update();

await predict();

window.requestAnimationFrame(
loop
);

}


/* ========================= */

async function predict(){

const prediction=
await model.predict(
webcam.canvas
);

let highest=
prediction.reduce(
(a,b)=>
a.probability>b.probability
?a:b
);

let gesture="No Hand";

if(
highest.probability>.95
){
gesture=
highest.className;
}

/* stabilization */
if(
gesture===lastGesture
){
stableCount++;
}
else{
stableCount=0;
gestureChanges++;
}

lastGesture=gesture;


/* NEW COOLDOWN FILTER */
if(
stableCount>=7 &&
!gestureHold
){

confirmedGesture=
gesture;

/* freeze gesture */
gestureHold=true;

setTimeout(function(){

gestureHold=false;

},gestureHoldTime);

}


/* anomaly */
if(
authenticated &&
gestureChanges>8
){

addLog(
"Anomaly Detected"
);

threatIndex+=15;

if(
threatIndex>100
){
threatIndex=100;
}

gestureChanges=0;

}


/* update gesture display */

let gbox=
document.getElementById(
"gesture"
);

if(gbox){

gbox.innerText=
"Detected: "+
confirmedGesture;

}

let authGestureBox=
document.getElementById(
"authGesture"
);

if(authGestureBox){

authGestureBox.innerText=
confirmedGesture;

}


/* auth first */
checkPassword(
confirmedGesture
);

/* then commands */
if(authenticated){

mapCommand(
confirmedGesture
);

}

}


/* ========================= */

function mapCommand(g){

if(commandLocked){
return;
}

let cmd="None";

if(g=="Fist"){

cmd=
"LOCK DOORS";

systemMode=
"LOCKDOWN";

threatIndex+=10;

addLog(
"Lockdown Activated"
);

}

if(g=="Palm"){

cmd=
"EMERGENCY ALARM";

systemMode=
"DEFENSE";

threatIndex+=20;

addLog(
"Emergency Alarm"
);

}

if(g=="Two Fingers"){

cmd=
"SCAN MODE";

systemMode=
"SCAN";

addLog(
"Scan Initiated"
);

}

if(g=="Thumbs Up"){

cmd=
"ACTIVATE SYSTEM";

systemMode=
"NORMAL";

threatIndex-=15;

if(
threatIndex<0
){
threatIndex=0;
}

addLog(
"Threat Reduced"
);

}

if(g=="No Hand"){
cmd="None";
}

if(
threatIndex>100
){
threatIndex=100;
}

document.getElementById(
"commandBox"
).innerText=
"Command: "+cmd;

document.getElementById(
"threatBox"
).innerText=
"Threat Index: "+
threatIndex+
"%";

document.getElementById(
"modeBox"
).innerText=
"Mode: "+
systemMode;

/* security */

let level="GREEN";

if(threatIndex>30){
level="AMBER";
}

if(threatIndex>60){
level="RED";
}

document.getElementById(
"securityBox"
).innerText=
"Security Level: "+
level;

/* alert mode */

if(threatIndex>60){

document.body.classList.add(
"alertMode"
);

}
else{

document.body.classList.remove(
"alertMode"
);

}

document.getElementById(
"statusBox"
).innerText=
"System Status: "+
systemMode+
" Active";

/* command cooldown */
commandLocked=true;

setTimeout(function(){

commandLocked=false;

},2000);

}


/* ========================= */

function addLog(msg){

logData.unshift(msg);

if(
logData.length>5
){
logData.pop();
}

let box=
document.getElementById(
"logBox"
);

if(box){

box.innerHTML=
"System Logs:<br>"+
logData.join("<br>");

}

}


/* ========================= */

function checkPassword(g){

if(authenticated) return;

if(g=="No Hand") return;

/* ignore repeats */
if(
userSequence.length>0 &&
userSequence[
userSequence.length-1
]===g
){
return;
}

let expected=
passwordSequence[
userSequence.length
];

if(
g===expected
){

userSequence.push(g);

addLog(
"Step "+
userSequence.length+
" Accepted"
);

if(
userSequence.length===3
){

authenticated=true;

document.getElementById(
"authBox"
).innerText=
"Authentication: GRANTED";

document.getElementById(
"authBox"
).style.borderColor=
"#8a7dff";

addLog(
"Access Granted"
);

let grant=
document.getElementById(
"grantOverlay"
);

if(grant){
grant.style.display="flex";
}

setTimeout(function(){

if(grant){
grant.style.display="none";
}

/* move webcam */
document.getElementById(
"webcam-container2"
).appendChild(
webcam.canvas
);

document.getElementById(
"mainDashboard"
).style.display=
"block";

document.getElementById(
"authScreen"
).style.display=
"none";

document.body.classList.add(
"secureMode"
);

},1200);

}

return;

}

/* wrong password resets */
userSequence=[];

addLog(
"Authentication Failed"
);

}


/* ========================= */

setInterval(function(){

if(threatIndex>0){

threatIndex--;

let t=
document.getElementById(
"threatBox"
);

if(t){

t.innerText=
"Threat Index: "+
threatIndex+
"%";

}

}

},3000);


/* ========================= */

setInterval(function(){

let box=
document.getElementById(
"telemetryBox"
);

if(!box) return;

box.innerHTML=

"CPU: "+
(30+Math.floor(
Math.random()*50
))+
"%<br>"+

"Nodes: "+
(10+Math.floor(
Math.random()*15
))+
"<br>"+

"Integrity: "+
(80+Math.floor(
Math.random()*20
))+
"%";

},1000);


/* ========================= */

function resetSystem(){

threatIndex=0;

systemMode=
"NORMAL";

document.getElementById(
"threatBox"
).innerText=
"Threat Index: 0%";

document.getElementById(
"modeBox"
).innerText=
"Mode: NORMAL";

document.body.classList.remove(
"alertMode"
);

addLog(
"Threat Reset"
);

}