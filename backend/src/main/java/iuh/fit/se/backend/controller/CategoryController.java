package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.CategoryDto;
import iuh.fit.se.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping("/categories")
    public List<CategoryDto> getAllCategories() {
        return categoryService.getAllCategories();
    }

}
