import { Router, Response } from 'express';
import { StorageManager } from '../../infrastructure/storage/StorageManager';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/authMiddleware';

export const storageAdminRouter = Router();
const storageManager = StorageManager.getInstance();

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

function requireAdminRole(req: AuthenticatedRequest, res: Response, next: any) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Storage Admin privileges required.' });
  }
  next();
}

storageAdminRouter.get('/locations', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const locations = storageManager.getAllLocations();
    return res.json({ locations: serialize(locations) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

storageAdminRouter.patch('/locations/:id/status', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ONLINE', 'DEGRADED', 'OFFLINE', 'DRAINING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    storageManager.setLocationStatus(id, status);
    const updated = storageManager.getLocation(id);
    return res.json({ location: serialize(updated) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
