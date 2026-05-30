package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.constants.RedisKeyConstants;
import iuh.fit.se.backend.dto.CategoryDto;
import iuh.fit.se.backend.model.Category;
import iuh.fit.se.backend.repository.CategoryRepository;
import iuh.fit.se.backend.service.CacheInvalidationService;
import iuh.fit.se.backend.service.CategoryService;
import iuh.fit.se.backend.service.FileUploadService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final FileUploadService fileUploadService;
    private final CacheInvalidationService cacheInvalidationService;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisKeyConstants.Cache.CATEGORY, key = "'all'", unless = "#result == null || #result.isEmpty()")
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisKeyConstants.Cache.CATEGORY, key = "#id", unless = "#result == null")
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));
        return convertToDto(category);
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryDto categoryDto) {
        // Check if category with same name already exists
        List<Category> existingCategories = categoryRepository.findByName(categoryDto.getName());
        if (!existingCategories.isEmpty()) {
            throw new RuntimeException("Category with name '" + categoryDto.getName() + "' already exists");
        }

        Category category = Category.builder()
                .name(categoryDto.getName())
                .imageUrl(categoryDto.getImageUrl())
                .description(categoryDto.getDescription())
                .build();

        Category savedCategory = categoryRepository.save(category);
        cacheInvalidationService.evictCategoryCaches();
        cacheInvalidationService.evictProductCaches();
        return convertToDto(savedCategory);
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(Long id, CategoryDto categoryDto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));

        // Check if name is being changed to an existing name
        if (!category.getName().equals(categoryDto.getName())) {
            List<Category> existingCategories = categoryRepository.findByName(categoryDto.getName());
            if (!existingCategories.isEmpty()) {
                throw new RuntimeException("Category with name '" + categoryDto.getName() + "' already exists");
            }
        }

        category.setName(categoryDto.getName());
        category.setDescription(categoryDto.getDescription());

        Category updatedCategory = categoryRepository.save(category);
        cacheInvalidationService.evictCategoryCaches();
        cacheInvalidationService.evictProductCaches();
        return convertToDto(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));

        // Check if category has products
        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new RuntimeException("Cannot delete category with existing products");
        }

        if (category.getImageUrl() != null && !category.getImageUrl().isBlank()) {
            try {
                fileUploadService.deleteImage(category.getImageUrl());
            } catch (Exception e) {
                System.err.println("Failed to delete category image: "
                        + category.getImageUrl()
                        + " - "
                        + e.getMessage());
            }
        }

        categoryRepository.delete(category);
        cacheInvalidationService.evictCategoryCaches();
        cacheInvalidationService.evictProductCaches();
    }
    @Override
    @Transactional
    public CategoryDto uploadCategoryImage(Long id, MultipartFile image) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));

        String oldImageUrl = category.getImageUrl();

        String imageUrl = fileUploadService.uploadImage(image, "categories/" + id);

        category.setImageUrl(imageUrl);
        Category savedCategory = categoryRepository.save(category);

        if (oldImageUrl != null && !oldImageUrl.isBlank()) {
            try {
                fileUploadService.deleteImage(oldImageUrl);
            } catch (Exception e) {
                System.err.println("Failed to delete old category image: "
                        + oldImageUrl
                        + " - "
                        + e.getMessage());
            }
        }

        cacheInvalidationService.evictCategoryCaches();
        cacheInvalidationService.evictProductCaches();
        return convertToDto(savedCategory);
    }
    @Override
    @Transactional
    public void deleteCategoryImage(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));

        if (category.getImageUrl() != null && !category.getImageUrl().isBlank()) {
            try {
                fileUploadService.deleteImage(category.getImageUrl());
            } catch (Exception e) {
                System.err.println("Failed to delete category image: "
                        + category.getImageUrl()
                        + " - "
                        + e.getMessage());
            }
        }

        category.setImageUrl(null);
        categoryRepository.save(category);
        cacheInvalidationService.evictCategoryCaches();
        cacheInvalidationService.evictProductCaches();
    }
    private CategoryDto convertToDto(Category category) {
        return CategoryDto.builder()
                .categoryId(category.getCategoryId())
                .name(category.getName())
                .imageUrl(category.getImageUrl())
                .description(category.getDescription())
                .build();
    }
}
