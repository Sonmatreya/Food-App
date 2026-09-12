const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "sonmatreyabaug@gmail.com";

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found.");
      process.exit(1);
    }

    user.role = "admin";
    await user.save();

    console.log("\nAdmin access granted successfully.");
    console.log(`Name : ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role : ${user.role}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

makeAdmin();