import { Router, type IRouter } from "express";
import healthRouter from "./health";
import demiryolRouter from "./demiryol";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(demiryolRouter);
router.use(uploadRouter);

export default router;
