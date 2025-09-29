import * as fs from 'fs'
import {Region, SimpleAuthenticationDetailsProvider} from 'oci-common'

let providerInstance: SimpleAuthenticationDetailsProvider | null = null

export function getOciProvider(): SimpleAuthenticationDetailsProvider {
  // Check if the instance has already been created
  if (providerInstance) {
    return providerInstance
  }

  // File read only occurs here, inside the function
  const privateKeyContents = fs.readFileSync(
    process.env.OCI_PRIVATE_KEY_PATH as string,
    'utf-8'
  )

  providerInstance = new SimpleAuthenticationDetailsProvider(
    process.env.OCI_TENANCY_OCID as string,
    process.env.OCI_USER_OCID as string,
    process.env.OCI_FINGERPRINT as string,
    privateKeyContents,
    null, // passphrase, if your key is encrypted
    Region.fromRegionId(process.env.OCI_REGION as string)
  )

  return providerInstance
}
