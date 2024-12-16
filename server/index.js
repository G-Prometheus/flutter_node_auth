const express = require("express");
const mongoose = require("mongoose");
const authRouter = require("./routes/auth");
const expressWs = require("express-ws");
const Data = require("./models/data");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const app = express();
expressWs(app); // Kích hoạt middleware WebSocket

// Tập hợp để lưu trữ các client WebSocket
const clients = new Set();
let lastState = null; // Biến để lưu trạng thái cuối cùng

app.use(express.json());
app.use(authRouter);

const DB = "mongodb+srv://minh:Mongominh%401988@cluster0.2kper.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection Successful");
  })
  .catch((e) => {
    console.log(e);
  });

// Định nghĩa route WebSocket
app.ws("/echo", (ws) => {
  // Thêm client mới vào tập hợp khi kết nối được thiết lập
  clients.add(ws);

  ws.on("message", async (msg) => {
    console.log("Received: ", msg);
    try {
      // Kiểm tra nếu message là "on" hoặc "off"
      if (msg === "ON" || msg === "OFF") {
        // Nếu trạng thái mới khác trạng thái cuối cùng
        if (msg !== lastState) {
          // Cập nhật trạng thái cuối cùng
          lastState = msg;

          // Lưu trạng thái mới vào MongoDB
          const newData = new Data({
            doorState: msg,
          });
          await newData.save();
          console.log("Door state saved to MongoDB:", msg);
        } else {
          console.log("Door state is the same as the last state, no save required.");
        }
      } else {
        console.log(`Ignored message: ${msg} (not 'ON' or 'OFF')`);
      }

      // Gửi thông điệp tới tất cả client khác
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== ws) {
          client.send(msg); // Gửi thông điệp xuống client
        }
      });
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          status: "error",
          message: "Failed to process door state",
        })
      );
    }
  });


  ws.on("close", () => {
    // Xóa client khi ngắt kết nối
    clients.delete(ws);
    console.log("Client disconnected");
  });
});
app.get("/api/history", async (req, res) => {
  try {
    const data = await Data.find({}).sort({ createdAt: -1 }); // Lấy tất cả dữ liệu, sắp xếp theo createdAt
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Failed to fetch data" });
  }
});
app.delete('/api/history/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Kiểm tra tính hợp lệ của ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid ID format');
    }

    // Tìm và xóa dữ liệu từ mô hình Data
    const result = await Data.findByIdAndDelete(id);

    // Kiểm tra xem có dữ liệu nào được xóa không
    if (!result) {
      return res.status(404).send('Data not found');
    }

    res.status(200).send('Deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Connected at port ${PORT}`);
});
