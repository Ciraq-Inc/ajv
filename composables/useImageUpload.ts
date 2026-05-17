import { ref } from 'vue'
import { useFirebaseStorage } from 'vuefire'
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from 'firebase/storage'
import imageCompression from 'browser-image-compression'

export function useImageUpload() {
  const storage = useFirebaseStorage()
  const imageUrl = ref<string | null>(null)
  const imageFile = ref<File | null>(null)
  const uploadProgress = ref(0)
  const uploadError = ref<string | null>(null)
  const isUploading = ref(false)

  const handleImageUpload = async (e: Event): Promise<void> => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      try {
        isUploading.value = true
        uploadError.value = null

        // Image Compression
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }
        const compressedFile = await imageCompression(file, options)

        // Upload to Firebase Storage
        const imageName = `${Date.now()}_${file.name}`
        const imageRef = storageRef(storage, `drugImages/${imageName}`)

        // Upload with progress tracking
        const uploadTask = uploadBytesResumable(imageRef, compressedFile)

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            uploadProgress.value = progress
          },
          (error) => {
            console.error('Upload failed:', error)
            uploadError.value = 'Upload failed. Please try again.'
            isUploading.value = false
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            imageUrl.value = downloadURL
            isUploading.value = false
          }
        )

        imageFile.value = compressedFile
      } catch (error) {
        console.error('Error uploading image:', error)
        uploadError.value = 'Error processing image. Please try again.'
        isUploading.value = false
      }
    }
  }

  const resetUpload = (): void => {
    imageUrl.value = null
    imageFile.value = null
    uploadProgress.value = 0
    uploadError.value = null
    isUploading.value = false
  }

  return {
    imageUrl,
    imageFile,
    uploadProgress,
    uploadError,
    isUploading,
    handleImageUpload,
    resetUpload,
  }
}
