
require("dotenv").config();

const { connectDB } = require("./config/db");

const products = [
  { id: "1", name: "Fresh Red Apples", bn: "তাজা লাল আপেল", price: 220, emoji: "🍎", category: "Grocery", stock: 50 },
  { id: "2", name: "Fresh Milk", bn: "তাজা দুধ", price: 90, emoji: "🥛", category: "Grocery", stock: 50 },
  { id: "3", name: "Fresh Vegetables", bn: "তাজা সবজি", price: 120, emoji: "🥦", category: "Grocery", stock: 50 },
  { id: "4", name: "Premium Coffee", bn: "প্রিমিয়াম কফি", price: 350, emoji: "☕", category: "Grocery", stock: 30 },
  { id: "5", name: "Men's T-Shirt", bn: "ছেলেদের টি-শার্ট", price: 450, emoji: "👕", category: "Fashion", stock: 30 },
  { id: "6", name: "Smart Headphones", bn: "স্মার্ট হেডফোন", price: 850, emoji: "🎧", category: "Electronics", stock: 20 },
  { id: "7", name: "Face Cream", bn: "ফেস ক্রিম", price: 280, emoji: "🧴", category: "Beauty", stock: 30 },
  { id: "8", name: "Kitchen Set", bn: "কিচেন সেট", price: 650, emoji: "🍽️", category: "Home", stock: 20 },
  { id: "9", name: "Baby Toy", bn: "শিশুদের খেলনা", price: 320, emoji: "🧸", category: "Baby & Kids", stock: 20 },
  { id: "10", name: "Notebook", bn: "নোটবুক", price: 60, emoji: "📒", category: "Stationery", stock: 100 },
  { id: "11", name: "Cleaning Liquid", bn: "ক্লিনিং লিকুইড", price: 180, emoji: "🧼", category: "Cleaning", stock: 30 },
];

async function seedProducts() {
  try {
    const db = await connectDB();
    const collection = db.collection("products");

    for (const product of products) {
      await collection.updateOne(
        { id: product.id },
        {
          $set: {
            ...product,
            status: "active",
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    console.log(`${products.length} products inserted/updated successfully!`);
  } catch (error) {
    console.error("Product seeding failed:", error);
    process.exitCode = 1;
  }
}

seedProducts();
