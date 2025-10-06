const switcher = document.getElementById("switch");
const root = document.documentElement;
const logo = document.getElementById("logo");

// предзагрузка обеих картинок
const logoLight = new Image();
logoLight.src = "./../img/logo-light.svg";

const logoDark = new Image();
logoDark.src = "./../img/logo-dark.svg";

// загрузка сохранённой темы
const savedTheme = localStorage.getItem("theme") || "dark";
root.setAttribute("data-theme", savedTheme);
switcher.checked = savedTheme === "light";

// сразу подставляем правильный логотип
logo.src = savedTheme === "light" ? logoLight.src : logoDark.src;

// обработка переключения
switcher.addEventListener("change", () => {
    const newTheme = switcher.checked ? "light" : "dark";
    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    // смена лого
    logo.src = newTheme === "light" ? logoLight.src : logoDark.src;
});
