package iuh.fit.se.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class AiChatResponse {
    private String sessionId;
    private String response;

    private List<AiProductCardDto> products;

    @Getter
    @Builder
    public static class AiProductCardDto {
        private Long productId;
        private String name;
        private String avatar;
        private BigDecimal price;
        private List<AiVariantDto> variants;
    }

    @Getter
    @Builder
    public static class AiVariantDto {
        private Long itemId;
        private String color;
        private BigDecimal price;
        private Integer stockQuantity;
    }
}
