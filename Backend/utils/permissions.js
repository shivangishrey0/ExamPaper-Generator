export const ROLE_PERMISSIONS = {
  superadmin: ["manage_users", "create_exam", "publish_exam", "grade", "view_submissions"],
  teacher: ["create_exam", "publish_exam", "grade", "view_submissions"],
  student: ["take_exam", "view_own_results"]
};

export const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] || [];
