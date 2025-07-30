const canvas = document.querySelector("#drawing-canvas");
const ctx = canvas.getContext("2d");
const toolBtns = document.querySelectorAll(".tool-btn[id]");
const sizeSlider = document.querySelector("#size-slider");
const sizeIndicator = document.querySelector("#size-indicator");
const colorOptions = document.querySelectorAll(".color-option");
const colorPicker = document.querySelector("#color-picker");
const clearCanvas = document.querySelector(".clear-canvas");
const saveImg = document.querySelector(".save-img");
const undoBtn = document.querySelector(".undo-btn");
const redoBtn = document.querySelector(".redo-btn");

// Global variables
let prevMouseX, prevMouseY, snapshot, isDrawing = false;
let selectedTool = "brush", brushWidth = 5, selectedColor = "#000000";
let undoStack = [], redoStack = [];

// Set canvas background
const setCanvasBackground = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = selectedColor;
}

// Initialize canvas
window.addEventListener("load", () => {
    canvas.width = Math.min(800, window.innerWidth - 80);
    canvas.height = Math.min(600, window.innerHeight - 200);
    setCanvasBackground();
    saveState();
    updateSizeIndicator();
});

// Update size indicator
const updateSizeIndicator = () => {
    const size = Math.max(8, Math.min(40, brushWidth));
    sizeIndicator.style.width = size + "px";
    sizeIndicator.style.height = size + "px";
    sizeIndicator.style.background = selectedColor;
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
    ctx.strokeRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
}

const drawCircle = (e) => {
    ctx.beginPath();
    let radius = Math.sqrt(Math.pow((prevMouseX - e.offsetX), 2) + Math.pow((prevMouseY - e.offsetY), 2));
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

const drawLine = (e) => {
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
}

const startDraw = (e) => {
    isDrawing = true;
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;
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
    ctx.putImageData(snapshot, 0, 0);

    if (selectedTool === "brush" || selectedTool === "pencil") {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (selectedTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (selectedTool === "rectangle") {
        drawRect(e);
    } else if (selectedTool === "circle") {
        drawCircle(e);
    } else if (selectedTool === "line") {
        drawLine(e);
    }
}

// Tool button event listeners
toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".tool-btn.active").classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
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

// Canvas mouse events
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
});

// Touch events for mobile support
canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    });
    canvas.dispatchEvent(mouseEvent);
    e.preventDefault();
});

canvas.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    });
    canvas.dispatchEvent(mouseEvent);
    e.preventDefault();
});

canvas.addEventListener("touchend", (e) => {
    const mouseEvent = new MouseEvent("mouseup", {});
    canvas.dispatchEvent(mouseEvent);
    e.preventDefault();
});

// Resize canvas on window resize
window.addEventListener("resize", () => {
    const newWidth = Math.min(800, window.innerWidth - 80);
    const newHeight = Math.min(600, window.innerHeight - 200);
    
    if (newWidth !== canvas.width || newHeight !== canvas.height) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = newWidth;
        canvas.height = newHeight;
        setCanvasBackground();
        ctx.putImageData(imageData, 0, 0);
    }
});
