export const PERMISSIONS: Record<string, string[]> = {
  role_operator: ['form:create_own', 'form:edit_own_draft', 'form:submit_own', 'dashboard:view_own_machine'],
  role_supervisor: ['form:view_department', 'form:edit_department', 'form:countersign', 'form:request_correction', 'dashboard:view_department', 'report:export_department'],
  role_qa: ['form:view_department', 'qa:record_observation', 'qa:sign', 'dashboard:view_qa'],
  role_manager: ['form:view_plant', 'dashboard:view_plant', 'report:export_plant', 'alert:manage', 'form:approve_correction'],
  role_admin: ['admin:master_data', 'admin:users', 'admin:form_templates', 'admin:full_access'],
};
export const NAV_BY_ROLE: Record<string, string[]> = {
  role_operator: ['dashboard', 'entry'],
  role_supervisor: ['dashboard', 'entry', 'submissions'],
  role_qa: ['dashboard', 'entry', 'submissions'],
  role_manager: ['dashboard', 'submissions', 'reports'],
  role_admin: ['dashboard', 'entry', 'submissions', 'reports', 'master'],
};
