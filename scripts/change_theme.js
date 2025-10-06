const switcher = document.getElementById("switch");
const root = document.documentElement;
const logo = document.getElementById("logo");

const logoLight = new Image();
logoLight.src = "./../img/logo-light.svg";

const logoDark = new Image();
logoDark.src = "./../img/logo-dark.svg";

const savedTheme = localStorage.getItem("theme") || "dark";
root.setAttribute("data-theme", savedTheme);
switcher.checked = savedTheme === "light";

logo.src = savedTheme === "light" ? logoLight.src : logoDark.src;

switcher.addEventListener("change", () => {
    const newTheme = switcher.checked ? "light" : "dark";
    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    logo.src = newTheme === "light" ? logoLight.src : logoDark.src;
});
