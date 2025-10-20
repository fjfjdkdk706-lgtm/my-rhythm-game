// --- ゲームの基本設定 ---
const NOTE_SPEED = 3.5;
const PERFECT_WINDOW = 0.05;
const GREAT_WINDOW = 0.10;
const MISS_WINDOW = 0.20;

// --- 譜面データ ---
const beatmap = [
    { time: 1.30, lane: 0 }, { time: 1.62, lane: 1 }, { time: 1.95, lane: 2 },
    { time: 2.27, lane: 1 }, { time: 2.60, lane: 0 }, { time: 2.92, lane: 2 },
    { time: 3.25, lane: 1 }, { time: 3.57, lane: 0 }, { time: 3.90, lane: 2 },
    { time: 4.22, lane: 1 }, { time: 4.55, lane: 0 }, { time: 4.55, lane: 2 },
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
let isSoundReady = false; // ★追加：音楽の準備ができたかを管理する旗

function preload() {
    // ★変更：読み込み完了後に実行する関数(soundReadyCallback)を指定
    mySound = loadSound('shining_star.mp3', soundReadyCallback);
}

// ★追加：音楽の読み込みが100%完了したときに自動で呼ばれる関数
function soundReadyCallback() {
    isSoundReady = true; // 準備完了の旗を立てる
    console.log("音楽の準備が完了しました！");
}

function setup() {
    createCanvas(300, 500);
    textAlign(CENTER, CENTER);
}

function mousePressed() {
    // ★変更：ゲームが始まっておらず、"かつ"、音楽の準備ができている場合のみ実行
    if (!isGameStarted && isSoundReady) {
        isGameStarted = true;
        mySound.play();
    }
}

function draw() {
    background(30);

    // ゲームが開始されていない場合
    if (!isGameStarted) {
        fill(255);
        textSize(20);
        // ★変更：音楽の準備状態に応じてメッセージを切り替える
        if (!isSoundReady) {
            text("Now Loading...", 150, 250);
        } else {
            text("画面をクリックしてスタート", 150, 250);
        }
        return; // ゲームが始まっていないので、ここで処理を中断
    }
    
    // --- 以下、ゲーム開始後の処理 ---
    
    let elapsedTime = mySound.currentTime();
    
    if (beatmapIndex < beatmap.length && elapsedTime >= beatmap[beatmapIndex].time - 2.0) {
        let currentNoteData = beatmap[beatmapIndex];
        let newNote = { lane: currentNoteData.lane, time: currentNoteData.time, isHit: false };
        notes.push(newNote);
        beatmapIndex++;
    }

    drawLanesAndJudgeLine();
    
    for (let i = notes.length - 1; i >= 0; i--) {
        let note = notes[i];
        if (!note.isHit && elapsedTime > note.time + MISS_WINDOW) {
            note.isHit = true; showJudgment("Miss"); resetCombo();
        }
        if (!note.isHit) {
            let y = 450 + (note.time - elapsedTime) * 60 * NOTE_SPEED;
            drawNote(note.lane, y);
        }
        if (note.isHit && elapsedTime > note.time + 1.0) {
            notes.splice(i, 1);
        }
    }
    
    drawUI();
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
            if (timeDiff < minTimeDiff) { minTimeDiff = timeDiff; bestNoteIndex = i; }
        }
    }

    if (bestNoteIndex !== -1 && minTimeDiff < MISS_WINDOW) {
        let noteToHit = notes[bestNoteIndex];
        noteToHit.isHit = true;
        if (minTimeDiff <= PERFECT_WINDOW) { addScore(1000); addCombo(); showJudgment("Perfect"); }
        else if (minTimeDiff <= GREAT_WINDOW) { addScore(500); addCombo(); showJudgment("Great"); }
        else { showJudgment("Miss"); resetCombo(); }
    }
}

// --- サブ関数群 (変更なし) ---
function drawLanesAndJudgeLine() {
    stroke(80); line(100, 0, 100, 500); line(200, 0, 200, 500);
    strokeWeight(3); stroke(255, 0, 0, 200); line(0, 450, 300, 450); strokeWeight(1);
}
function drawNote(lane, y) { fill(150, 150, 255); noStroke(); rect(lane * 100, y - 10, 100, 20); }
function drawUI() {
    fill(255); textSize(24);
    textAlign(LEFT, TOP); text("SCORE: " + score, 10, 10);
    textAlign(RIGHT, TOP); text("MAX COMBO: " + maxCombo, 290, 10);
    if (combo > 1) { textAlign(CENTER, CENTER); textSize(48); text(combo, 150, 200); }
}
function drawJudgment() {
    if (judgmentAlpha > 0) {
        fill(judgmentColor.r, judgmentColor.g, judgmentColor.b, judgmentAlpha);
        textSize(40); textAlign(CENTER, CENTER); text(judgmentText, 150, 250);
        judgmentAlpha -= 5;
    }
}
function showJudgment(text) {
    judgmentText = text; judgmentAlpha = 255;
    if (text === "Perfect") judgmentColor = { r: 255, g: 224, b: 32 };
    else if (text === "Great") judgmentColor = { r: 32, g: 255, b: 32 };
    else judgmentColor = { r: 128, g: 128, b: 128 };
}
function addScore(points) { score += points; }
function addCombo() { combo++; if (combo > maxCombo) { maxCombo = combo; } }
function resetCombo() { combo = 0; }
