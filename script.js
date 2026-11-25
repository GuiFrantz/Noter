document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("editor");
    const filenameInput = document.getElementById("filename");
    const lastSavedDisplay = document.getElementById("lastSaved");
    const charCountBtn = document.getElementById("charCountBtn");
    const ttrBtn = document.getElementById("ttrBtn");
    let timer, saveTimer;
    let isFilenameManual = false;
    let showWords = false;

    // Load saved content from localStorage
    if (localStorage.getItem("current_tab_content")) {
        editor.value = localStorage.getItem("current_tab_content");
    }
    const savedFilename = localStorage.getItem("current_tab_filename");
    if (savedFilename) {
        filenameInput.value = savedFilename;
        isFilenameManual = true;
    } else {
        updateFilename();
    }
    updateStats();

    // Count words in the editor (0 for empty content)
    function countWords() {
        return editor.value.trim().split(/\s+/).filter(Boolean).length;
    }

    // Format reading time as M'SS", prefixing hours only when over 60 minutes
    function formatTtr(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const time = `${minutes}'${String(secs).padStart(2, "0")}"`;
        return hours > 0 ? `${hours}h ${time}` : time;
    }

    // Refresh the footer stats (char/word counter and time to read)
    function updateStats() {
        const words = countWords();
        charCountBtn.textContent = showWords
            ? `${words} words`
            : `${editor.value.length} chars`;
        ttrBtn.textContent = formatTtr(Math.round((words / 200) * 60));
    }

    // Save content to localStorage and show the "Saving..." status
    function saveContent() {
        clearTimeout(timer); // Cancel any pending auto-save, this one covers it
        localStorage.setItem("current_tab_content", editor.value);
        if (isFilenameManual) {
            localStorage.setItem("current_tab_filename", filenameInput.value);
        } else {
            localStorage.removeItem("current_tab_filename");
        }
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
        timer = setTimeout(function () {
            saveContent();
        }, 1000);  // Save after 1 second of inactivity
    }

    // Update filename if not manually set
    function updateFilename() {
        if (!isFilenameManual) {
            const content = editor.value.trim();
            const firstLine = content.split("\n")[0].substring(0, 25) || "Untitled";
            filenameInput.value = firstLine;
        }
    }

    // Download file with the current filename
    function downloadFile() {
        saveContent(); // Save first, then download
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
        fileInput.onchange = function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    editor.value = e.target.result;
                    filenameInput.value = file.name.replace(".txt", "").substring(0, 50); // Keep the file's original name
                    isFilenameManual = true; // Set as manual since we have a filename now
                    updateStats();
                    saveContent();
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
        localStorage.removeItem("current_tab_filename");
        lastSavedDisplay.textContent = ""; // Clear any save status display
        updateStats();
    }

    // Custom thin overlay scrollbar, only visible while scrolling
    const scrollThumb = document.getElementById("scrollThumb");
    let scrollTimer;

    function updateScrollThumb() {
        const { scrollTop, scrollHeight, clientHeight } = editor;
        if (scrollHeight <= clientHeight) {
            scrollThumb.style.opacity = "0";
            return;
        }
        const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 24);
        const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight);
        scrollThumb.style.height = `${thumbHeight}px`;
        scrollThumb.style.top = `${thumbTop}px`;
    }

    function showScrollThumb() {
        updateScrollThumb();
        scrollThumb.classList.add("visible");
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            scrollThumb.classList.remove("visible");
        }, 800);
    }

    editor.addEventListener("scroll", showScrollThumb);

    // Keep the caret line inside the clear area, outside the fade zones behind the bars
    const caretMirror = document.createElement("div");
    const mirrorProps = [
        "boxSizing", "fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing",
        "lineHeight", "wordSpacing", "textIndent", "tabSize", "paddingLeft", "paddingRight",
        "borderLeftWidth", "borderRightWidth", "borderLeftStyle", "borderRightStyle",
    ];
    let caretFrame;

    function keepCaretVisible() {
        cancelAnimationFrame(caretFrame);
        caretFrame = requestAnimationFrame(() => {
            if (document.activeElement !== editor || editor.selectionStart !== editor.selectionEnd) return;

            const cs = getComputedStyle(editor);
            const padTop = parseFloat(cs.paddingTop) || 0;
            const padBottom = parseFloat(cs.paddingBottom) || 0;
            const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;

            // Measure where the caret sits using an off-screen copy of the text
            caretMirror.style.cssText =
                "position:fixed;visibility:hidden;pointer-events:none;top:0;left:-9999px;white-space:pre-wrap;overflow-wrap:break-word;";
            mirrorProps.forEach((prop) => (caretMirror.style[prop] = cs[prop]));
            caretMirror.style.width = `${editor.clientWidth}px`;
            caretMirror.textContent = editor.value.substring(0, editor.selectionStart);
            const marker = document.createElement("span");
            marker.textContent = "\u200b";
            caretMirror.appendChild(marker);
            document.body.appendChild(caretMirror);
            const caretTop = padTop + marker.offsetTop;
            document.body.removeChild(caretMirror);

            const caretBottom = caretTop + lineHeight;
            const visibleTop = editor.scrollTop + padTop;
            const visibleBottom = editor.scrollTop + editor.clientHeight - padBottom;

            if (caretBottom > visibleBottom) {
                editor.scrollTop += caretBottom - visibleBottom;
            } else if (caretTop < visibleTop) {
                editor.scrollTop -= visibleTop - caretTop;
            }
        });
    }

    ["input", "keyup", "click"].forEach((evt) => editor.addEventListener(evt, keepCaretVisible));
    document.addEventListener("selectionchange", keepCaretVisible);

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
        updateStats();
    });

    // Detect manual filename changes
    filenameInput.addEventListener("input", () => {
        isFilenameManual = true;
        autoSave();
    });

    // Event listeners for the buttons
    document.getElementById("openFileBtn").addEventListener("click", openFile);
    document.getElementById("downloadFileBtn").addEventListener("click", downloadFile);
    document.getElementById("newFileBtn").addEventListener("click", newFile);

    // Footer stats toggles
    charCountBtn.addEventListener("click", () => {
        showWords = !showWords;
        updateStats();
    });

    // Footer actions (ellipsis button)
    const footer = document.getElementById("footer");
    const menuBtn = document.getElementById("menuBtn");
    const actions = document.getElementById("actions");

    function setActionsOpen(open) {
        footer.dataset.open = String(open);
        menuBtn.setAttribute("aria-expanded", String(open));
        actions.inert = !open;
    }

    menuBtn.addEventListener("click", () => {
        setActionsOpen(footer.dataset.open !== "true");
    });

    document.addEventListener("click", (e) => {
        if (!footer.contains(e.target)) setActionsOpen(false);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setActionsOpen(false);
    });

});