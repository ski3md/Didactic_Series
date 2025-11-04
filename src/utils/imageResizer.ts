// The maximum width/height for resized images.
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
// The quality for the output JPEG image (0.0 to 1.0).
const QUALITY = 0.8;

/**
 * Resizes an image file to a maximum width/height and compresses it as a JPEG.
 * @param file The image file to process.
 * @returns A promise that resolves with a base64 data URL of the resized image.
 */
export const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Could not read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate the new dimensions to maintain aspect ratio
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert the canvas to a data URL with JPEG compression
                const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
