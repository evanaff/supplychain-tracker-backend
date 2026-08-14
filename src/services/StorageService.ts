import InvariantError from "../common/exceptions/InvariantError";
import { supabaseClient } from "../lib/storage";

class StorageService {
    async uploadImage(
        fileBuffer: Buffer, 
        originalName: string, 
        folderName: string,
        mimetype: string
    ) {
        const fileExtension = originalName.split('.').pop();
        const filename = `${Math.random().toString()}.${fileExtension}`;
        const filePath = `${folderName}/${filename}`;

        const bucketName = "supplychain_tracker_bucket";

        const { error } = await supabaseClient.storage.from(bucketName).upload(filePath, fileBuffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: mimetype
        });

        if (error) {
            throw new InvariantError(`Failed to upload image: ${error.message}`);
        }

        const { data } = supabaseClient.storage.from(bucketName).getPublicUrl(filePath);

        return data.publicUrl;
    }
}

export default StorageService;