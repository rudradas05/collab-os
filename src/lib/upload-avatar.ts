import cloudinary from "./cloudinary";

export async function uploadAvatar(file: File, userId: string) {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "avatars",
          public_id: userId, // overwrite per user
          resource_type: "image",
          transformation: [
            { width: 256, height: 256, crop: "fill", gravity: "face" },
          ],
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
