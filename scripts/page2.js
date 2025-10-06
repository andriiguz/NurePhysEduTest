let button = document.getElementById("main-btn");
let buttonText = document.getElementById("main-btn-text");
let counter = document.getElementById("counter");

let results = [];
let step = 0;
let waiting = false;
let ready = false;
let startTime;
let timeoutId;

// таблиця
let resultTable = document.getElementById("result-table");

// звук
let beep = new Audio("./../sounds/beep_short.mp3"); // поклади свій файл у папку sounds

button.addEventListener("click", function() {
    if (step === 0) {
        startCycle();
    } else if (waiting && !ready) {
        resetTest("Ви натиснули занадто рано! Тест починається спочатку!");
    } else if (ready) {
        recordResult();
    }
});

// почати цикл
function startCycle() {
    step = 1;
    buttonText.textContent = "Фіксація";
    counter.textContent = "Крок " + step + " / 5";
    nextWait();
}

// очікування сигналу
function nextWait() {
    waiting = true;
    ready = false;

    let delay = Math.floor(Math.random() * 1600) + 800; // 500–1000 мс
    timeoutId = setTimeout(playBeep, delay);
}

// відтворення сигналу
function playBeep() {
    beep.currentTime = 0;
    beep.play();
    startTime = Date.now();
    waiting = false;
    ready = true;
}

// натиснув вчасно
function recordResult() {
    let reactionTime = Date.now() - startTime;
    results.push(reactionTime);
    ready = false;

    if (step < 5) {
        step++;
        counter.textContent = "Крок " + step + " / 5";
        nextWait();
    } else {
        fillTable();
        animateTable();
        resetAll();
    }
}

// якщо натиснув занадто рано
function resetTest(message) {
    clearTimeout(timeoutId);
    alert(message);
    resetAll();
}

// скидання
function resetAll() {
    step = 0;
    results = [];
    buttonText.textContent = "Почати тест";
    counter.textContent = "Крок 0 / 5";
    waiting = false;
    ready = false;
}

// ------------------ Обчислення ------------------

function fillTable() {
    // Мін і Макс
    let min = Math.min(...results);
    let max = Math.max(...results);

    // Середнє
    let avg = results.reduce((a, b) => a + b, 0) / results.length;

    // Медіана
    let sorted = [...results].sort((a, b) => a - b);
    let mid = Math.floor(sorted.length / 2);
    let median =
        sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;

    // Стандартне відхилення
    let variance =
        results.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / results.length;
    let stdDev = Math.sqrt(variance);

    // Заповнюємо таблицю
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

// ------------------ Анімація ------------------

function animateTable() {
    resultTable.classList.add("highlight");
    setTimeout(() => {
        resultTable.classList.remove("highlight");
    }, 2000); // ефект триватиме 2 секунди
}
