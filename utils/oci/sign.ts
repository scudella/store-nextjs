import {ObjectStorageClient, models} from 'oci-objectstorage'
import {provider} from '@/utils/oci/authentication'

export async function signBucketUploadRequest(originalName: string) {
  try {
    const client = new ObjectStorageClient({
      authenticationDetailsProvider: provider,
    })

    // Get namespace (like an account ID for Object Storage)
    const namespaceRes = await client.getNamespace({})
    const namespace = namespaceRes.value

    const bucketName = process.env.OCI_BUCKET as string
    const objectName = `uploads/${Date.now()}-${originalName}`

    // Create a pre-authenticated request (PAR)
    const request = {
      namespaceName: namespace,
      bucketName,
      createPreauthenticatedRequestDetails: {
        name: `upload-par-${Date.now()}`,
        bucketListingAction: 'Deny' as const,
        objectName, // only allow upload of this specific file
        accessType:
          models.CreatePreauthenticatedRequestDetails.AccessType.ObjectWrite,
        timeExpires: new Date(Date.now() + 5 * 60 * 1000), // expires in 5 min
      },
    }

    const response = await client.createPreauthenticatedRequest(request)

    return {
      uploadUrl: response.preauthenticatedRequest?.fullPath,
      objectName,
    }
  } catch (err) {
    console.error('OCI Error: ', err)
    return {
      error: 'Failed to create upload URL',
      details: String(err),
      status: 500,
    }
  }
}
