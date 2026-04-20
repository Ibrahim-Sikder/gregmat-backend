import { Schema, model } from 'mongoose';
import { VideoPrivacyStatus, type IGalleryVideo } from '@gallery/interfaces/video.interface';

const GalleryVideoSchema = new Schema<IGalleryVideo>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        videoId: { type: String, required: true },
        url: { type: String, required: true },
        thumbnail: { type: String, default: '' },
        privacyStatus: {
            type: String,
            enum: VideoPrivacyStatus,
            default: VideoPrivacyStatus.Private,
        },
        duration: { type: String, default: '' },
    },
    {
        timestamps: true,
    }
);

const GalleryVideoModel = model<IGalleryVideo>('GalleryVideo', GalleryVideoSchema, 'GalleryVideo');

export default GalleryVideoModel;
