const canvas = document.querySelector("#drawing-canvas");
const ctx = canvas.getContext("2d");
const toolBtns = document.querySelectorAll(".tool-btn[id]:not(.undo-btn):not(.redo-btn):not(.save-img):not(.clear-canvas)");
const sizeSlider = document.querySelector("#size-slider");
const sizeIndicator = document.querySelector("#size-indicator");
const sizeValue = document.querySelector("#size-value");
const colorOptions = document.querySelectorAll(".color-option");
const colorPicker = document.querySelector("#color-picker");
const clearCanvas = document.querySelector(".clear-canvas");
const saveImg = document.querySelector(".save-img");
const undoBtn = document.querySelector(".undo-btn");
const redoBtn = document.querySelector(".redo-btn");

// Expandable toolbar elements
const floatingBtn = document.querySelector("#floating-btn");
const expandableToolbar = document.querySelector("#expandable-toolbar");
const overlay = document.querySelector("#overlay");
const closeBtn = document.querySelector("#close-btn");

// Global variables
let prevMouseX, prevMouseY, snapshot, isDrawing = false;
let selectedTool = "brush", brushWidth = 5, selectedColor = "#000000";
let undoStack = [], redoStack = [];
let isToolbarOpen = false;

// Set canvas background
const setCanvasBackground = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = selectedColor;
}

// Initialize canvas
const initCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    setCanvasBackground();
    saveState();
    updateSizeIndicator();
}

// Initialize on load
window.addEventListener("load", () => {
    initCanvas();
});

// Handle window resize
window.addEventListener("resize", () => {
    setTimeout(initCanvas, 100);
});

// Update size indicator
const updateSizeIndicator = () => {
    const size = Math.max(8, Math.min(40, brushWidth));
    sizeIndicator.style.width = size + "px";
    sizeIndicator.style.height = size + "px";
    sizeIndicator.style.background = selectedColor;
    sizeValue.textContent = brushWidth + "px";
}

// Save canvas state for undo/redo
const saveState = () => {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 20) {
        undoStack.shift();
    }
    redoStack = [];
}

// Undo functionality
const undo = () => {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        }
        img.src = undoStack[undoStack.length - 1];
    }
}

// Redo functionality  
const redo = () => {
    if (redoStack.length > 0) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            undoStack.push(redoStack.pop());
        }
        img.src = redoStack[redoStack.length - 1];
    }
}

// Drawing functions
const drawRect = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.strokeRect(x, y, prevMouseX - x, prevMouseY - y);
}

const drawCircle = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    let radius = Math.sqrt(Math.pow((prevMouseX - x), 2) + Math.pow((prevMouseY - y), 2));
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

const drawLine = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(x, y);
    ctx.stroke();
}

const getEventPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

const startDraw = (e) => {
    e.preventDefault();
    isDrawing = true;
    const pos = getEventPos(e);
    prevMouseX = pos.x;
    prevMouseY = pos.y;
    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedColor;
    ctx.fillStyle = selectedColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

const drawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const pos = getEventPos(e);
    ctx.putImageData(snapshot, 0, 0);

    if (selectedTool === "brush" || selectedTool === "pencil") {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    } else if (selectedTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    } else if (selectedTool === "rectangle") {
        ctx.strokeRect(pos.x, pos.y, prevMouseX - pos.x, prevMouseY - pos.y);
    } else if (selectedTool === "circle") {
        ctx.beginPath();
        let radius = Math.sqrt(Math.pow((prevMouseX - pos.x), 2) + Math.pow((prevMouseY - pos.y), 2));
        ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    } else if (selectedTool === "line") {
        ctx.beginPath();
        ctx.moveTo(prevMouseX, prevMouseY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
}

const stopDraw = (e) => {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
}

// Expandable toolbar functionality
const openToolbar = () => {
    isToolbarOpen = true;
    floatingBtn.classList.add('active');
    overlay.classList.add('active');
    expandableToolbar.classList.add('active', 'expanding');
    expandableToolbar.classList.remove('collapsing');
}

const closeToolbar = () => {
    isToolbarOpen = false;
    floatingBtn.classList.remove('active');
    overlay.classList.remove('active');
    expandableToolbar.classList.add('collapsing');
    expandableToolbar.classList.remove('expanding');
    
    setTimeout(() => {
        expandableToolbar.classList.remove('active', 'collapsing');
    }, 400);
}

// Event listeners for expandable toolbar
floatingBtn.addEventListener("click", openToolbar);
closeBtn.addEventListener("click", closeToolbar);
overlay.addEventListener("click", closeToolbar);

// Tool button event listeners
toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".tool-btn.active").classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
        closeToolbar();
    });
});

// Size slider event listener
sizeSlider.addEventListener("input", () => {
    brushWidth = sizeSlider.value;
    updateSizeIndicator();
});

// Color option event listeners
colorOptions.forEach(option => {
    option.addEventListener("click", () => {
        if (option.classList.contains("custom-color")) return;
        
        document.querySelector(".color-option.active").classList.remove("active");
        option.classList.add("active");
        selectedColor = option.dataset.color;
        updateSizeIndicator();
    });
});

// Color picker event listener
colorPicker.addEventListener("change", () => {
    selectedColor = colorPicker.value;
    document.querySelector(".color-option.active").classList.remove("active");
    colorPicker.parentElement.classList.add("active");
    updateSizeIndicator();
});

// Clear canvas
clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasBackground();
    saveState();
});

// Save image
saveImg.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `summer-artwork-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

// Undo/Redo event listeners
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

// Canvas mouse/touch events
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseout", stopDraw);

// Touch events
canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", drawing);
canvas.addEventListener("touchend", stopDraw);

// Prevent scrolling when touching the canvas
document.body.addEventListener("touchstart", (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener("touchend", (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener("touchmove", (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });
