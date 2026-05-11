import { ObjectId } from 'mongodb';
import { getDb } from '../_lib/db.js';
import { verifyToken, setCors } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const db = await getDb();
  const transactions = db.collection('transactions');

  try {
    if (req.method === 'DELETE') {
      const result = await transactions.deleteOne({
        _id: new ObjectId(id),
        userId: user.id
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}