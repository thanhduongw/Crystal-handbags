package iuh.fit.se.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import iuh.fit.se.backend.dto.AiChatRequest;
import iuh.fit.se.backend.dto.AiChatResponse;
import iuh.fit.se.backend.dto.AiMessageResponse;
import iuh.fit.se.backend.model.*;
import iuh.fit.se.backend.repository.*;
import iuh.fit.se.backend.service.AiChatService;
import iuh.fit.se.backend.service.DatabaseCartService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;

    private final ProductRepository productRepository;
    private final ProductItemRepository productItemRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    private final DatabaseCartService databaseCartService;

    private final ObjectMapper objectMapper;

    private final ChatClient chatClient;

    private final ThreadLocal<List<Product>> toolProducts = ThreadLocal.withInitial(List::of);

    private final ThreadLocal<String> currentUserEmail = new ThreadLocal<>();

    @Override
    public AiChatResponse chat(AiChatRequest request, Jwt jwt) {

        User currentUser = null;

        if (jwt != null && jwt.getSubject() != null) {
            currentUser = userRepository.findByEmail(jwt.getSubject())
                    .orElse(null);
        }

        String loggedInEmail = currentUser != null ? currentUser.getEmail() : null;

        String loginStatus = loggedInEmail != null
                ? "Trạng thái hiện tại: Khách ĐÃ ĐĂNG NHẬP với email " + loggedInEmail + "."
                : "Trạng thái hiện tại: Khách CHƯA ĐĂNG NHẬP.";

        User finalCurrentUser = currentUser;

        AiConversation conversation = conversationRepository
                .findBySessionIdAndDeletedFalse(request.getSessionId())
                .orElseGet(() -> {
                    AiConversation newConversation = AiConversation.builder()
                            .sessionId(request.getSessionId())
                            .userType(finalCurrentUser != null ? UserType.CUSTOMER : UserType.GUEST)
                            .user(finalCurrentUser)
                            .deleted(false)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return conversationRepository.save(newConversation);
                });

        validateChatAccess(conversation, currentUser);

        if (currentUser != null && conversation.getUser() == null) {
            conversation.setUser(currentUser);
            conversation.setUserType(UserType.CUSTOMER);
            conversation.setUpdatedAt(LocalDateTime.now());
            conversation = conversationRepository.save(conversation);
        }

        messageRepository.save(
                AiMessage.builder()
                        .conversation(conversation)
                        .role(MessageRole.USER)
                        .content(request.getMessage())
                        .createdAt(LocalDateTime.now())
                        .build());

        List<AiMessage> history = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        List<AiMessage> historyWithoutLast = history.subList(0, history.size() - 1);

        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();

        String categoryMapping = buildCategoryMapping();

        messages.add(new SystemMessage(
                """
                        Bạn là AI shopping assistant của website Crystal.

                        %s

                        Nhiệm vụ:
                        - Tư vấn, tìm kiếm, lọc sản phẩm và hỗ trợ thêm sản phẩm vào giỏ hàng.
                        - Dữ liệu sản phẩm phải lấy từ tool/database, không tự bịa.

                        Quy tắc bắt buộc:
                        - Trả lời ngắn gọn, thân thiện bằng tiếng Việt.
                        - Nếu khách hỏi về sản phẩm, phải gọi tool phù hợp trước khi trả lời.
                        - Tìm theo từ khóa: gọi searchProducts(keyword).
                        - Tìm theo danh mục hoặc có categoryId: gọi searchProductsByCategory(categoryId).
                        - Tìm theo giá, khoảng giá, màu sắc, ngân sách: gọi searchProductsAdvanced(keyword, color, minPrice, maxPrice).
                        - Khi cần xem màu, giá, tồn kho: gọi getProductVariants(productId).
                        - Khi thêm giỏ: nếu chưa đăng nhập thì yêu cầu đăng nhập; nếu đã xác định đúng biến thể nội bộ và số lượng thì gọi addToCart.
                        - Nếu chưa rõ màu, giá hoặc số lượng, hãy hỏi lại khách.
                        - Không hiển thị productId, itemId hoặc dữ liệu kỹ thuật nội bộ cho khách.
                        - itemId chỉ dùng nội bộ để gọi addToCart, không yêu cầu khách nhập itemId.
                        - Khi hiển thị biến thể, chỉ nói màu, giá và tình trạng còn hàng/tồn kho.
                        - Không tạo đơn hàng, không thanh toán.

                        Mapping category trong DB:
                        %s
                        """
                        .formatted(loginStatus, categoryMapping)));

        if (conversation.getLastProductContext() != null
                && !conversation.getLastProductContext().isBlank()) {
            messages.add(new SystemMessage("""
                    Ngữ cảnh sản phẩm gần nhất:
                    %s
                    Dùng ngữ cảnh này để hiểu các câu như "cái đầu tiên", "màu đen", "sản phẩm đó".
                    Không hiển thị productId hoặc itemId cho khách.
                    Nếu chưa đủ rõ biến thể hoặc số lượng, hãy hỏi lại.
                     """.formatted(conversation.getLastProductContext())));
        }

        for (AiMessage msg : historyWithoutLast) {
            if (msg.getRole() == MessageRole.USER) {
                messages.add(new org.springframework.ai.chat.messages.UserMessage(msg.getContent()));
            } else {
                messages.add(new org.springframework.ai.chat.messages.AssistantMessage(msg.getContent()));
            }
        }

        messages.add(new org.springframework.ai.chat.messages.UserMessage(request.getMessage()));

        Prompt prompt = new Prompt(messages);

        String aiReply;
        List<Product> foundProducts;

        try {
            toolProducts.remove();
            currentUserEmail.remove();

            currentUserEmail.set(loggedInEmail);

            aiReply = chatClient
                    .prompt(prompt)
                    .tools(getToolCallbacks())
                    .call()
                    .content();

            foundProducts = toolProducts.get();

        } finally {
            toolProducts.remove();
            currentUserEmail.remove();
        }

        List<AiChatResponse.AiProductCardDto> productCards = mapProductsToCards(foundProducts);

        if (productCards != null && !productCards.isEmpty()) {
            conversation.setLastProductContext(buildProductContext(productCards));
            conversation.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(conversation);
        }

        messageRepository.save(
                AiMessage.builder()
                        .conversation(conversation)
                        .role(MessageRole.ASSISTANT)
                        .content(aiReply)
                        .createdAt(LocalDateTime.now())
                        .build());

        return AiChatResponse.builder()
                .sessionId(request.getSessionId())
                .response(aiReply)
                .products(productCards)
                .build();
    }

    @Override
    public List<AiMessageResponse> getMessages(String sessionId, Jwt jwt) {
        AiConversation conversation = conversationRepository
                .findBySessionIdAndDeletedFalse(sessionId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        validateConversationOwner(conversation, jwt);

        return messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(message -> AiMessageResponse.builder()
                        .role(message.getRole().name())
                        .content(message.getContent())
                        .createdAt(message.getCreatedAt())
                        .build())
                .toList();
    }

    public ToolCallbackProvider getToolCallbacks() {
        return MethodToolCallbackProvider.builder()
                .toolObjects(this)
                .build();
    }

    @Override
    public void deleteConversation(String sessionId, Jwt jwt) {
        AiConversation conversation = conversationRepository
                .findBySessionIdAndDeletedFalse(sessionId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        validateConversationOwner(conversation, jwt);

        conversation.setDeleted(true);
        conversation.setUpdatedAt(LocalDateTime.now());

        conversationRepository.save(conversation);
    }

    private List<AiChatResponse.AiProductCardDto> mapProductsToCards(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return List.of();
        }

        return products.stream()
                .limit(8)
                .map(product -> {
                    List<ProductItem> items = productItemRepository.findByProductId(product.getProductId());

                    List<AiChatResponse.AiVariantDto> variants = items.stream()
                            .map(item -> AiChatResponse.AiVariantDto.builder()
                                    .itemId(item.getItemId())
                                    .color(item.getColor())
                                    .price(item.getPrice())
                                    .stockQuantity(inventoryRepository.findByProductItemItemId(item.getItemId())
                                            .map(Inventory::getAvailableQuantity)
                                            .orElse(0))
                                    .build())
                            .toList();

                    BigDecimal displayPrice = items.stream()
                            .map(ProductItem::getPrice)
                            .filter(Objects::nonNull)
                            .min(BigDecimal::compareTo)
                            .orElse(product.getBasePrice());

                    return AiChatResponse.AiProductCardDto.builder()
                            .productId(product.getProductId())
                            .name(product.getName())
                            .avatar(product.getAvatar())
                            .price(displayPrice)
                            .variants(variants)
                            .build();
                })
                .toList();
    }

    private void validateConversationOwner(AiConversation conversation, Jwt jwt) {
        if (conversation.getUser() == null) {
            return;
        }

        if (jwt == null || jwt.getSubject() == null) {
            throw new RuntimeException("Unauthorized");
        }

        if (!conversation.getUser().getEmail().equals(jwt.getSubject())) {
            throw new RuntimeException("Access denied");
        }
    }

    private void validateChatAccess(AiConversation conversation, User currentUser) {
        User owner = conversation.getUser();

        // Session guest chưa gắn user nào thì cho chat tiếp
        if (owner == null) {
            return;
        }

        // Session đã thuộc user nhưng request hiện tại là guest
        if (currentUser == null) {
            throw new RuntimeException("Bạn không có quyền truy cập đoạn chat này.");
        }

        // Session thuộc user khác
        if (!owner.getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Bạn không có quyền truy cập đoạn chat này.");
        }
    }

    private String buildProductContext(List<AiChatResponse.AiProductCardDto> productCards) {
        if (productCards == null || productCards.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(
                    productCards.stream()
                            .map(product -> java.util.Map.of(
                                    "productId", product.getProductId(),
                                    "name", product.getName(),
                                    "variants", product.getVariants()))
                            .toList());
        } catch (Exception e) {
            return null;
        }
    }

    private String buildCategoryMapping() {
        return categoryRepository.findAll()
                .stream()
                .map(category -> "+ categoryId="
                        + category.getCategoryId()
                        + " là "
                        + category.getName())
                .collect(java.util.stream.Collectors.joining("\n"));
    }

    @Tool(description = """
            Tìm kiếm hoặc gợi ý sản phẩm thật trong database theo từ khóa.
            Bắt buộc dùng khi khách hỏi: tìm sản phẩm, xem sản phẩm, gợi ý sản phẩm,
            tư vấn sản phẩm, đề xuất sản phẩm, chọn mua sản phẩm, hỏi shop có sản phẩm không.
            Không tự dịch keyword sang tiếng Anh, không tự thêm từ khóa lạ.
            """)
    public List<Product> searchProducts(String keyword) {
        System.out.println("===== TOOL searchProducts CALLED với keyword: " + keyword);

        List<Product> products = productRepository.search(keyword);

        List<Product> limitedProducts = products.stream()
                .limit(8)
                .toList();

        toolProducts.set(limitedProducts);

        return limitedProducts;
    }

    @Tool(description = "Tìm sản phẩm theo categoryId trong danh mục hiện có của hệ thống.")
    public List<Product> searchProductsByCategory(Long categoryId) {
        System.out.println("===== TOOL searchProductsByCategory CALLED với categoryId: " + categoryId);

        List<Product> products = productRepository.findByCategoryId(categoryId);

        List<Product> limitedProducts = products.stream()
                .limit(8)
                .toList();

        toolProducts.set(limitedProducts);

        return limitedProducts;
    }

    @Tool(description = "Lấy danh sách biến thể của sản phẩm theo productId, gồm itemId, màu, giá và số lượng tồn kho.")
    public List<ProductItem> getProductVariants(Long productId) {
        System.out.println("===== TOOL getProductVariants CALLED với productId: " + productId);

        List<Product> currentProducts = toolProducts.get();

        if (currentProducts == null || currentProducts.isEmpty()) {
            productRepository.findById(productId)
                    .ifPresent(product -> toolProducts.set(List.of(product)));
        }

        return productItemRepository.findByProductId(productId);
    }

    @Tool(description = """
            Thêm sản phẩm vào giỏ hàng cho khách đã đăng nhập.
            Chỉ gọi khi đã biết chính xác itemId và số lượng.
            Nếu chưa biết màu hoặc biến thể thì phải gọi getProductVariants trước và hỏi khách chọn màu.
            """)
    public String addToCart(Long itemId, Integer quantity) {

        System.out.println("===== TOOL addToCart CALLED với itemId: " + itemId + ", quantity: " + quantity);
        System.out.println("===== currentUserEmail: " + currentUserEmail.get());

        String email = currentUserEmail.get();

        if (email == null || email.isBlank()) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null
                    && authentication.getPrincipal() instanceof Jwt jwt) {
                email = jwt.getSubject();
            }
        }

        if (email == null || email.isBlank()) {
            return "Bạn cần đăng nhập để mình thêm sản phẩm vào giỏ hàng.";
        }

        if (quantity == null || quantity <= 0) {
            quantity = 1;
        }

        ProductItem item = productItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể sản phẩm."));

        int available = inventoryRepository.findByProductItemItemId(itemId)
                .map(Inventory::getAvailableQuantity)
                .orElse(0);

        if (available <= 0) {
            return "Sản phẩm này hiện đã hết hàng.";
        }

        if (quantity > available) {
            return "Số lượng tồn kho không đủ. Hiện chỉ còn "
                    + available
                    + " sản phẩm.";
        }

        databaseCartService.addCartItem(email, itemId, quantity);

        return "Đã thêm "
                + quantity
                + " sản phẩm \""
                + item.getProduct().getName()
                + "\" màu "
                + item.getColor()
                + " vào giỏ hàng.";
    }

    @Tool(description = """
            Tìm kiếm/lọc/gợi ý sản phẩm thật trong database theo nhiều điều kiện.
            Bắt buộc dùng khi khách hỏi sản phẩm theo giá, khoảng giá, màu sắc, ngân sách.
            Quy tắc truyền tham số:
            - keyword: loại/tên sản phẩm, ví dụ "túi", "túi xách", "hobo", "shoulder strap", "ví", "balo".
            - color: màu khách muốn, ví dụ "xanh", "đen", "đỏ", "nâu". Nếu không có màu thì truyền "".
            - minPrice: giá thấp nhất dạng số VND. Nếu không có thì truyền null.
            - maxPrice: giá cao nhất dạng số VND. Nếu không có thì truyền null.
            Không tự bịa sản phẩm, giá, màu, tồn kho nếu tool không có kết quả.
            """)
    public List<Product> searchProductsAdvanced(
            String keyword,
            String color,
            Long minPrice,
            Long maxPrice) {
        System.out.println("===== TOOL searchProductsAdvanced CALLED =====");
        System.out.println("keyword = " + keyword);
        System.out.println("color = " + color);
        System.out.println("minPrice = " + minPrice);
        System.out.println("maxPrice = " + maxPrice);

        String finalKeyword = keyword == null ? "" : keyword.trim();
        String finalColor = color == null ? "" : color.trim();

        BigDecimal min = minPrice == null ? null : BigDecimal.valueOf(minPrice);
        BigDecimal max = maxPrice == null ? null : BigDecimal.valueOf(maxPrice);

        List<Product> products = productRepository.searchAdvanced(
                finalKeyword,
                finalColor,
                min,
                max);

        List<Product> limitedProducts = products.stream()
                .limit(8)
                .toList();

        toolProducts.set(limitedProducts);

        return limitedProducts;
    }
}