package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.service.FileUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FileUploadServiceImpl implements FileUploadService {

    @Value("${app.file.upload.dir:uploads}")
    private String uploadDir;

    private final Path rootLocation;

    public FileUploadServiceImpl(@Value("${app.file.upload.dir:uploads}") String uploadDir) {
        this.uploadDir = uploadDir;
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
            log.info("Upload directory created at: {}", this.rootLocation);
        } catch (IOException e) {
            log.error("Could not create upload directory: {}", e.getMessage());
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    @Override
    public String uploadImage(MultipartFile file, String directory) {
        // Validate file
        validateFile(file);

        // Create directory if not exists
        Path targetLocation = createTargetDirectory(directory);

        // Generate unique filename
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        Path targetPath = targetLocation.resolve(fileName);

        try {
            // Copy file to target location
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path for URL
            return "/" + uploadDir + "/" + directory + "/" + fileName;

        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw new RuntimeException("Could not upload file. Please try again.", e);
        }
    }

    @Override
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            log.warn("Attempt to delete null or empty image URL");
            return;
        }

        // Extract path from URL
        String filePath = imageUrl.replace("/" + uploadDir + "/", "");
        Path fileToDelete = rootLocation.resolve(filePath).normalize();

        try {
            // Security check: ensure file is inside upload directory
            if (!fileToDelete.toAbsolutePath().startsWith(rootLocation.toAbsolutePath())) {
                log.warn("Security warning: Attempt to delete file outside upload directory: {}", imageUrl);
                return;
            }

            if (Files.exists(fileToDelete)) {
                Files.delete(fileToDelete);
                log.info("Successfully deleted file: {}", fileToDelete);

                // Try to delete parent directory if empty
                deleteEmptyParentDirectories(fileToDelete.getParent());
            }
        } catch (IOException e) {
            log.error("Failed to delete file: {}", e.getMessage());
            throw new RuntimeException("Could not delete file", e);
        }
    }

    @Override
    public List<String> getProductImages(Long productId) {
        Path productDir = rootLocation.resolve("products/" + productId);

        if (!Files.exists(productDir)) {
            return List.of();
        }

        try {
            return Files.list(productDir)
                    .filter(Files::isRegularFile)
                    .map(path -> "/" + uploadDir + "/products/" + productId + "/" + path.getFileName().toString())
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Failed to list files for product {}: {}", productId, e.getMessage());
            return List.of();
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty or not provided");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed (JPEG, PNG, GIF, etc.)");
        }

        // Check file size (max 5MB)
        long maxSize = 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds maximum allowed size (5MB)");
        }
    }

    private Path createTargetDirectory(String directory) {
        Path targetLocation = rootLocation.resolve(directory).normalize();

        // Security check: prevent directory traversal
        if (!targetLocation.toAbsolutePath().startsWith(rootLocation.toAbsolutePath())) {
            log.error("Invalid directory path attempted: {}", directory);
            throw new RuntimeException("Invalid directory path");
        }

        try {
            if (!Files.exists(targetLocation)) {
                Files.createDirectories(targetLocation);
                log.debug("Created directory: {}", targetLocation);
            }
        } catch (IOException e) {
            log.error("Could not create directory: {}", e.getMessage());
            throw new RuntimeException("Could not create directory", e);
        }

        return targetLocation;
    }

    private String generateUniqueFileName(String originalFilename) {
        if (originalFilename == null || originalFilename.isEmpty()) {
            return UUID.randomUUID().toString();
        }

        String extension = "";
        int lastDotIndex = originalFilename.lastIndexOf(".");
        if (lastDotIndex > 0) {
            extension = originalFilename.substring(lastDotIndex).toLowerCase();
        }

        return UUID.randomUUID().toString() + extension;
    }

    private void deleteEmptyParentDirectories(Path directory) {
        try {
            if (Files.isDirectory(directory) && Files.list(directory).count() == 0) {
                Files.delete(directory);
                log.debug("Deleted empty directory: {}", directory);

                // Recursively check parent directory
                Path parent = directory.getParent();
                if (parent != null && !parent.equals(rootLocation)) {
                    deleteEmptyParentDirectories(parent);
                }
            }
        } catch (IOException e) {
            log.debug("Could not delete directory (may not be empty): {}", e.getMessage());
        }
    }
}