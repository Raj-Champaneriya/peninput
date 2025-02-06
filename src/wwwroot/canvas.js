// Define your drawing functions as before
let ctx, canvas;
let drawing = false;
let undoStack = [];
let redoStack = [];
let paths = []; // Store strokes for SVG conversion

function saveState() {
  console.log("saveState:", JSON.stringify(paths));
  undoStack.push(JSON.stringify(paths)); // Save stroke paths instead of image
  redoStack = [];
}

function startDrawing(e) {
  console.log("startDrawing at", e.offsetX, e.offsetY);
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

function draw(e) {
  if (!drawing) return;
  console.log("draw at", e.offsetX, e.offsetY);
  let currentPath = paths[paths.length - 1];
  currentPath.points.push({ x: e.offsetX, y: e.offsetY });
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

  // Notify Blazor to auto-save
  clearTimeout(window.autoSaveTimer);
  window.autoSaveTimer = setTimeout(() => {
    DotNet.invokeMethodAsync("IMS.WebApp", "AutoSave"); // Call AutoSave() in Blazor
  }, 1000);
}

function stopDrawing() {
  if (drawing) {
    console.log("stopDrawing");
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
  // Attach pointer and mouse events
  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerout", stopDrawing);
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);
  console.log("Canvas initialized:", canvas);
};

// Convert the stroke paths to SVG
window.getSVGData = function () {
  console.log("getSVGData, current paths:", paths);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;
  paths.forEach((path) => {
    // Build the 'd' attribute for each stroke
    let d = `M ${path.points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
    svg += `<path d="${d}" stroke="${path.color}" stroke-width="${path.width}" fill="none"/>`;
  });
  svg += `</svg>`;
  console.log("Generated SVG:", svg);
  return svg;
};

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


// Load an SVG drawing into the canvas (redraw based on the path data)
window.loadSVGData = function (svgString) {
  console.log("loadSVGData called");
  let parser = new DOMParser();
  let svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  let svgPaths = svgDoc.querySelectorAll("path");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  svgPaths.forEach((path) => {
    let d = path
      .getAttribute("d")
      .split("L")
      .map((p) => p.trim().replace("M ", "").split(","));
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
