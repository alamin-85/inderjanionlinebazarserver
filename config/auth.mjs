
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { expo } from "@better-auth/expo";
import dbModule from "./db.js";

const { getDB } = dbModule;

export const auth = betterAuth({
  database: mongodbAdapter(getDB()),

  secret: process.env.BETTER_AUTH_SECRET,

  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins: [
    "http://localhost:4000",
    "http://localhost:8081",
     "http://localhost:8082",
     "http://localhost:8083",
     
    "https://inderjanionlinebazar.vercel.app",
    "inderjanionlinebazarapp://",

    ...(process.env.NODE_ENV !== "production"
      ? ["exp://", "exp://**"]
      : []),
  ],

  user: {
    additionalFields: {
      role: {
        type: [
          "customer",
          "super_admin",
          "admin",
          "manager",
          "staff",
        ],
        required: false,
        defaultValue: "customer",
        input: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // Google Login
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },

  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  plugins: [
    expo(),
  ],
});
