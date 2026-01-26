import cloudinary from "./cloudinary";

export async function uploadAvatar(file: File, userId: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "avatars",
          public_id: userId,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        },
      )
      .end(buffer);
  });
}
