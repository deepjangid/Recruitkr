import express from "express";
import { getTeam } from "../controllers/teamController.js";

const router = express.Router();

router.get("/", getTeam);

export default router;