const btn = document.getElementById("main-btn");
const screenMsg = document.getElementById("instruction-text");
const btnText = document.getElementById("main-btn-text");
const screen = document.getElementById("main-screen");
const counter = document.getElementById("counter");
const resultTable = document.getElementById("result-table");

let results = [];
let step = 0;
let waiting = false;
let ready = false;
let startTime;
let timeoutId;
let reactionChartInstance = null;

const COLOR_RED = "#FD9891";
const COLOR_GREEN = "#BDE97C";
const COLOR_DEFAULT = "";

btn.addEventListener("click", () => {
    if (step === 0) startCycle();
    else if (waiting && !ready) resetTest("Ви натиснули занадто рано! Почніть тест спочатку!");
    else if (ready) recordResult();
});

function startCycle() {
    results = [];
    step = 1;
    btnText.textContent = "Чекайте зелений...";
    counter.textContent = `Крок ${step} / 10`;
    nextRed();
}

function nextRed() {
    screen.style.backgroundColor = COLOR_RED;
    waiting = true;
    ready = false;
    btnText.textContent = "Чекайте...";
    timeoutId = setTimeout(nextGreen, Math.floor(Math.random() * 1650) + 750);
}

function nextGreen() {
    screen.style.backgroundColor = COLOR_GREEN;
    startTime = Date.now();
    waiting = false;
    ready = true;
    btnText.textContent = "Тисніть!";
}

function recordResult() {
    const reactionTime = Math.round(Date.now() - startTime);
    results.push(reactionTime);
    ready = false;

    if (step < 10) {
        step++;
        counter.textContent = `Крок ${step} / 10`;
        nextRed();
    } else {
        animateTable();
        finishTest();
    }
}

function finishTest() {
    screen.style.backgroundColor = COLOR_DEFAULT;
    btnText.textContent = "Почати знову";
    counter.textContent = "Тест завершено";
    screenMsg.textContent = "Тест завершено. Дивіться результати нижче.";
    step = 0;
    fillTable();
    saveResultToLocalStorage();
    buildReactionChart(results);
    alert("Результат збережено!");
}

function resetTest(message) {
    clearTimeout(timeoutId);
    alert(message);
    step = 0;
    results = [];
    screen.style.backgroundColor = COLOR_DEFAULT;
    btnText.textContent = "Почати тест";
    counter.textContent = "Крок 0 / 10";
    waiting = false;
    ready = false;
}

function clearTableVisuals() {
    ["r1-val", "r2-val", "r3-val", "r4-val", "r5-val"].forEach(id => {
        document.getElementById(id).textContent = "-";
    });
}

function fillTable() {
    if (!results.length) return;

    const min = Math.min(...results);
    const max = Math.max(...results);
    const mean = Math.round(results.reduce((a, b) => a + b, 0) / results.length);

    const sorted = [...results].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = Math.round(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);

    const std = Math.round(Math.sqrt(results.reduce((a, b) => a + (b - mean) ** 2, 0) / results.length));

    document.getElementById("r1-val").textContent = results.join(", ") + " мс";
    document.getElementById("r2-val").textContent = `${min} / ${max} мс`;
    document.getElementById("r3-val").textContent = `${mean} мс`;
    document.getElementById("r4-val").textContent = `${median} мс`;
    document.getElementById("r5-val").textContent = `${std} мс`;

    return {min, max, mean, median, std};
}

function saveResultToLocalStorage() {
    const stats = fillTable();
    if (!stats) return;

    const newRecord = {
        id: "id-" + Math.random().toString(36).substr(2, 16),
        testName: "ReactLight",
        timestamp: Date.now(),
        rawValues: results.map(r => Math.round(r)),
        stats: Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, Math.round(v)]))
    };

    const arr = JSON.parse(localStorage.getItem("results_light") || "[]");
    arr.push(newRecord);
    localStorage.setItem("results_light", JSON.stringify(arr));
}

function buildReactionChart(reactionTimes) {
    destroyReactionChart();

    const canvas = document.createElement("canvas");
    canvas.id = "results-chart";
    canvas.style.height = "400px";
    document.getElementById("chart-container").appendChild(canvas);

    const roundedTimes = reactionTimes.map(t => Math.round(t));
    const maxY = Math.ceil(Math.max(...roundedTimes) * 1.1);

    reactionChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: roundedTimes.map((_, i) => `${i + 1}`),
            datasets: [{
                label: "Час реакції (мс)",
                data: roundedTimes,
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

function destroyReactionChart() {
    const oldCanvas = document.getElementById("results-chart");
    if (oldCanvas) oldCanvas.remove();
    if (reactionChartInstance) {
        reactionChartInstance.destroy();
        reactionChartInstance = null;
    }
}

function animateTable() {
    resultTable.classList.add("highlight");
    setTimeout(() => resultTable.classList.remove("highlight"), 2000);
}
