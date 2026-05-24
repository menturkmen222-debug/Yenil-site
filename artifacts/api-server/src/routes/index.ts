import { Router, type IRouter } from "express";
import healthRouter from "./health";
import demiryolRouter from "./demiryol";
import uploadRouter from "./upload";
import locationRouter from "./location";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(demiryolRouter);
router.use(uploadRouter);
router.use(locationRouter);
router.use(aiRouter);

export default router;
