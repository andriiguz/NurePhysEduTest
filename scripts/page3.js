const btn = document.getElementById("main-btn");
const btnText = document.getElementById("main-btn-text");
const counterSpan = document.getElementById("counter");
const timerSpan = document.getElementById("timer");
const resultTable = document.getElementById("result-table");
let startTime = null;
let timerInterval = null;
let clickCount = 0;
let isRunning = false;
let clickTimes = [];
let chartInstance = null;

btn.addEventListener("click", () => {
    if (!isRunning) {
        startTest();
    } else {
        registerClick();
    }
});

function startTest() {
    clickCount = 0;
    clickTimes = [];
    clearTable();
    destroyChart();

    isRunning = true;
    startTime = Date.now();
    btnText.textContent = "Натискай!";
    counterSpan.textContent = "Лічильник натискань: 0";
    timerSpan.textContent = "Залишилося секунд: 30,0";

    timerInterval = setInterval(updateTimer, 100);
}

function registerClick() {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed <= 30) {
        clickCount++;
        clickTimes.push(elapsed);
        counterSpan.textContent = "Лічильник натискань: " + clickCount;
    }
}

function updateTimer() {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = 30 - elapsed;
    if (remaining > 0) {
        timerSpan.textContent = "Залишилося секунд: " + remaining.toFixed(1).replace(".", ",");
    } else {
        stopTest();
    }
}

function stopTest() {
    clearInterval(timerInterval);
    isRunning = false;
    btnText.textContent = "Почати заново";
    alert("Час вичерпано! Тест завершено.");
    fillTable();
    buildChart();
}

function clearTable() {
    resultTable.querySelectorAll("tbody tr td:last-child").forEach(td => {
        td.textContent = "";
    });
}

function fillTable() {
    const intervals = [0, 5, 10, 15, 20, 25, 30];
    const results = [0, 0, 0, 0, 0, 0];

    clickTimes.forEach(t => {
        for (let i = 0; i < intervals.length - 1; i++) {
            if (t > intervals[i] && t <= intervals[i + 1]) {
                results[i]++;
            }
        }
    });

    results.forEach((val, i) => {
        const row = resultTable.querySelector(`tr[data-id="r${i + 1}"] td:last-child`);
        row.textContent = val;
    });

    return results;
}

function buildChart() {
    const ctx = document.createElement("canvas");
    ctx.id = "chartCanvas";
    resultTable.after(ctx);

    const results = [];
    resultTable.querySelectorAll("tbody tr").forEach(tr => {
        results.push(Number(tr.querySelector("td:last-child").textContent));
    });

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["0-5", "5-10", "10-15", "15-20", "20-25", "25-30"],
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
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {display: true, text: "Натискання"}
                },
                x: {
                    title: {display: true, text: "Секунди"}
                }
            }
        }
    });
}

function destroyChart() {
    const oldCanvas = document.getElementById("chartCanvas");
    if (oldCanvas) oldCanvas.remove();
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}
