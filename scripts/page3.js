const btn = document.getElementById("main-btn");
const btnText = document.getElementById("main-btn-text");
const counterSpan = document.getElementById("counter");
const timerSpan = document.getElementById("timer");
const resultTable = document.getElementById("result-table");

const statMinMax = document.getElementById("stat-minmax");
const statMean = document.getElementById("stat-mean");
const statMedian = document.getElementById("stat-median");
const statStd = document.getElementById("stat-std");

let startTime = null;
let timerInterval = null;
let clickCount = 0;
let isRunning = false;
let clickTimes = [];
let chartInstance = null;

btn.addEventListener("click", () => {
    if (!isRunning) startTest();
    else registerClick();
});

function startTest() {
    clickCount = 0;
    clickTimes = [];
    isRunning = true;
    startTime = Date.now();
    btnText.textContent = "Натискайте!";
    counterSpan.textContent = "Лічильник натискань: 0";
    timerSpan.textContent = "Залишилося секунд: 30,0";
    timerInterval = setInterval(updateTimer, 100);
}

function registerClick() {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed <= 30) {
        clickCount++;
        clickTimes.push(elapsed);
        counterSpan.textContent = `Лічильник натискань: ${clickCount}`;
    }
}

function updateTimer() {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = 30 - elapsed;
    if (remaining > 0) timerSpan.textContent = `Залишилося секунд: ${remaining.toFixed(1).replace(".", ",")}`;
    else stopTest();
}

function stopTest() {
    clearInterval(timerInterval);
    isRunning = false;
    btnText.textContent = "Почати заново";
    timerSpan.textContent = "Залишилося секунд: 0,0";
    alert("Час вичерпано! Тест завершено.");

    const results = fillTable();
    const roundedResults = results.map(v => Math.round(v));
    showStats(roundedResults);
    buildChart();
    saveResults(roundedResults);
}

function fillTable() {
    const intervals = [0, 5, 10, 15, 20, 25, 30];
    const results = Array(intervals.length - 1).fill(0);

    clickTimes.forEach(t => {
        for (let i = 0; i < intervals.length - 1; i++) {
            if (t > intervals[i] && t <= intervals[i + 1]) results[i]++;
        }
    });

    results.forEach((val, i) => {
        document.getElementById(`r${i + 1}-val`).textContent = Math.round(val);
    });

    return results;
}

function showStats(values) {
    if (!values.length) return;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

    const std = Math.round(Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length));

    statMinMax.textContent = `${min} / ${max}`;
    statMean.textContent = mean;
    statMedian.textContent = median;
    statStd.textContent = std;
}

function buildChart() {
    if (chartInstance) chartInstance.destroy();
    const oldCanvas = document.getElementById("chartCanvas");
    if (oldCanvas) oldCanvas.remove();

    const ctx = document.createElement("canvas");
    ctx.id = "chartCanvas";
    ctx.style.height = "400px";
    resultTable.after(ctx);

    const results = Array.from(resultTable.querySelectorAll("tbody tr"), tr => Number(tr.querySelector("td:last-child").textContent));

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["0–5", "6–10", "11–15", "16–20", "21–25", "26–30"],
            datasets: [{
                label: "Кількість натискань",
                data: results,
                borderColor: "green",
                backgroundColor: "green",
                fill: false,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: "red"
            }]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {y: {beginAtZero: true}, x: {}}
        }
    });
}

function saveResults(results) {
    const min = Math.min(...results);
    const max = Math.max(...results);
    const mean = Math.round(results.reduce((a, b) => a + b, 0) / results.length);

    const sorted = [...results].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

    const std = Math.round(Math.sqrt(results.reduce((a, b) => a + (b - mean) ** 2, 0) / results.length));

    const data = {
        date: new Date().toLocaleString("uk-UA"),
        intervals: ["0–5", "6–10", "11–15", "16–20", "21–25", "26–30"],
        counts: results.map(v => Math.round(v)),
        total: Math.round(clickCount),
        stats: {min, max, mean, median, std}
    };

    let stored = JSON.parse(localStorage.getItem("results_taping")) || [];
    if (!stored.some(r => r.date === data.date && r.total === data.total)) stored.push(data);
    localStorage.setItem("results_taping", JSON.stringify(stored));
}
