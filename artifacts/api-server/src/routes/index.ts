import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import projectsRouter from "./projects";
import servicesRouter from "./services";
import newsRouter from "./news";
import jobsRouter from "./jobs";
import brokersRouter from "./brokers";
import boardRouter from "./board";
import employeesRouter from "./employees";
import messagesRouter from "./messages";
import chatRouter from "./chat";
import aiRouter from "./ai";
import pagesRouter from "./pages";
import statsRouter from "./stats";
import emailRouter from "./email";
import forgotPasswordRouter from "./forgot-password";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(projectsRouter);
router.use(servicesRouter);
router.use(newsRouter);
router.use(jobsRouter);
router.use(brokersRouter);
router.use(boardRouter);
router.use(employeesRouter);
router.use(messagesRouter);
router.use(chatRouter);
router.use(aiRouter);
router.use(pagesRouter);
router.use(statsRouter);
router.use(emailRouter);
router.use(forgotPasswordRouter);

export default router;
