import {signBucketUploadRequest} from './sign'
import {ObjectStorageClient} from 'oci-objectstorage'
import {getOciProvider} from '@/utils/oci/authentication'

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

export const deleteImage = async (imageUrl: string) => {
  try {
    const url = new URL(imageUrl)
    const parts = url.pathname.split('/o/')
    const objectName = decodeURIComponent(parts[1])
    const provider = getOciProvider()

    const client = new ObjectStorageClient({
      authenticationDetailsProvider: provider,
    })

    const namespaceRes = await client.getNamespace({})
    const namespace = namespaceRes.value
    const bucketName = process.env.OCI_BUCKET as string

    await client.deleteObject({
      namespaceName: namespace,
      bucketName: bucketName,
      objectName: objectName,
    })

    return true
  } catch (err) {
    console.error('Delete failed:', err)
    return false
  }
}
