import {signBucketUploadRequest} from './sign'

export const uploadImage = async (image: Blob, originalName: string) => {
  const {uploadUrl, objectName} = await signBucketUploadRequest(originalName)

  if (uploadUrl) {
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: image,
      headers: {
        'Content-Type': image.type,
      },
    })

    if (!uploadRes.ok) {
      console.log('upload failed')
      return
    }
  }

  return objectName
}
