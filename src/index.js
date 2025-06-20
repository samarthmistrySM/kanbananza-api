import "./swagger.js";
import express from "express"
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express"
import cors from "cors";
import routes from "./routes/index.js";
import connectDb from "./config/connectDB.js"
import errorHandler from "./middleware/errorHandler.js"
import swaggerDocument from "./swagger-output.json" with {type: 'json'};

dotenv.config();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api", routes());
app.use(errorHandler);


const startServer = async () => {
    try {
        await connectDb(process.env.MONGO_URL);

        app.listen(PORT, async () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error.message);
        process.exit(1);
    }
}

startServer();