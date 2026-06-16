import { post } from '@utils/request'

export const uploadImage = (file: File): Promise<{ url: string; filename: string }> => {
  const formData = new FormData()
  formData.append('image', file)
  return post<{ url: string; filename: string }>('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
