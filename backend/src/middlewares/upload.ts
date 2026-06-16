import type { Request } from 'express'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import { AppError } from '@utils/response'
import { config } from '@config/index'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword']
const MAX_SIZE = config.app.maxFileSize

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, config.app.uploadDir)
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname)
    const name = crypto.randomUUID()
    cb(null, `${name}${ext}`)
  }
})

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('不支持的文件类型', 400))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE
  }
})

export const uploadImage = upload.single('image')
export const uploadImages = upload.array('images', 9)
export const uploadFile = upload.single('file')
