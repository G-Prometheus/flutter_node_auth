const express = require("express");
const routeDataRouter = express.Router();
const Data = require("../models/data");

routeDataRouter.post("/api/data", async (req, res) => {
    try {
        const { doorState } = req.body;

        let newData = new Data({
            doorState,
        });
        newData = await newData.save();
        console.log("Data saved:", newData); // In dữ liệu đã lưu vào MongoDB
        res.json(newData);
    } catch (e) {
        console.error("Error saving data:", e); // In ra lỗi nếu có
        res.status(500).json({ error: e.message });
    }
});
