let button = document.getElementById("main-btn");
let buttonText = document.getElementById("main-btn-text");
let screen = document.getElementById("main-screen");
let counter = document.getElementById("counter");

let results = [];
let step = 0;
let waiting = false;
let ready = false;
let startTime;
let timeoutId;

let resultTable = document.getElementById("result-table");

button.addEventListener("click", function() {
    if (step === 0) {
        startCycle();
    } else if (waiting && !ready) {
        resetTest("Ви натиснули занадто рано! Тест починається спочатку!");
    } else if (ready) {
        recordResult();
    }
});

function startCycle() {
    step = 1;
    buttonText.textContent = "Фіксація";
    counter.textContent = "Крок " + step + " / 5";
    nextRed();
}

function nextRed() {
    screen.style.background = "var(--theme-screen-stop-color)";
    waiting = true;
    ready = false;

    let delay = Math.floor(Math.random() * 1600) + 800;
    timeoutId = setTimeout(nextGreen, delay);
}

function nextGreen() {
    screen.style.background = "var(--theme-screen-wait-color)";
    startTime = Date.now();
    waiting = false;
    ready = true;
}

function recordResult() {
    let reactionTime = Date.now() - startTime;
    results.push(reactionTime);
    ready = false;

    if (step < 5) {
        step++;
        counter.textContent = "Крок " + step + " / 5";
        nextRed();
    } else {
        fillTable();
        animateTable();
        resetAll();
    }
}

function resetTest(message) {
    clearTimeout(timeoutId);
    alert(message);
    resetAll();
}

function resetAll() {
    step = 0;
    results = [];
    screen.style.background = "var(--theme-main-screen-bg-color)";
    buttonText.textContent = "Почати тест";
    counter.textContent = "Крок 0 / 5";
    waiting = false;
    ready = false;
}

function fillTable() {
    let min = Math.min(...results);
    let max = Math.max(...results);

    let avg = results.reduce((a, b) => a + b, 0) / results.length;

    let sorted = [...results].sort((a, b) => a - b);
    let mid = Math.floor(sorted.length / 2);
    let median =
        sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;

    let variance =
        results.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / results.length;
    let stdDev = Math.sqrt(variance);

    document.querySelector('tr[data-id="r1"] td:last-child').textContent =
        results.join(" мс, ") + " мс";
    document.querySelector('tr[data-id="r2"] td:last-child').textContent =
        min + " / " + max + " мс";
    document.querySelector('tr[data-id="r3"] td:last-child').textContent =
        avg.toFixed(2) + " мс";
    document.querySelector('tr[data-id="r4"] td:last-child').textContent =
        median + " мс";
    document.querySelector('tr[data-id="r5"] td:last-child').textContent =
        stdDev.toFixed(2) + " мс";
}

function animateTable() {
    resultTable.classList.add("highlight");
    setTimeout(() => {
        resultTable.classList.remove("highlight");
    }, 2000);
}