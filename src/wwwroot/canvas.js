// Pointer Events API allows better handling of touch, stylus, and mouse inputs.
// It is especially useful for devices like pen tablets, touchscreens, and trackpads.
// This example supports trackpad, mouse, and stylus input.

let canvas = document.getElementById("drawingCanvas");
let ctx = canvas.getContext("2d");
let drawing = false;
let undoStack = [];
let redoStack = [];

// Save the current canvas state
function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack = []; // Clear redo history on new draw
}

function startDrawing(e) {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    saveState(); // Save before drawing starts
}

function draw(e) {
    if (!drawing) return;
    let pressure = e.pressure || 0.5; // Default pressure for trackpad/mouse
    ctx.lineWidth = pressure * 5; // Adjust stroke based on pressure
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
}

function stopDrawing() {
    drawing = false;
}

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerout", stopDrawing);
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

window.getCanvasData = function () {
    return canvas.toDataURL("image/png");
};

window.clearCanvas = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStack = [];
    redoStack = [];
};

window.undoCanvas = function () {
    if (undoStack.length > 0) {
        redoStack.push(canvas.toDataURL());
        let imgData = new Image();
        imgData.src = undoStack.pop();
        imgData.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imgData, 0, 0);
        };
    }
};

window.redoCanvas = function () {
    if (redoStack.length > 0) {
        undoStack.push(canvas.toDataURL());
        let imgData = new Image();
        imgData.src = redoStack.pop();
        imgData.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imgData, 0, 0);
        };
    }
};
