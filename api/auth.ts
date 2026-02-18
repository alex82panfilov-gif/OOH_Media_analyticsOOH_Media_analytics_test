// api/auth.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { password } = req.body;

  // На сервере мы используем process.env
  // В Vercel Dashboard эти переменные должны быть прописаны
  const ADMIN_PASS = process.env.VITE_ADMIN_PASS;
  const GUEST_PASS = process.env.VITE_GUEST_PASS;

  if (password === ADMIN_PASS) {
    return res.status(200).json({ role: 'ADMIN' });
  } else if (password === GUEST_PASS) {
    return res.status(200).json({ role: 'GUEST' });
  } else {
    // Если пароль не подошел
    return res.status(401).json({ message: 'Неверный пароль' });
  }
}
