// Pointer Events API allows better handling of touch, stylus, and mouse inputs.
// It is especially useful for devices like pen tablets and touchscreens.
// This example adds pressure sensitivity and smooth strokes.

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

canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    saveState(); // Save before drawing starts
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    ctx.lineWidth = e.pressure * 5 || 2; // Adjust stroke based on pressure
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});

canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointerout", () => drawing = false);

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
