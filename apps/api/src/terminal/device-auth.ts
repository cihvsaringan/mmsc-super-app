import type { RequestHandler } from 'express';
import { pool } from '../database/pool.js';
import { AppError } from '../lib/errors.js';
import { digestSessionToken } from '../security/crypto.js';

export const requireTerminalDevice: RequestHandler = async (request, _response, next) => {
  try {
    const token = request.header('authorization')?.match(/^Device ([A-Za-z0-9_-]{43})$/)?.[1];
    if (!token) throw new AppError(401, 'TERMINAL_DEVICE_CREDENTIAL_REQUIRED', 'Attendance Terminal device credential is required');
    const result = await pool.query(
      `SELECT d.id device_id,d.terminal_id,d.status device_status,d.provisioned_by,t.status terminal_status,u.display_name
       FROM attendance_terminal_devices d JOIN attendance_terminals t ON t.id=d.terminal_id
       JOIN users u ON u.id=d.provisioned_by WHERE d.credential_digest=$1`,
      [digestSessionToken(token)],
    );
    const row = result.rows[0];
    if (!row) throw new AppError(401, 'TERMINAL_DEVICE_CREDENTIAL_INVALID', 'Attendance Terminal device credential is invalid');
    if (row.device_status === 'revoked') throw new AppError(403, 'TERMINAL_DEVICE_REVOKED', 'This attendance terminal device was revoked');
    if (row.terminal_status !== 'active') throw new AppError(403, 'TERMINAL_DISABLED', 'This attendance terminal is disabled');
    request.auth = { userId:String(row.provisioned_by), authenticated:true, sessionId:null, deviceId:String(row.device_id), terminalId:String(row.terminal_id), email:null, displayName:String(row.display_name), roles:['attendance_terminal_device'], permissions:['attendance.terminal.operate'] };
    next();
  } catch (error) { next(error); }
};
