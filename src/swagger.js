import swaggerAutogen from "swagger-autogen";

const isProd = process.env.NODE_ENV === "production";

const doc = {
  info: {
    title: "Kanbananza",
    description: "Kanbananza a Scrum board API",
  },
  host: isProd ? "https://kanbananza-api.vercel.app/api" : "localhost:3000/api",
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description:
        "Enter your bearer token in the format **Bearer &lt;token&gt;**",
    },
  },
};

const outputFile = "./swagger-output.json";
const routes = ["./routes/index.js"];

swaggerAutogen()(outputFile, routes, doc);
