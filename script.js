const number = document.getElementById("number");
const btn = document.getElementById("action");
const subtitle = document.getElementById("subtitle");

btn.addEventListener("click", () => {
  btn.disabled = true;
  btn.textContent = "Burning…";

  number.classList.add("burn");

  setTimeout(() => {
    number.textContent = "20";
    number.className = "number new show";

    subtitle.textContent = "A new chapter.";
    subtitle.classList.add("show");

    btn.style.display = "none";
  }, 1600);
});
