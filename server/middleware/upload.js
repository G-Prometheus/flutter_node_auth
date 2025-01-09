// middlewares/upload.js
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const name = req.body.name; // Lấy tên từ form
    const folder = `./data/${name}`;
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder); // Đặt thư mục lưu trữ
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Giữ nguyên tên file gốc
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
