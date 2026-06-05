import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/index.js'

const router = Router()

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
  phone?: string;
}

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body
  const db = getDb()
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as User | undefined
  
  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }
  
  res.json({ 
    success: true, 
    data: { 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      name: user.name,
      phone: user.phone
    } 
  })
})

router.get('/users', (req: Request, res: Response): void => {
  const db = getDb()
  const users = db.prepare('SELECT id, username, role, name, phone, created_at FROM users ORDER BY created_at').all() as User[]
  res.json({ success: true, data: users })
})

router.get('/users/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const user = db.prepare('SELECT id, username, role, name, phone, created_at FROM users WHERE id = ?').get(req.params.id) as User | undefined
  
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }
  
  res.json({ success: true, data: user })
})

router.post('/logout', (req: Request, res: Response): void => {
  res.json({ success: true, message: '退出登录成功' })
})

export default router
