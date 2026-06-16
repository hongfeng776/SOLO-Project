import { Router } from 'express'
import { uploadImage } from '@middlewares/upload'
import { success } from '@utils/response'
import type { Request, Response, NextFunction } from 'express'

const router = Router()

router.post('/image', uploadImage, (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.file) {
      success(res, { url: '' }, '上传失败')
      return
    }
    const url = `/uploads/${req.file.filename}`
    success(res, { url, filename: req.file.filename }, '上传成功')
  } catch (error) {
    next(error)
  }
})

export default router
