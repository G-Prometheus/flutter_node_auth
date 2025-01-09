// IMPORTS FROM PACKAGES
const express = require("express");
const { engine } = require("express-handlebars");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const expressWs = require("express-ws");

// IMPORTS FROM OTHER FILES
const authRouter = require("./routes/auth");
const Data = require("./models/data");
const uploadRouter = require("./routes/upload");

// INIT
const PORT = process.env.PORT || 3000;
const app = express();
const DB = "mongodb+srv://minh:Mongominh%401988@cluster0.2kper.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// EXPRESS-WEBSOCKET INIT
expressWs(app);

// MIDDLEWARES
app.use(express.json()); // Middleware xử lý JSON
app.use(authRouter); // Middleware router xác thực
app.use(uploadRouter);

// HANDLEBARS CONFIGURATION
app.engine(".hbs", engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.set("views", "./views");

// WEBSOCKET HANDLER
const connections = {
  device1: { port: 8885 },
  device2: { port: 8886 },
  // Add more devices as needed
};

// Lưu danh sách các client đang kết nối
const connectedClients = [];

// Xử lý WebSocket cho từng thiết bị
Object.entries(connections).forEach(([key, settings]) => {
  const connection = connections[key];
  connection.sensors = {};

  new WebSocket.Server({ port: settings.port }, () => {
    console.log(`WS Server is listening at port ${settings.port}`);
  }).on("connection", (ws) => {
    console.log(`${key} connected`);

    // Lưu client kết nối mới
    connectedClients.push(ws);

    ws.on("message", (data) => {
      console.log(`Message from ${key}:`, data);
    
      if (ws.readyState !== ws.OPEN) return;
    
      if (typeof data === "object") {
        // Chuyển đổi dữ liệu ảnh thành base64
        connection.image = Buffer.from(new Uint8Array(data)).toString("base64");
      } else {
        // Xử lý dữ liệu chuỗi (sensor)
        connection.sensors = data.split(",").reduce((acc, item) => {
          const key = item.split("=")[0];
          const value = item.split("=")[1];
          acc[key] = value;
          return acc;
        }, {});
      }
    
      // Gửi dữ liệu cập nhật đến tất cả các client
      connectedClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ devices: connections, image: connection.image }));
        }
      });
    });
    

    ws.on("close", () => {
      console.log(`${key} disconnected`);
      const index = connectedClients.indexOf(ws);
      if (index !== -1) {
        connectedClients.splice(index, 1);
      }
    });
  });
});

// DATABASE CONNECTION
mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection Successful");
  })
  .catch((e) => {
    console.log(e);
  });

// SERVER START
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Connected at port ${PORT}`);
});
