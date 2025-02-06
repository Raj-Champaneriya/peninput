// Define your drawing functions as before
let ctx, canvas;
let isDrawing = false;
let undoStack = [];
let redoStack = [];
let paths = []; // Store strokes for SVG conversion
let autoSaveTimer = null;
let blazorAutoSaveRef = null;
let selectedColor = "#000000"; // Default color (black)
let lastSavedData = ""; // ✅ Track last saved state to avoid duplicate saves
let isSaving = false; // Track auto-save state

window.blockUserInput = function (status) {
  isSaving = status;
  if (isSaving) {
    console.log("🚫 Blocking user input during auto-save...");
    canvas.style.pointerEvents = "none"; // Disable drawing
  } else {
    console.log("✅ Unblocking user input...");
    canvas.style.pointerEvents = "auto"; // Enable drawing
  }
};

// 🎨 Function to set the drawing color from Blazor
window.setDrawingColor = function (color) {
  selectedColor = color;
  ctx.strokeStyle = selectedColor;
};

function saveState() {
  undoStack.push(JSON.stringify(paths)); // Save stroke paths instead of image
  redoStack = [];
}

window.registerBlazorAutoSave = function (blazorInstance) {
  console.log("✅ Blazor Auto-Save Registered");
  blazorAutoSaveRef = blazorInstance;
};

window.unregisterBlazorAutoSave = function () {
  console.log("❌ Blazor Auto-Save Unregistered");
  blazorAutoSaveRef = null;
};

// 🖍️ Start drawing
function startDrawing(e) {
  isDrawing = true;
  // Begin a new path so the drawing is rendered correctly.
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
  // Ensure default stroke settings
  if (!ctx.strokeStyle) ctx.strokeStyle = "#000000";
  if (!ctx.lineWidth) ctx.lineWidth = 1;
  let newPath = {
    color: ctx.strokeStyle,
    width: ctx.lineWidth,
    points: [{ x: e.offsetX, y: e.offsetY }],
  };
  paths.push(newPath);
  saveState();
}

// 🖊️ Draw the line
function draw(e) {
  if (!isDrawing) return;
  let currentPath = paths[paths.length - 1];
  currentPath.points.push({ x: e.offsetX, y: e.offsetY });
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

   // Clear the previous timer
   if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }

  // Set a new timer
  setTimeout(() => {
    if (!isDrawing) {
      triggerAutoSave(); // ✅ Only auto-save when user is idle
    }
  }, 5000);
}

function stopDrawing() {
  isDrawing = false;
}

function triggerAutoSave() {
  let newData = getSVGData();
  if (newData !== lastSavedData) {
    lastSavedData = newData;
    console.log("🚀 Triggering Auto-Save...");
    if (blazorAutoSaveRef) {
      blazorAutoSaveRef
        .invokeMethodAsync("AutoSave")
        .catch((err) => console.error("Auto-Save failed:", err));
    }
  }
}

// Expose an initialization function that attaches event listeners.
// This function should be called from OnAfterRenderAsync in your Blazor component.
window.initializeCanvas = function () {
  canvas = document.getElementById("drawingCanvas");
  if (!canvas) {
    console.error("Canvas element not found during initialization!");
    return;
  }
  ctx = canvas.getContext("2d");
  ctx.lineWidth = 2; // Default stroke width
  ctx.strokeStyle = selectedColor;

  // Attach pointer and mouse events
  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerout", stopDrawing);
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);

  console.log("Canvas initialized with color:", selectedColor);
};

// ✍️ Convert strokes to SVG
window.getSVGData = function () {
  console.log("Generating SVG...");

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;
  paths.forEach((path) => {
    let d = `M ${path.points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
    svg += `<path d="${d}" stroke="${path.color}" stroke-width="${path.width}" fill="none"/>`;
  });
  svg += `</svg>`;

  return svg;
};

// 🗑️ Clear Canvas
window.clearCanvas = function () {
  let canvas = document.getElementById("drawingCanvas");
  if (!canvas) {
    console.error("clearCanvas: Canvas element not found!");
    return;
  }
  let ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("clearCanvas: Could not get canvas context!");
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths = [];
  undoStack = [];
  redoStack = [];
  console.log("Canvas cleared successfully.");
};

// 📜 Load an SVG into the canvas
window.loadSVGData = function (svgString) {
  console.log("Loading existing note...");

  let parser = new DOMParser();
  let svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  let svgPaths = svgDoc.querySelectorAll("path");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths = []; // ✅ Reset paths before loading new ones

  svgPaths.forEach((path) => {
    let strokeColor = path.getAttribute("stroke");
    let strokeWidth = parseFloat(path.getAttribute("stroke-width"));
    let d = path
      .getAttribute("d")
      .split("L")
      .map((p) => p.trim().replace("M ", "").split(","));

    if (d.length < 2) return; // Skip invalid strokes

    // ✅ Store old strokes in paths array
    let newPath = { color: strokeColor, width: strokeWidth, points: [] };

    ctx.beginPath();
    ctx.moveTo(d[0][0], d[0][1]);
    newPath.points.push({ x: d[0][0], y: d[0][1] });

    for (let i = 1; i < d.length; i++) {
      ctx.lineTo(d[i][0], d[i][1]);
      newPath.points.push({ x: d[i][0], y: d[i][1] });
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    paths.push(newPath); // ✅ Store the stroke in paths array
  });
};

window.undoCanvas = function () {
  if (undoStack.length > 0) {
    redoStack.push(JSON.stringify(paths)); // Save current state to redo
    paths = JSON.parse(undoStack.pop()); // Restore previous state
    redrawCanvas(); // Function to redraw based on paths
  }
};

window.redoCanvas = function () {
  if (redoStack.length > 0) {
    undoStack.push(JSON.stringify(paths)); // Save current state to undo
    paths = JSON.parse(redoStack.pop()); // Restore next state
    redrawCanvas();
  }
};

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths.forEach(path => {
    ctx.beginPath();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.width;
    ctx.moveTo(path.points[0].x, path.points[0].y);
    path.points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.stroke();
  });
}

// Stop AutoSave if the page is closing
window.addEventListener("beforeunload", function () {
  console.log("⚠️ Page is unloading. Stopping Auto-Save.");
  clearTimeout(autoSaveTimer);
  autoSaveTimer = null;
  isDrawing = false;
  isSaving = false;
  ctx = null;
  canvas = null;
});
