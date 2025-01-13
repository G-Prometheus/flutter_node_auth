const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const canvas = require('canvas');
const faceapi = require('face-api.js');
const fs = require('fs');

const app = express();
const WS_PORT = 8888; // Cổng WebSocket
const HTTP_PORT = 8000; // Cổng HTTP

const wsServer = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log('WS Server is listening at ws://localhost:${WS_PORT}');
});

let connectedClients = [];

// Khởi tạo face-api.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Tải dữ liệu huấn luyện
let faceMatcher;
(async () => {
  console.log("Loading face-api.js models...");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('uploads/models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('uploads/models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('uploads/models');

  const trainingData = JSON.parse(fs.readFileSync('./trainingData.json'));
  const labeledDescriptors = trainingData.map(data => new faceapi.LabeledFaceDescriptors(
    data.label,
    data.descriptors.map(d => new Float32Array(d))
  ));
  faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
  console.log("Models loaded and face matcher initialized!");
})();

// Xử lý WebSocket
wsServer.on('connection', (ws, req) => {
  console.log('Client connected');
  connectedClients.push(ws);

  ws.on('message', async data => {
    try {
      console.log('Received frame', data);
      // Xử lý dữ liệu ảnh từ ESP32
      const buffer = Buffer.from(data);
      const img = await canvas.loadImage(buffer);
      const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

      const outCanvas = canvas.createCanvas(img.width, img.height);
      const outCtx = outCanvas.getContext('2d');
      outCtx.drawImage(img, 0, 0, img.width, img.height);

      detections.forEach(detection => {
        const box = detection.detection.box;
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
        outCtx.strokeStyle = 'red';
        outCtx.lineWidth = 2;
        outCtx.strokeRect(box.x, box.y, box.width, box.height);
        outCtx.fillStyle = 'red';
        outCtx.font = '20px Arial';
        outCtx.fillText(bestMatch.toString(), box.x, box.y - 10);
      });

      const outBuffer = outCanvas.toBuffer('image/jpeg');
      connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(outBuffer);
        }
      });
    } catch (err) {
      console.error("Error processing frame:", err);
    }
  });

  ws.on('close', () => {
    connectedClients = connectedClients.filter(client => client !== ws);
    console.log('Client disconnected');
  });
});

// Phục vụ client HTML
app.get('/client', (req, res) => res.sendFile(path.resolve(__dirname, './index.html')));
app.listen(HTTP_PORT, () => console.log('HTTP server is listening at http://localhost:${HTTP_PORT}'));