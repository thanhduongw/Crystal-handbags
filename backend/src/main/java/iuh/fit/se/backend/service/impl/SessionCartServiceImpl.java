package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.CartLineDto;
import iuh.fit.se.backend.service.SessionCartService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionCartServiceImpl implements SessionCartService {
    private static final String CART_ATTR = "GUEST_CART";

    @SuppressWarnings("unchecked")
    @Override
    public List<CartLineDto> getCart(HttpSession session) {
        List<CartLineDto> cart = (List<CartLineDto>) session.getAttribute(CART_ATTR);
        return cart == null ? new ArrayList<>() : cart;
    }

    @Override
    public void addItem(HttpSession session, CartLineDto dto) {
        List<CartLineDto> cart = getCart(session);
        cart.stream()
                .filter(l -> l.getItemId().equals(dto.getItemId()))
                .findFirst()
                .ifPresentOrElse(
                        l -> l.setQty(l.getQty() + dto.getQty()),
                        () -> cart.add(dto));
        session.setAttribute(CART_ATTR, cart);
    }

    @Override
    public void updateQty(HttpSession session, Long itemId, int delta) {
        List<CartLineDto> cart = getCart(session);
        cart.forEach(l -> {
            if (l.getItemId().equals(itemId))
                l.setQty(Math.max(0, l.getQty() + delta));
        });
        cart.removeIf(l -> l.getQty() == 0);
        session.setAttribute(CART_ATTR, cart);
    }

    @Override
    public void removeItem(HttpSession session, Long itemId) {
        List<CartLineDto> cart = getCart(session);
        cart.removeIf(l -> l.getItemId().equals(itemId));
        session.setAttribute(CART_ATTR, cart);
    }

    @Override
    public void clearCart(HttpSession session) {
        session.removeAttribute(CART_ATTR);
    }
}
