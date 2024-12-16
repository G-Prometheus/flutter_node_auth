const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema(
    {
      doorState: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: true, // Tự động thêm createdAt và updatedAt
    }
  );

module.exports = mongoose.model("Data", dataSchema);
