import bcrypt from 'bcryptjs';
import { getDb } from './_lib/db.js';
import { generateToken, setCors } from './_lib/auth.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await getDb();
    const users = db.collection('users');

    let user = await users.findOne({ email });

    if (user) {
      // Login - verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    } else {
      // Register new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await users.insertOne({
        name,
        email,
        password: hashedPassword,
        createdAt: new Date()
      });
      user = { _id: result.insertedId, name, email };
    }

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}