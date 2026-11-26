
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing from environment variables");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let database;

async function connectDB() {
  if (database) {
    return database;
  }

  await client.connect();

  database = client.db("inderjani_online_bazar");

  await database.command({ ping: 1 });

  console.log("MongoDB connected successfully!");

  return database;
}

function getDB() {
  if (!database) {
    throw new Error("Database is not connected yet");
  }

  return database;
}

module.exports = { connectDB, getDB };
