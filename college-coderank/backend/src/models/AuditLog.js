import { createModelAdapter } from "../db/prismaModelAdapter.js";

const AuditLog = createModelAdapter("auditLog");

export default AuditLog;
