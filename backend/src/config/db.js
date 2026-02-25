const mongoose = require("mongoose");

async function connectDb(uri) {
  if (!uri) throw new Error("Missing MONGODB_URI");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

module.exports = { connectDb };

