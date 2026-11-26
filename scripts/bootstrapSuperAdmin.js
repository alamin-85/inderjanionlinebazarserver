
require("dotenv").config();

const { connectDB, getDB } = require("../config/db");

async function bootstrapSuperAdmin() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

    if (!email) {
      throw new Error("SUPER_ADMIN_EMAIL is missing from .env");
    }

    await connectDB();

    const db = getDB();
    const users = db.collection("user");

    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      throw new Error(
        "User not found. Register this account first."
      );
    }

    if (existingUser.role === "super_admin") {
      console.log("This account is already Super Admin.");
      process.exit(0);
    }

    await users.updateOne(
      { email },
      {
        $set: {
          role: "super_admin",
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await users.findOne(
      { email },
      { projection: { email: 1, role: 1, name: 1 } }
    );

    console.log("Super Admin created successfully!");
    console.log("Name:", updatedUser.name);
    console.log("Role:", updatedUser.role);

    process.exit(0);
  } catch (error) {
    console.error("Bootstrap Error:", error.message);
    process.exit(1);
  }
}

bootstrapSuperAdmin();
