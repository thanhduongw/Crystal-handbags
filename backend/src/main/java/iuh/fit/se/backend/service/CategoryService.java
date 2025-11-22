package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.CategoryDto;

import java.util.List;

public interface CategoryService {
    List<CategoryDto> getAllCategories();
}
