// --- ゲームの基本設定（ここで難易度などを調整できます） ---
const NOTE_SPEED = 3.5;       // ノーツが落ちる速さ
const PERFECT_WINDOW = 0.05;  // Perfect判定になる時間の猶予（±0.05秒）
const GREAT_WINDOW = 0.10;   // Great判定になる時間の猶予（±0.10秒）
const MISS_WINDOW = 0.20;    // この時間を過ぎるとMissになる

// --- 譜面データ（魔王魂「Shining Star」30秒分） ---
const beatmap = [
    { time: 1.30, lane: 0 }, { time: 1.62, lane: 1 }, { time: 1.95, lane: 2 },
    { time: 2.27, lane: 1 }, { time: 2.60, lane: 0 }, { time: 2.92, lane: 2 },
    { time: 3.25, lane: 1 }, { time: 3.57, lane: 0 }, { time: 3.90, lane: 2 },
    { time: 4.22, lane: 1 }, { time: 4.55, lane: 0 }, { time: 4.55, lane: 2 },
    { time: 5.20, lane: 1 }, { time: 5.85, lane: 0 }, { time: 6.17, lane: 1 },
    { time: 6.50, lane: 2 }, { time: 6.82, lane: 0 }, { time: 6.82, lane: 2 },
    { time: 7.47, lane: 1 }, { time: 7.80, lane: 0 }, { time: 8.12, lane: 2 },
    { time: 8.45, lane: 1 }, { time: 8.77, lane: 0 }, { time: 9.10, lane: 2 },
    { time: 9.42, lane: 1 }, { time: 9.75, lane: 0 }, { time: 9.75, lane: 2 },
];

// --- ゲームの状態を管理する変数 ---
let mySound;
let notes = [];
let beatmapIndex = 0;
let score = 0;
let combo = 0;
let maxCombo = 0;
let judgmentText = "";
let judgmentColor = {};
let judgmentAlpha = 0;
const laneKeys = ['a', 's', 'd'];
let isGameStarted = false;

function preload() {
    mySound = loadSound('maou_14_shining_star.mp3');
}

function setup() {
    createCanvas(300, 500);
    textAlign(CENTER, CENTER);
    
    background(30);
    fill(255);
    textSize(20);
    text("画面をクリックしてスタート", 150, 250);
}

function mousePressed() {
    if (!isGameStarted) {
        isGameStarted = true;
        mySound.play();
    }
}

function draw() {
    if (!isGameStarted) return;

    let elapsedTime = mySound.currentTime();
    
    if (beatmapIndex < beatmap.length && elapsedTime >= beatmap[beatmapIndex].time - 2.0) {
        let currentNoteData = beatmap[beatmapIndex];
        let newNote = {
            lane: currentNoteData.lane,
            time: currentNoteData.time,
            isHit: false
        };
        notes.push(newNote);
        beatmapIndex++;
    }

    background(30);
    drawLanesAndJudgeLine();
    
    for (let i = notes.length - 1; i >= 0; i--) {
        let note = notes[i];
        if (!note.isHit && elapsedTime > note.time + MISS_WINDOW) {
            note.isHit = true;
            showJudgment("Miss");
            resetCombo();
        }
        if (!note.isHit) {
            let y = 450 + (note.time - elapsedTime) * 60 * NOTE_SPEED;
            drawNote(note.lane, y);
        }
        if (note.isHit && elapsedTime > note.time + 1.0) {
            notes.splice(i, 1);
        }
    }
    
    drawUI(elapsedTime);
    drawJudgment();
}

function keyPressed() {
    if (!isGameStarted) return;
    let laneToPress = laneKeys.indexOf(key);
    if (laneToPress === -1) return;

    let elapsedTime = mySound.currentTime();
    let bestNoteIndex = -1;
    let minTimeDiff = Infinity;

    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        if (!note.isHit && note.lane === laneToPress) {
            let timeDiff = Math.abs(note.time - elapsedTime);
            if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                bestNoteIndex = i;
            }
        }
    }

    if (bestNoteIndex !== -1 && minTimeDiff < MISS_WINDOW) {
        let noteToHit = notes[bestNoteIndex];
        noteToHit.isHit = true;

        if (minTimeDiff <= PERFECT_WINDOW) {
            addScore(1000);
            addCombo();
            showJudgment("Perfect");
        } else if (minTimeDiff <= GREAT_WINDOW) {
            addScore(500);
            addCombo();
            showJudgment("Great");
        } else {
            showJudgment("Miss");
            resetCombo();
        }
    }
}

function drawLanesAndJudgeLine() {
    stroke(80);
    line(100, 0, 100, 500);
    line(200, 0, 200, 500);
    strokeWeight(3);
    stroke(255, 0, 0, 200);
    line(0, 450, 300, 450);
    strokeWeight(1);
}

function drawNote(lane, y) {
    fill(150, 150, 255);
    noStroke();
    rect(lane * 100, y - 10, 100, 20);
}

function drawUI(elapsedTime) {
    fill(255);
    textSize(24);
    textAlign(LEFT, TOP);
    text("SCORE: " + score, 10, 10);
    textAlign(RIGHT, TOP);
    text("MAX COMBO: " + maxCombo, 290, 10);

    if (combo > 1) {
        textAlign(CENTER, CENTER);
        textSize(48);
        text(combo, 150, 200);
    }
}

function drawJudgment() {
    if (judgmentAlpha > 0) {
        fill(judgmentColor.r, judgmentColor.g, judgmentColor.b, judgmentAlpha);
        textSize(40);
        textAlign(CENTER, CENTER);
        text(judgmentText, 150, 250);
        judgmentAlpha -= 5;
    }
}

function showJudgment(text) {
    judgmentText = text;
    judgmentAlpha = 255;
    if (text === "Perfect") judgmentColor = { r: 255, g: 224, b: 32 };
    else if (text === "Great") judgmentColor = { r: 32, g: 255, b: 32 };
    else judgmentColor = { r: 128, g: 128, b: 128 };
}

function addScore(points) {
    score += points;
}

function addCombo() {
    combo++;
    if (combo > maxCombo) {
        maxCombo = combo;
    }
}

function resetCombo() {
    combo = 0;
}
