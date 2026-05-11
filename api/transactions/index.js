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

  const db = await getDb();
  const transactions = db.collection('transactions');

  try {
    if (req.method === 'GET') {
      const userTxs = await transactions
        .find({ userId: user.id })
        .sort({ date: -1, createdAt: -1 })
        .toArray();
      
      const formatted = userTxs.map(t => ({
        id: t._id.toString(),
        name: t.name,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
        note: t.note || ''
      }));
      
      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const { name, amount, type, category, date, note } = req.body;

      if (!name || !amount || !type || !category || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newTx = {
        userId: user.id,
        name,
        amount: parseFloat(amount),
        type,
        category,
        date,
        note: note || '',
        createdAt: new Date()
      };

      const result = await transactions.insertOne(newTx);

      return res.status(201).json({
        id: result.insertedId.toString(),
        ...newTx
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Transaction error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}