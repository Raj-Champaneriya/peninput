// Define your drawing functions as before
let ctx, canvas;
let drawing = false;
let undoStack = [];
let redoStack = [];
let paths = []; // Store strokes for SVG conversion
let autoSaveTimer = null;
let blazorAutoSaveRef = null;
let selectedColor = "#000000"; // Default color (black)

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
  drawing = true;
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
  if (!drawing) return;
  let currentPath = paths[paths.length - 1];
  currentPath.points.push({ x: e.offsetX, y: e.offsetY });
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

  // Restart auto-save timer on every drawing event
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    if (blazorAutoSaveRef) {
      console.log("🚀 Triggering Auto-Save...");
      blazorAutoSaveRef
        .invokeMethodAsync("AutoSave") // ✅ Ensure method name matches C#
        .catch((err) => console.error("Auto-Save failed:", err));
    } else {
      console.warn("⚠️ Auto-Save Ref is null");
    }
  }, 1000);
}

function stopDrawing() {
  if (drawing) {
  }
  drawing = false;
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
  console.log("undoCanvas called");
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
  console.log("redoCanvas called");
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
