// Pointer Events API allows better handling of touch, stylus, and mouse inputs.
// It is especially useful for devices like pen tablets, touchscreens, and trackpads.
// This example supports trackpad, mouse, and stylus input.

let canvas = document.getElementById("drawingCanvas");
let ctx = canvas.getContext("2d");
let drawing = false;
let undoStack = [];
let redoStack = [];
let paths = []; // Store strokes for SVG conversion

function saveState() {
    undoStack.push(JSON.stringify(paths)); // Save stroke paths instead of image
    redoStack = [];
}

function startDrawing(e) {
    drawing = true;
    let newPath = {
        color: ctx.strokeStyle,
        width: ctx.lineWidth,
        points: [{ x: e.offsetX, y: e.offsetY }]
    };
    paths.push(newPath);
    saveState();
}

function draw(e) {
    if (!drawing) return;
    let currentPath = paths[paths.length - 1];
    currentPath.points.push({ x: e.offsetX, y: e.offsetY });

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

// Convert the stroke paths to SVG
window.getSVGData = function () {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;
    paths.forEach(path => {
        let d = `M ${path.points.map(p => `${p.x},${p.y}`).join(" L ")}`;
        svg += `<path d="${d}" stroke="${path.color}" stroke-width="${path.width}" fill="none"/>`;
    });
    svg += `</svg>`;
    return svg;
};

window.clearCanvas = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths = [];
    undoStack = [];
    redoStack = [];
};

// Load an SVG drawing into the canvas
window.loadSVGData = function (svgString) {
    let parser = new DOMParser();
    let svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    let paths = svgDoc.querySelectorAll("path");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths.forEach(path => {
        let d = path.getAttribute("d").split("L").map(p => p.trim().replace("M ", "").split(","));
        ctx.beginPath();
        ctx.moveTo(d[0][0], d[0][1]);
        for (let i = 1; i < d.length; i++) {
            ctx.lineTo(d[i][0], d[i][1]);
        }
        ctx.strokeStyle = path.getAttribute("stroke");
        ctx.lineWidth = parseFloat(path.getAttribute("stroke-width"));
        ctx.stroke();
    });
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
