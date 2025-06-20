import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerPath = path.join(__dirname, "../swagger-output.json");

// 👇 Generate Swagger JSON if missing
if (!fs.existsSync(swaggerPath)) {
  const { default: swaggerAutogen } = await import("swagger-autogen");

  const doc = {
    info: {
      title: "Kanbananza",
      description: "Kanbananza a Scrum board API",
    },
    host:
      process.env.NODE_ENV === "production"
        ? "your-vercel-project.vercel.app/api"
        : "localhost:3000/api",
    schemes: [process.env.NODE_ENV === "production" ? "https" : "http"],
    securityDefinitions: {
      bearerAuth: {
        type: "apiKey",
        name: "Authorization",
        in: "header",
        description: "Enter your bearer token as **Bearer &lt;token&gt;**",
      },
    },
  };

  const routes = ["./src/routes/index.js"];
  await swaggerAutogen()(swaggerPath, routes, doc);
}

// ✅ Now import it safely
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath));

import express from "express";
import dotenv from "dotenv";
// import swaggerUi from "swagger-ui-express";

import cors from "cors";
import routes from "./routes/index.js";
import connectDb from "./config/connectDB.js";
import errorHandler from "./middleware/errorHandler.js";
// import swaggerDocument from "../swagger-output.json" with { type: "json" };

dotenv.config();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/api-doc",
  swaggerUi.serveFiles(swaggerDocument, {}),
  swaggerUi.setup(swaggerDocument, { explorer: true })
);
app.use("/api", routes());
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDb(process.env.MONGO_URL);

    // app.listen(PORT, async () => {
    //     console.log(`Server is running on port ${PORT}`);
    // });
  } catch (error) {
    console.error("Error starting server:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;
