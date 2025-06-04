import express from "express";

import boardsRouter from "./boards.route.js";
import cardsRouter from "./cards.route.js";
import columnsRouter from "./columns.route.js";
import commentsRouter from "./comments.route.js";
import usersRouter from "./users.route.js";
import avatarsRouter from "./avatar.route.js";

const router = express.Router();

const routes = () => {
  router.use("/users", /* #swagger.tags = ['Users'] */ usersRouter);
  router.use("/boards", /* #swagger.tags = ['Boards'] */ boardsRouter);
  router.use("/columns", /* #swagger.tags = ['Columns'] */ columnsRouter);
  router.use("/cards", /* #swagger.tags = ['Cards'] */ cardsRouter);
  router.use("/comment", /* #swagger.tags = ['Comments'] */ commentsRouter);
  router.use("avatars", /* #swagger.tags = ['avatars'] */ avatarsRouter)

  return router;
};

export default routes;
