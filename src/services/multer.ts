import multer from "multer";

namespace Multer {
    export const storage = multer.memoryStorage();
    export const uploads = multer({ storage }).single("image");
}

export default Multer;
