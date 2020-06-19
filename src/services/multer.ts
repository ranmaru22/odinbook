import multer from "multer";
import DatauriParser from "datauri/parser";
import path from "path";


namespace Multer {
    export const storage = multer.memoryStorage();
    export const uploads = multer({ storage }).single("image");
    export const dataUri = ( req: any ) => new DatauriParser().format(path.extname(req.file.originalname), req.file.buffer);
}

export default Multer;
