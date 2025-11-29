package iuh.fit.se.backend.dto;

public record CategoryDto(
        Long id,
        String name,
        String imageUrl,
        String description
) {}
