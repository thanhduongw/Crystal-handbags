package iuh.fit.se.backend.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface FileUploadService {
    String uploadImage(MultipartFile file, String directory);
    void deleteImage(String imageUrl);
    List<String> getProductImages(Long productId);
}