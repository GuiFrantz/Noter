document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("editor");
    const saveBtn = document.getElementById("saveBtn");

    // Load saved content from localStorage
    if (localStorage.getItem("textContent")) {
        editor.value = localStorage.getItem("textContent");
    }

    // Save content to localStorage when the button is clicked
    saveBtn.addEventListener("click", () => {
        localStorage.setItem("textContent", editor.value);
        alert("Content saved!");
    });
});
