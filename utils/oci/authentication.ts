import * as fs from 'fs'
import {Region, SimpleAuthenticationDetailsProvider} from 'oci-common'

export const provider = new SimpleAuthenticationDetailsProvider(
  process.env.OCI_TENANCY_OCID as string,
  process.env.OCI_USER_OCID as string,
  process.env.OCI_FINGERPRINT as string,
  fs.readFileSync(process.env.OCI_PRIVATE_KEY_PATH as string, 'utf-8'), // private key contents
  null, // passphrase, if your key is encrypted (or null if not)
  Region.fromRegionId(process.env.OCI_REGION as string)
)
