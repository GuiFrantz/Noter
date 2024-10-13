document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("editor");
    const filenameDisplay = document.getElementById("filename");
    const lastSavedDisplay = document.getElementById("lastSaved");
    let timer, saveTimer;

    // Load saved content from localStorage
    if (localStorage.getItem("current_tab_content")) {
        editor.value = localStorage.getItem("current_tab_content");
        updateFilename();
    }

    // Save content to localStorage and show the "Saving..." status
    function saveContent() {
        localStorage.setItem("current_tab_content", editor.value);
        showSavingStatus();
    }

    // Show "Saving..." for 1 second, then hide it
    function showSavingStatus() {
        lastSavedDisplay.textContent = "saved";
        
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            lastSavedDisplay.textContent = ""; // Clear the message after 1 second
        }, 1000);
    }

    // Auto-save function triggered by user input
    function autoSave() {
        clearTimeout(timer);
        timer = setTimeout(function() {
            saveContent();
        }, 1000);  // Save after 1 second of inactivity
    }

    // Update filename display to only use the first line
    function updateFilename() {
        const content = editor.value.trim();
        const firstLine = content.split("\n")[0].substring(0, 20) || "Untitled";
        filenameDisplay.textContent = firstLine;
    }

    // Save file
    function saveFile() {
        const blob = new Blob([editor.value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filenameDisplay.textContent || "untitled.txt";
        a.click();
        URL.revokeObjectURL(url);
    }

    // Open a file
    function openFile() {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".txt";
        fileInput.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    editor.value = e.target.result;
                    updateFilename();
                };
                reader.readAsText(file);
            }
        };
        fileInput.click();
    }

    // Attach event listener to the editor for user input
    editor.addEventListener("input", () => {
        autoSave();
        updateFilename();
    });

    // Event listeners for the buttons
    document.getElementById("openFileBtn").addEventListener("click", openFile);
    document.getElementById("saveFileBtn").addEventListener("click", saveFile);
});
