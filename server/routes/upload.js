// routes/upload.js
const express = require("express");
const upload = require("../middleware/upload"); // Middleware upload
const { staff } = require("../models/nhanvien"); // Import model staff

const router = express.Router();

// Route GET /upload
router.get("/upload", (req, res) => {
  res.render("upload", { layout: false });
});

// Route POST /upload
router.post("/upload", upload.array("image", 4), async (req, res) => {
  const { name, email ,gender, position, office } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({
      message: "No images uploaded",
    });
  }

  try {
    // Chuyển danh sách file thành mảng tên file
    const images = files.map((file) => file.path);

    // Tạo document mới từ model staff
    const newStaff = new staff({
      name,
      email,
      gender,
      position,
      office,
      images,
    });

    // Lưu vào MongoDB
    await newStaff.save();

    console.log("Staff saved successfully:", newStaff);

    res.status(200).json({
      message: "Staff saved successfully",
      staff: newStaff,
    });
  } catch (error) {
    console.error("Error saving staff:", error);
    res.status(500).json({
      message: "Failed to save staff",
      error: error.message,
    });
  }
});

module.exports = router;
