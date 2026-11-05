import sharp from 'sharp';

export interface ImageProcessingResult {
  width?: number;
  height?: number;
  aspectRatio?: string;
  thumbnailBuffer?: Buffer;
  mediumBuffer?: Buffer;
  optimizedBuffer?: Buffer;
}

export interface ImageTransformOptions {
  rotate?: number; // 90, 180, 270
  flip?: boolean;  // vertical
  flop?: boolean;  // horizontal (mirror)
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'inside';
  };
  crop?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  quality?: number;
}

export interface TransformResult {
  transformedBuffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio?: string;
  thumbnailBuffer?: Buffer;
  mediumBuffer?: Buffer;
}

export async function transformImage(
  buffer: Buffer,
  options: ImageTransformOptions
): Promise<TransformResult> {
  let pipeline = sharp(buffer);

  if (options.rotate) {
    pipeline = pipeline.rotate(options.rotate);
  }

  if (options.flip) {
    pipeline = pipeline.flip();
  }

  if (options.flop) {
    pipeline = pipeline.flop();
  }

  if (options.crop) {
    pipeline = pipeline.extract({
      left: Math.round(options.crop.left),
      top: Math.round(options.crop.top),
      width: Math.round(options.crop.width),
      height: Math.round(options.crop.height),
    });
  }

  if (options.resize) {
    pipeline = pipeline.resize({
      width: options.resize.width,
      height: options.resize.height,
      fit: options.resize.fit || 'inside',
      withoutEnlargement: true,
    });
  }

  // Preserve format or output high-quality WebP/PNG
  const metadata = await pipeline.metadata();
  const transformedBuffer = await pipeline.toBuffer();

  const finalMeta = await sharp(transformedBuffer).metadata();
  const width = finalMeta.width || 0;
  const height = finalMeta.height || 0;

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = width && height ? gcd(width, height) : 1;
  const aspectRatio = width && height ? `${width / divisor}:${height / divisor}` : undefined;

  // Generate new variants for transformed image
  const thumbnailBuffer = await sharp(transformedBuffer)
    .resize(240, 240, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const mediumBuffer = await sharp(transformedBuffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  return {
    transformedBuffer,
    mimeType: finalMeta.format ? `image/${finalMeta.format}` : 'image/jpeg',
    width,
    height,
    aspectRatio,
    thumbnailBuffer,
    mediumBuffer,
  };
}

export async function processImageVariants(buffer: Buffer): Promise<ImageProcessingResult> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const width = metadata.width;
    const height = metadata.height;
    let aspectRatio: string | undefined;

    if (width && height) {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(width, height);
      aspectRatio = `${width / divisor}:${height / divisor}`;
    }

    // 1. Thumbnail: 240px max width/height, WebP
    const thumbnailBuffer = await sharp(buffer)
      .resize(240, 240, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // 2. Medium: 800px max width, WebP
    const mediumBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // 3. Optimized original variant in WebP format
    const optimizedBuffer = await sharp(buffer)
      .webp({ quality: 88, effort: 4 })
      .toBuffer();

    return {
      width,
      height,
      aspectRatio,
      thumbnailBuffer,
      mediumBuffer,
      optimizedBuffer,
    };
  } catch (err: any) {
    console.warn('Sharp image processing warning:', err.message);
    return {};
  }
}

