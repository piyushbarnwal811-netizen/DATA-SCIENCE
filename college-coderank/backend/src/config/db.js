import dns from "node:dns";
import mongoose from "mongoose";

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to start the API.");
  }

  const dnsServers = process.env.MONGODB_DNS_SERVERS
    ?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (dnsServers?.length) dns.setServers(dnsServers);

  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    if (error.message.includes("querySrv") || error.message.includes("ECONNREFUSED")) {
      console.error(
        "Tip: Your network DNS blocked the MongoDB SRV record. Use direct shard replica-set hosts in MONGODB_URI instead of mongodb+srv://."
      );
    }
    throw error;
  }
}