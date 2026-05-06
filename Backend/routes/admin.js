import express from "express";
import {
  createUser,
  listUsers,
  deactivateUser,
  activateUser,
  deleteUser,
} from "../controllers/superAdminController.js";
import { verifyToken, requireRole, requirePermission } from "../middleware/rbac.js";

const router = express.Router();

// All superadmin routes require: valid token + superadmin role + manage_users permission
router.use(verifyToken, requireRole("superadmin"), requirePermission("manage_users"));

router.post("/users", createUser);
router.get("/users", listUsers);
router.patch("/users/:id/deactivate", deactivateUser);
router.patch("/users/:id/activate", activateUser);   // NEW
router.delete("/users/:id", deleteUser);              // NEW

export default router;
