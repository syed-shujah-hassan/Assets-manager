interface ImportMetaEnv {
  readonly EXPO_PUBLIC_BACKEND_URL?: string;
  readonly EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?: string;
  readonly EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?: string;
  readonly EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
