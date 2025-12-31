import { Request, Response } from 'express';
import { getAuditLogs } from '../services/audit.service';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const { userId, tableName, action, startDate, endDate, limit } = req.query;

    const filters = {
      userId: userId ? parseInt(userId as string) : undefined,
      tableName: tableName as string,
      action: action as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : 100,
    };

    const logs = await getAuditLogs(filters);
    res.json(logs);
  } catch (error) {
    console.error('Logs fetch hatası:', error);
    res.status(500).json({ error: 'Loglar getirilemedi' });
  }
};