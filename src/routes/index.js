import express from "express";

import boardsRouter from "./boards.route.js";
import cardsRouter from "./cards.route.js";
import columnsRouter from "./columns.route.js";
import commentsRouter from "./comments.route.js";
import usersRouter from "./users.route.js";
import avatarsRouter from "./avatars.route.js";
import activitiesRouter from "./activities.route.js";
import invitationsRouter from "./invitations.route.js";

const router = express.Router();

const routes = () => {
  router.use("/users", /* #swagger.tags = ['Users'] */ usersRouter);
  router.use("/boards", /* #swagger.tags = ['Boards'] */ boardsRouter);
  router.use(
    "/invitations",
    /* #swagger.tags = ['Invitations'] */ invitationsRouter
  );
  router.use("/columns", /* #swagger.tags = ['Columns'] */ columnsRouter);
  router.use("/cards", /* #swagger.tags = ['Cards'] */ cardsRouter);
  router.use("/comments", /* #swagger.tags = ['Comments'] */ commentsRouter);
  router.use(
    "/activities",
    /* #swagger.tags = ['Activities'] */ activitiesRouter
  );
  router.use("/avatars", /* #swagger.tags = ['Avatars'] */ avatarsRouter);

  return router;
};

export default routes;
