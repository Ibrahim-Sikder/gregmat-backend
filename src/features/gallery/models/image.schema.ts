import { model, Schema } from 'mongoose';
import type { IGalleryImage } from '@gallery/interfaces/image.interface';

const galleryImageSchema = new Schema<IGalleryImage>(
    {
        url: { type: String, required: true },
        fileId: { type: String, required: true },
        name: { type: String, required: true },
    },
    { timestamps: true }
);

const GalleryImage = model<IGalleryImage>('GalleryImage', galleryImageSchema, 'GalleryImage');

export default GalleryImage;
