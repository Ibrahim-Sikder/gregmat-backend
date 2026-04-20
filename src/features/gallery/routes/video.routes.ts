import Video from '@gallery/controllers/video';
import ChunkUpload from '@global/helpers/chunk-upload';
import { Router } from 'express';

class VideoRoutes {
    private router: Router;

    private chunkUpload: ChunkUpload;

    constructor() {
        this.router = Router();
        this.chunkUpload = new ChunkUpload();
    }

    public routes(): Router {
        // Chunk upload endpoints
        this.router.post('/chunk', this.chunkUpload.handleChunk);
        this.router.post('/assemble', Video.prototype.assembleVideo);

        // Regular endpoints
        this.router.post('/create', Video.prototype.create);
        this.router.get('/all', Video.prototype.getAll);
        this.router.post('/delete', Video.prototype.delete);

        return this.router;
    }
}

const videoRoutes = new VideoRoutes();

export default videoRoutes;
