let subtitleData = [];
let originalFilename = "";

// Drag and drop functionality
const uploadSection = document.getElementById("uploadSection");

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  uploadSection.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

["dragenter", "dragover"].forEach((eventName) => {
  uploadSection.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  uploadSection.addEventListener(eventName, unhighlight, false);
});

uploadSection.addEventListener("drop", handleDrop, false);

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  uploadSection.classList.add("dragover");
}

function unhighlight() {
  uploadSection.classList.remove("dragover");
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    handleFile(file);
  }
}

function handleFile(file) {
  if (!file.name.toLowerCase().endsWith(".srt")) {
    alert("Vui lòng chọn file có định dạng .srt");
    return;
  }

  originalFilename = file.name;
  const reader = new FileReader();

  reader.onload = function (e) {
    const content = e.target.result;
    parseSubtitles(content);
    displaySubtitles();
    showControls();
  };

  reader.readAsText(file, "UTF-8");
}

function parseSubtitles(content) {
  subtitleData = [];
  const blocks = content.trim().split("\n\n");

  blocks.forEach((block) => {
    const lines = block.trim().split("\n");
    if (lines.length >= 3) {
      const number = lines[0].trim();
      const timestamp = lines[1].trim();
      const text = lines.slice(2).join("\n");

      subtitleData.push({
        number: number,
        timestamp: timestamp,
        text: text,
      });
    }
  });
}

function displaySubtitles() {
  const display = document.getElementById("subtitleDisplay");
  display.innerHTML = "";

  subtitleData.forEach((subtitle, index) => {
    const entryDiv = document.createElement("div");
    entryDiv.className = "subtitle-entry";
    entryDiv.innerHTML = `
                    <div class="subtitle-number">${subtitle.number}</div>
                    <div class="subtitle-timestamp">${subtitle.timestamp}</div>
                    <div class="subtitle-text" data-index="${index}">${subtitle.text}</div>
                `;
    display.appendChild(entryDiv);
  });

  display.style.display = "block";
  document.getElementById("infoBox").style.display = "block";

  // Add event listeners to track text changes
  const textElements = display.querySelectorAll(".subtitle-text");
  textElements.forEach((element, index) => {
    // Use MutationObserver to detect changes
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (
          mutation.type === "childList" ||
          mutation.type === "characterData"
        ) {
          subtitleData[index].text = element.textContent || element.innerText;
        }
      });
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Also listen for paste events and manual editing
    element.addEventListener("input", function () {
      subtitleData[index].text = element.textContent || element.innerText;
    });

    // Periodically check for changes (for translation updates)
    setInterval(() => {
      const currentText = element.textContent || element.innerText;
      if (currentText !== subtitleData[index].text) {
        subtitleData[index].text = currentText;
      }
    }, 1000);
  });
}

function showControls() {
  document.getElementById("downloadBtn").style.display = "inline-block";
  document.getElementById("clearBtn").style.display = "inline-block";
  document.getElementById(
    "fileInfo"
  ).textContent = `File đã tải: ${originalFilename}`;
}

function downloadSubtitles() {
  // Get current text content from displayed elements
  const textElements = document.querySelectorAll(".subtitle-text");
  textElements.forEach((element, index) => {
    if (index < subtitleData.length) {
      subtitleData[index].text = element.textContent || element.innerText;
    }
  });

  let srtContent = "";
  subtitleData.forEach((subtitle) => {
    srtContent += `${subtitle.number}\n`;
    srtContent += `${subtitle.timestamp}\n`;
    srtContent += `${subtitle.text}\n\n`;
  });

  // Create and download file
  const blob = new Blob([srtContent], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const filename = originalFilename.replace(".srt", `_edited_${timestamp}.srt`);

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Show success message
  showMessage("✅ Phụ đề đã được tải xuống thành công!", "success");
}

function clearSubtitles() {
  if (confirm("Bạn có chắc muốn xóa tất cả phụ đề không?")) {
    subtitleData = [];
    document.getElementById("subtitleDisplay").style.display = "none";
    document.getElementById("subtitleDisplay").innerHTML = "";
    document.getElementById("downloadBtn").style.display = "none";
    document.getElementById("clearBtn").style.display = "none";
    document.getElementById("fileInfo").textContent = "";
    document.getElementById("infoBox").style.display = "none";
    document.getElementById("fileInput").value = "";
  }
}

function showMessage(message, type = "info") {
  const messageDiv = document.createElement("div");
  messageDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 1000;
                animation: slideIn 0.3s ease;
                ${
                  type === "success"
                    ? "background: #4CAF50;"
                    : "background: #2196F3;"
                }
            `;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
document.head.appendChild(style);
