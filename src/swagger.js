import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Kanbananza",
    description: "Kanbananza a Scrum board API",
  },
  host: "localhost:3000/api",
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter your bearer token in the format **Bearer &lt;token&gt;**"
    },
  },
};

const outputFile = "./swagger-output.json";
const routes = ["./routes/index.js"];

swaggerAutogen(outputFile, routes, doc);
