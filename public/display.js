const socket = io();
let clientsData = {};

socket.on('client_data', ({ id, data }) => {
  if (typeof data.x === 'number' && typeof data.y === 'number') {
    clientsData[id] = {
      x: data.x,
      y: data.y,
      rgb: data.rgb || { r: 200, g: 200, b: 200 },
      orientation: data.orientation || 0,
      lastUpdate: Date.now(),
    };
  }
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  rectMode(CENTER);
}

function draw() {
  background(240);
  const now = Date.now();

  for (const id in clientsData) {
    const client = clientsData[id];

    // Inactive si pas mis à jour depuis 3s
    if (now - client.lastUpdate > 3000) continue;

    const x = (client.x / 100) * width;
    const y = (client.y / 100) * height;

    push();
    translate(x, y);
    rotate(client.orientation || 0);
    fill(client.rgb.r, client.rgb.g, client.rgb.b);
    noStroke();
    rect(0, 0, 50, 50);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
