let button = document.getElementById("main-btn");
let buttonText = document.getElementById("main-btn-text");
let counter = document.getElementById("counter");
let resultTable = document.getElementById("result-table");

let results = [];
let step = 0;
let waiting = false;
let ready = false;
let startTime;
let timeoutId;

let beep = new Audio("./sounds/beep_short.mp3");
let reactionChartInstance = null;

button.addEventListener("click", () => {
    if (step === 0) startCycle();
    else if (waiting && !ready) resetTest("Ви натиснули занадто рано! Почніть тест спочатку!");
    else if (ready) recordResult();
});

// -----------------------
//       ЛОГІКА ТЕСТУ
// -----------------------

function startCycle() {
    step = 1;
    results = [];
    buttonText.textContent = "Фіксувати";
    counter.textContent = `Крок ${step} / 10`;
    nextWait();
}

function nextWait() {
    waiting = true;
    ready = false;
    timeoutId = setTimeout(playBeep, Math.floor(Math.random() * 1650) + 750);
}

function playBeep() {
    beep.currentTime = 0;
    beep.play();
    startTime = Date.now();
    waiting = false;
    ready = true;
}

function recordResult() {
    const reactionTime = Math.round(Date.now() - startTime);
    results.push(reactionTime);
    ready = false;

    if (step < 10) {
        step++;
        counter.textContent = `Крок ${step} / 10`;
        nextWait();
    } else {
        const stats = fillTable();
        saveResultToLocalStorage(stats);
        animateTable();
        buildReactionChart(results);
        resetStep();
    }
}

function resetTest(message) {
    clearTimeout(timeoutId);
    alert(message);
    resetStep();
}

function resetStep() {
    step = 0;
    results = [];
    waiting = false;
    ready = false;
    buttonText.textContent = "Почати тест";
    counter.textContent = "Крок 0 / 10";
}

// -----------------------
//     СТАТИСТИКА ТА ТАБЛИЦЯ
// -----------------------

function fillTable() {
    if (!results.length) return null;

    const roundedResults = results.map(r => Math.round(r));

    const min = Math.min(...roundedResults);
    const max = Math.max(...roundedResults);
    const mean = Math.round(roundedResults.reduce((a, b) => a + b, 0) / roundedResults.length);

    const sorted = [...roundedResults].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = Math.round(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);

    const std = Math.round(
        Math.sqrt(roundedResults.reduce((a, b) => a + (b - mean) ** 2, 0) / roundedResults.length)
    );

    // ❗ ВИПРАВЛЕНІ ВИБОРИ ЕЛЕМЕНТІВ
    document.getElementById('r1-val').textContent = roundedResults.join(", ") + " мс";
    document.getElementById('r2-val').textContent = `${min} / ${max} мс`;
    document.getElementById('r3-val').textContent = `${mean} мс`;
    document.getElementById('r4-val').textContent = `${median} мс`;
    document.getElementById('r5-val').textContent = `${std} мс`;

    return {min, max, mean, median, std, roundedResults};
}

function animateTable() {
    resultTable.classList.add("highlight");
    setTimeout(() => resultTable.classList.remove("highlight"), 2000);
}

// -----------------------
//   ЗБЕРЕЖЕННЯ РЕЗУЛЬТАТУ
// -----------------------

function saveResultToLocalStorage(stats) {
    if (!stats) return;

    const storageKey = "results_sound";
    const existingData = JSON.parse(localStorage.getItem(storageKey)) || [];

    const newEntry = {
        id: crypto.randomUUID(),
        testId: "test2",
        testName: "Реакція на звук",
        timestamp: new Date().toISOString(),
        rawValues: stats.roundedResults,
        stats: {
            min: stats.min,
            max: stats.max,
            mean: stats.mean,
            median: stats.median,
            std: stats.std
        }
    };

    existingData.push(newEntry);
    localStorage.setItem(storageKey, JSON.stringify(existingData));
    alert("Результат збережено!");
}

// -----------------------
//    ГРАФІК Chart.js
// -----------------------

function buildReactionChart(reactionTimes) {
    if (reactionChartInstance) reactionChartInstance.destroy();

    const canvasContainer = document.getElementById("chart-container");

    // акуратно відтворюємо Canvas без перезнищення DOM
    const oldCanvas = document.getElementById("results-chart");
    if (oldCanvas) oldCanvas.remove();

    const canvas = document.createElement("canvas");
    canvas.id = "results-chart";
    canvas.style.height = "400px";
    canvasContainer.appendChild(canvas);

    const maxY = Math.ceil(Math.max(...reactionTimes) * 1.1);

    reactionChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: reactionTimes.map((_, i) => i + 1),
            datasets: [{
                label: "Час реакції (мс)",
                data: reactionTimes,
                borderColor: "#22A06B",
                backgroundColor: "#22A06B",
                fill: false,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: "#A02257"
            }]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {
                y: {beginAtZero: true, suggestedMax: maxY, title: {display: true, text: "Мілісекунди"}},
                x: {title: {display: true, text: "Спроба №"}}
            }
        }
    });
}
