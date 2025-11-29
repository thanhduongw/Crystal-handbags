package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.CategoryDto;
import iuh.fit.se.backend.model.Category;
import iuh.fit.se.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements iuh.fit.se.backend.service.CategoryService {
    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(c -> new CategoryDto(
                        c.getCategoryId(),
                        c.getName(),
                        c.getImageUrl(),
                        c.getDescription()
                ))
                .collect(Collectors.toList());
    }
}
