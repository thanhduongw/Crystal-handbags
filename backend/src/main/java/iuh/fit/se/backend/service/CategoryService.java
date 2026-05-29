package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.CategoryDto;
import iuh.fit.se.backend.model.Category;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CategoryService {
    List<CategoryDto> getAllCategories();
    CategoryDto getCategoryById(Long id);
    CategoryDto createCategory(CategoryDto categoryDto);
    CategoryDto updateCategory(Long id, CategoryDto categoryDto);
    void deleteCategory(Long id);
    CategoryDto uploadCategoryImage(Long id, MultipartFile image);
    void deleteCategoryImage(Long id);
}
