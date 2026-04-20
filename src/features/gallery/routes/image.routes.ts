import Image from '@gallery/controllers/image';
import Upload from '@global/helpers/upload';
import { Router } from 'express';

class ImageRoutes {
    private router: Router;

    private upload: Upload;

    constructor() {
        this.router = Router();
        this.upload = new Upload('images', 5, 10 * 1024 * 1024);
    }

    public routes(): Router {
        this.router.post('/create', this.upload.handle, Image.prototype.uploadImage);
        this.router.get('/all', Image.prototype.getImages);
        this.router.post('/delete', Image.prototype.deleteImage);
        return this.router;
    }
}

const imageRoutes: ImageRoutes = new ImageRoutes();
export default imageRoutes;
