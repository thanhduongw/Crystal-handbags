package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.AddressDto;
import iuh.fit.se.backend.model.Address;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;
    private final UserRepository userRepository;

    @GetMapping
    public List<AddressDto> getAddresses(@AuthenticationPrincipal Jwt jwt) {
        return addressService.getUserAddresses(requireUser(jwt));
    }

    @PostMapping
    public AddressDto createAddress(@AuthenticationPrincipal Jwt jwt,
            @RequestBody Address address) {
        return addressService.createAddress(requireUser(jwt), address);
    }

    @PutMapping("/{id}")
    public AddressDto updateAddress(@PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Address address) {
        return addressService.updateAddress(id, requireUser(jwt), address);
    }

    @DeleteMapping("/{id}")
    public void deleteAddress(@PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        addressService.deleteAddress(id, requireUser(jwt));
    }

    @PutMapping("/{id}/default")
    public AddressDto setDefaultAddress(@PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return addressService.setDefaultAddress(id, requireUser(jwt));
    }

    private User requireUser(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid JWT");
        }

        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

}
