import express from "express";
import {
  inviteUser,
  resendInvite,
  listUsers,
  deactivateUser,
  activateUser,
  deleteUser,
} from "../controllers/superAdminController.js";
import { verifyToken, requireRole, requirePermission } from "../middleware/rbac.js";

const router = express.Router();

router.use(verifyToken, requireRole("superadmin"), requirePermission("manage_users"));

router.post("/invite", inviteUser);                          // send invite email
router.post("/users/:id/resend-invite", resendInvite);       // resend expired invite
router.get("/users", listUsers);                             // paginated list
router.patch("/users/:id/deactivate", deactivateUser);
router.patch("/users/:id/activate", activateUser);
router.delete("/users/:id", deleteUser);

export default router;