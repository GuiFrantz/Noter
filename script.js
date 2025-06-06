document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("editor");
    const filenameInput = document.getElementById("filename");
    const lastSavedDisplay = document.getElementById("lastSaved");
    let timer, saveTimer;
    let isFilenameManual = false;

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

    // Update filename if not manually set
    function updateFilename() {
        if (!isFilenameManual) {
            const content = editor.value.trim();
            const firstLine = content.split("\n")[0].substring(0, 20) || "Untitled";
            filenameInput.value = firstLine;
        }
    }

    // Download file with the current filename
    function downloadFile() {
        const blob = new Blob([editor.value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filenameInput.value || "untitled.txt";
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
                    filenameInput.value = file.name.replace(".txt", ""); // Keep the file's original name
                    isFilenameManual = true; // Set as manual since we have a filename now
                };
                reader.readAsText(file);
            }
        };
        fileInput.click();
    }

    function newFile() {
        editor.value = ""; // Clear the editor content
        filenameInput.value = "Untitled"; // Reset filename to a default value
        isFilenameManual = false; // Reset filename to automatic mode
        localStorage.removeItem("current_tab_content"); // Clear saved content from localStorage
        lastSavedDisplay.textContent = ""; // Clear any save status display
    }

    // TAB support
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.substring(0, start) + '\t' + e.target.value.substring(end);
        e.target.selectionStart = e.target.selectionEnd = start + 1;
      }
    });

    // Attach event listener to the editor for user input
    editor.addEventListener("input", () => {
        autoSave();
        updateFilename();
    });

    // Detect manual filename changes
    filenameInput.addEventListener("input", () => {
        isFilenameManual = true;
    });

    // Event listeners for the buttons
    document.getElementById("openFileBtn").addEventListener("click", openFile);
    document.getElementById("downloadFileBtn").addEventListener("click", downloadFile);
    document.getElementById("newFileBtn").addEventListener("click", newFile);
});
