// api/auth.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const password = body.password;

  if (typeof password !== 'string' || password.trim().length === 0) {
    return res.status(400).json({ message: 'Некорректный payload: password обязателен и должен быть непустой строкой' });
  }


  // На сервере мы используем process.env
  // В Vercel Dashboard эти переменные должны быть прописаны
  const ADMIN_PASS = process.env.ADMIN_PASSWORD;
  const GUEST_PASS = process.env.GUEST_PASSWORD;

  if (password === ADMIN_PASS) {
    return res.status(200).json({ role: 'ADMIN' });
  } else if (password === GUEST_PASS) {
    return res.status(200).json({ role: 'GUEST' });
  } else {
    // Если пароль не подошел
    return res.status(401).json({ message: 'Неверный пароль' });
  }
}
