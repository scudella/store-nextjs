import {Label} from '../ui/label'
import {Input} from '../ui/input'

function ImageInput() {
  const name = 'image'

  return (
    <div className='mb-2'>
      <Label htmlFor={name} className='capitalize mb-2'>
        Image
      </Label>
      <Input
        id={name}
        name={name}
        type='file'
        required
        accept='image/*'
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            // update a hidden input with file.name
            document.querySelector<HTMLInputElement>('#imageName')!.value =
              file.name
          }
        }}
      />
      <Input type='hidden' name='imageName' id='imageName' />
    </div>
  )
}
export default ImageInput
