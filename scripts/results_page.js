document.addEventListener("DOMContentLoaded", () => {
    const tables = {
        light: document.getElementById("table-test1"),
        sound: document.getElementById("table-test2"),
        tap: document.getElementById("table-test3")
    };

    const buttons = {
        selectAll: document.getElementById("selectAllBtn"),
        compare: document.getElementById("compareBtn1"),
        delete: document.getElementById("deleteSelectedBtn"),
        export: document.getElementById("exportBtn"),
        import: document.getElementById("importBtn"),
        importInput: document.getElementById("importFileInput")
    };

    const modal = document.getElementById("modal");
    const closeModal = document.getElementById("closeModal");
    const modalChartCanvas = document.getElementById("modalChart");

    const colors = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0", "#f032e6"];
    let modalChart = null;
    let statCharts = [];

    const pad = n => String(n).padStart(2, "0");

    const formatTimestamp = ts => {
        if (!ts) return "-";
        const d = new Date(ts);
        if (isNaN(d)) return ts;
        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const storageKeys = {
        light: "results_light",
        sound: "results_sound",
        tap: "results_taping"
    };

    const loadResults = type => JSON.parse(localStorage.getItem(storageKeys[type]) || "[]");
    const saveResults = (type, data) => localStorage.setItem(storageKeys[type], JSON.stringify(data));

    function renderTable(el, test) {
        const data = loadResults(test);

        const formatted = (data.length ? data : [{}]).map((r, idx) => {
            const checkbox = `<input type="checkbox" class="selectResult" data-id="${idx}" data-test="${test}">`;

            if (test === "tap") {
                return [
                    checkbox,
                    r.date || "-",
                    r.counts ? r.counts.join(", ") : "-",
                    r.stats ? `${r.stats.min} / ${r.stats.max}` : "-",
                    r.stats?.mean || "-",
                    r.stats?.median || "-",
                    r.stats?.std || "-"
                ];
            }

            return [
                checkbox,
                r.timestamp ? formatTimestamp(r.timestamp) : "-",
                r.rawValues ? r.rawValues.join(", ") : "-",
                r.stats ? `${r.stats.min} / ${r.stats.max}` : "-",
                r.stats?.mean || "-",
                r.stats?.median || "-",
                r.stats?.std || "-"
            ];
        });

        if ($.fn.DataTable.isDataTable(el)) $(el).DataTable().destroy();
        el.innerHTML = "";

        new DataTable(el, {
            data: formatted,
            columns: [
                {title: "Вибір"},
                {title: "Дата і час"},
                {title: "Результати"},
                {title: "Мін/Макс"},
                {title: "Середнє"},
                {title: "Медіана"},
                {title: test === "tap" ? "Середнє відхилення" : "Середнє відхилення, мс"}
            ],
            language: {
                lengthMenu: "Показати _MENU_ записів",
                search: "Пошук:",
                zeroRecords: "Записи не знайдено",
                info: "Показано _START_–_END_ з _TOTAL_ записів",
                infoEmpty: "Дані відсутні",
                paginate: {previous: "Попередня", next: "Наступна"}
            }
        });
    }

    ["light", "sound", "tap"].forEach(t => renderTable(tables[t], t));

    buttons.selectAll.addEventListener("click", () => {
        const checkboxes = document.querySelectorAll(".selectResult");
        if (!checkboxes.length) return alert("Немає записів для вибору!");

        const allSelected = [...checkboxes].every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allSelected);
    });

    buttons.compare.addEventListener("click", () => {
        const selected = [...document.querySelectorAll(".selectResult:checked")];
        if (selected.length < 2 || selected.length > 8)
            return alert("Оберіть від 2 до 8 результатів!");

        const types = [...new Set(selected.map(cb => cb.dataset.test))];

        if (types.includes("tap") && types.length > 1)
            return alert("Тепінг-тест не можна порівнювати з іншими!");

        if (types.length === 1 && types[0] === "tap") {
            const items = selected.map(cb => loadResults("tap")[cb.dataset.id]);
            return showModalCharts(items, "tap");
        }

        if (!types.every(t => t === "light" || t === "sound"))
            return alert("Порівнювати можна лише світло + звук або тепінг окремо!");

        const items = selected.map(cb => {
            const t = cb.dataset.test;
            return loadResults(t)[cb.dataset.id];
        });

        showModalCharts(items, "reaction-mixed");
    });

    buttons.delete.addEventListener("click", () => {
        const selected = [...document.querySelectorAll(".selectResult:checked")];
        if (!selected.length) return alert("Оберіть записи для видалення!");
        if (!confirm("Видалити обрані записи?")) return;

        const grouped = {};

        selected.forEach(cb => {
            if (!grouped[cb.dataset.test]) grouped[cb.dataset.test] = [];
            grouped[cb.dataset.test].push(parseInt(cb.dataset.id));
        });

        Object.entries(grouped).forEach(([test, ids]) => {
            const filtered = loadResults(test).filter((_, i) => !ids.includes(i));
            saveResults(test, filtered);
            renderTable(tables[test], test);
        });
    });

    buttons.export.addEventListener("click", () => {
        const selected = [...document.querySelectorAll(".selectResult:checked")];
        if (!selected.length) return alert("Оберіть записи для експорту!");

        const exportData = selected.map(cb => {
            const type = cb.dataset.test;
            return {testType: type, ...loadResults(type)[cb.dataset.id]};
        });

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "reaction_export.json";
        a.click();
        URL.revokeObjectURL(url);
    });

    buttons.import.addEventListener("click", () => buttons.importInput.click());

    buttons.importInput.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = ev => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!Array.isArray(imported)) throw new Error("Невірний формат файлу.");

                const grouped = {light: [], sound: [], tap: []};

                imported.forEach(r => {
                    if (grouped[r.testType]) grouped[r.testType].push(r);
                });

                ["light", "sound", "tap"].forEach(type => {
                    const existing = loadResults(type);

                    grouped[type].forEach(rec => {
                        const isDuplicate = existing.some(ex =>
                            type === "tap"
                                ? ex.date === rec.date && ex.total === rec.total
                                : ex.timestamp === rec.timestamp
                        );
                        if (!isDuplicate) existing.push(rec);
                    });

                    saveResults(type, existing);
                });

                ["light", "sound", "tap"].forEach(t => renderTable(tables[t], t));

                alert("Імпорт завершено!");
            } catch {
                alert("Помилка імпорту.");
            }

            e.target.value = "";
        };

        reader.readAsText(file);
    });

    function showModalCharts(results, testType) {
        modal.style.display = "flex";

        const modalContent = document.getElementById("modalContent");
        modalContent.style.height = testType === "tap" ? "85vh" : "70vh";
        modalChartCanvas.style.height = testType === "tap" ? "70%" : "50%";

        if (modalChart) modalChart.destroy();
        statCharts.forEach(c => c.destroy());
        statCharts = [];

        let labels, datasets;

        if (testType === "tap") {
            labels = results[0].intervals;
            datasets = results.map((r, i) => ({
                label: `Тепінг-тест | ${r.date || "-"}`,
                data: r.counts,
                borderColor: colors[i % colors.length],
                fill: false
            }));
        } else {
            labels = results[0].rawValues.map((_, i) => i + 1);

            datasets = results.map((r, i) => {
                let ts = "-";

                if (typeof r.timestamp === "number") ts = formatTimestamp(r.timestamp);
                else if (typeof r.timestamp === "string") ts = formatTimestamp(new Date(r.timestamp).getTime());

                const testLabel =
                    r.testName === "ReactLight" ? "Реакція на світло" :
                        r.testName === "Реакція на звук" ? "Реакція на звук" :
                            r.testName || "-";

                return {
                    label: `${testLabel} | ${ts}`,
                    data: r.rawValues,
                    borderColor: colors[i % colors.length],
                    fill: false
                };
            });
        }

        let yMax = null;

        if (testType === "tap") {
            const all = results.flatMap(r => r.counts);
            yMax = Math.ceil(Math.max(...all) * 1.1);
        }

        modalChart = new Chart(modalChartCanvas, {
            type: "line",
            data: {labels, datasets},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {display: true, text: "Порівняння результатів"}
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: yMax || undefined
                    }
                }
            }
        });
    }

    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
        document.querySelectorAll("#modalContent canvas:not(#modalChart)").forEach(c => c.remove());
    });

    modal.addEventListener("click", e => {
        if (e.target === modal) modal.style.display = "none";
    });
});
