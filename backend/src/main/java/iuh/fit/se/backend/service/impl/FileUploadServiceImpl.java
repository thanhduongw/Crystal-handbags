package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileUploadServiceImpl implements FileUploadService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.s3.public-base-url:}")
    private String publicBaseUrl;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    @Override
    public String uploadImage(MultipartFile file, String directory) {
        validateFile(file);

        String safeDirectory = normalizeDirectory(directory);
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        String key = safeDirectory + "/" + fileName;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(
                    putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );

            String imageUrl = buildPublicUrl(key);
            log.info("Uploaded image to S3: {}", imageUrl);

            return imageUrl;
        } catch (IOException e) {
            log.error("Failed to read upload file", e);
            throw new RuntimeException("Could not upload file. Please try again.", e);
        } catch (Exception e) {
            log.error("Failed to upload file to S3", e);
            throw new RuntimeException("Could not upload file to S3", e);
        }
    }

    @Override
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        // Không xóa ảnh CDN ngoài như hstatic, placehold, v.v.
        if (!isManagedS3Url(imageUrl)) {
            log.info("Skip deleting external image URL: {}", imageUrl);
            return;
        }

        String key = extractKeyFromUrl(imageUrl);

        if (key == null || key.isBlank()) {
            log.warn("Cannot extract S3 key from image URL: {}", imageUrl);
            return;
        }

        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("Deleted image from S3: {}", key);
        } catch (Exception e) {
            log.error("Failed to delete image from S3: {}", imageUrl, e);
            throw new RuntimeException("Could not delete image from S3", e);
        }
    }

    @Override
    public List<String> getProductImages(Long productId) {
        String prefix = "products/" + productId + "/";

        ListObjectsV2Request request = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix(prefix)
                .build();

        return s3Client.listObjectsV2(request)
                .contents()
                .stream()
                .map(s3Object -> buildPublicUrl(s3Object.key()))
                .collect(Collectors.toList());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty or not provided");
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new RuntimeException("Only JPEG, PNG, WEBP, GIF images are allowed");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds maximum allowed size (5MB)");
        }
    }

    private String normalizeDirectory(String directory) {
        if (directory == null || directory.isBlank()) {
            return "misc";
        }

        String normalized = directory
                .replace("\\", "/")
                .replaceAll("^/+", "")
                .replaceAll("/+$", "");

        if (normalized.contains("..")) {
            throw new RuntimeException("Invalid directory path");
        }

        return normalized;
    }

    private String generateUniqueFileName(String originalFilename) {
        String extension = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        return UUID.randomUUID() + extension;
    }

    private String buildPublicUrl(String key) {
        if (publicBaseUrl != null && !publicBaseUrl.isBlank()) {
            return publicBaseUrl.replaceAll("/+$", "") + "/" + key;
        }

        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + key;
    }

    private boolean isManagedS3Url(String imageUrl) {
        if (!imageUrl.startsWith("http")) {
            return true;
        }

        String defaultS3Host = bucketName + ".s3." + region + ".amazonaws.com";

        if (imageUrl.contains(defaultS3Host)) {
            return true;
        }

        return publicBaseUrl != null
                && !publicBaseUrl.isBlank()
                && imageUrl.startsWith(publicBaseUrl.replaceAll("/+$", ""));
    }

    private String extractKeyFromUrl(String imageUrl) {
        try {
            if (!imageUrl.startsWith("http")) {
                return imageUrl.replaceAll("^/+", "");
            }

            URI uri = URI.create(imageUrl);
            String path = uri.getPath();

            if (path == null || path.isBlank()) {
                return null;
            }

            return URLDecoder.decode(
                    path.replaceAll("^/+", ""),
                    StandardCharsets.UTF_8
            );
        } catch (Exception e) {
            log.warn("Failed to extract S3 key from URL: {}", imageUrl, e);
            return null;
        }
    }
}