import { pool } from '../config/database';
import { Request } from 'express';

interface AuditLogData {
  userId?: number;
  userEmail?: string;
  aaction: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  tableName: string;
  recordId?: number;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
}

export const createAuditLog = async (data: AuditLogData) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, user_email, action, table_name, record_id, old_data, new_data, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.userId || null,
        data.userEmail || null,
        data.action,
        data.tableName,
        data.recordId || null,
        data.oldData ? JSON.stringify(data.oldData) : null,
        data.newData ? JSON.stringify(data.newData) : null,
        data.ipAddress || null,
      ]
    );
    console.log(`📝 Audit log: ${data.action} on ${data.tableName} by ${data.userEmail}`);
  } catch (error) {
    console.error('❌ Audit log hatası:', error);
  }
};

export const getAuditLogs = async (filters?: {
  userId?: number;
  tableName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  try {
    let query = `
      SELECT 
        al.*,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.userId) {
      query += ` AND al.user_id = $${paramCount}`;
      params.push(filters.userId);
      paramCount++;
    }

    if (filters?.tableName) {
      query += ` AND al.table_name = $${paramCount}`;
      params.push(filters.tableName);
      paramCount++;
    }

    if (filters?.action) {
      query += ` AND al.action = $${paramCount}`;
      params.push(filters.action);
      paramCount++;
    }

    if (filters?.startDate) {
      query += ` AND al.created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters?.endDate) {
      query += ` AND al.created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount}`;
    params.push(filters?.limit || 100);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Audit logs fetch hatası:', error);
    throw error;
  }
};