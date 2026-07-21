import { Router } from "express";
import { handleLogin, handleLogout, handleMe, handleRegister } from "../authHandlers";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  void handleRegister(req, res);
});

authRouter.post("/login", (req, res) => {
  void handleLogin(req, res);
});

authRouter.post("/logout", (req, res) => {
  void handleLogout(req, res);
});

authRouter.get("/me", (req, res) => {
  void handleMe(req, res);
});
