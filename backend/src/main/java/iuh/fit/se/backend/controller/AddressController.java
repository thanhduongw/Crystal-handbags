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

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;
    private final UserRepository userRepository;

    @GetMapping
    public List<AddressDto> getAddresses(@AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Missing or invalid JWT"
            );
        }

        User user = userRepository
                .findByEmail(jwt.getSubject())
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")
                );

        return addressService.getUserAddresses(user);
    }


    @PostMapping
    public AddressDto createAddress(@AuthenticationPrincipal Jwt jwt,
                                 @RequestBody Address address) {
        User user = userRepository.findByEmail(jwt.getSubject()).orElseThrow();
        return addressService.createAddress(user, address);
    }

    @PutMapping("/{id}")
    public AddressDto updateAddress(@PathVariable Long id,
                                 @AuthenticationPrincipal  Jwt jwt,
                                 @RequestBody Address address) {
        User user = userRepository.findByEmail(jwt.getSubject()).orElseThrow();
        return addressService.updateAddress(id, user, address);
    }

    @DeleteMapping("/{id}")
    public void deleteAddress(@PathVariable Long id,
                              @AuthenticationPrincipal  Jwt jwt) {
        User user = userRepository.findByEmail(jwt.getSubject()).orElseThrow();
        addressService.deleteAddress(id, user);
    }

    @PutMapping("/{id}/default")
    public AddressDto setDefaultAddress(@PathVariable Long id,
                                        @AuthenticationPrincipal Jwt jwt) {
        User user = userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return addressService.setDefaultAddress(id, user);
    }

}
