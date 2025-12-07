package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.CategoryDto;
import iuh.fit.se.backend.model.Category;
import iuh.fit.se.backend.repository.CategoryRepository;
import iuh.fit.se.backend.service.CategoryService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
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
        category.setImageUrl(categoryDto.getImageUrl());
        category.setDescription(categoryDto.getDescription());

        Category updatedCategory = categoryRepository.save(category);
        return convertToDto(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new EntityNotFoundException("Category not found: " + id);
        }

        // Check if category has products
        Category category = categoryRepository.findById(id).get();
        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new RuntimeException("Cannot delete category with existing products");
        }

        categoryRepository.deleteById(id);
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