package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.model.Address;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;
    private final UserRepository userRepository;

    @GetMapping
    public List<Address> getAddresses(@AuthenticationPrincipal Jwt jwt) {
        User user = userRepository.findByEmail(jwt.getSubject()).orElseThrow();
        return addressService.getUserAddresses(user);
    }

    @PostMapping
    public Address createAddress(@AuthenticationPrincipal User user,
                                 @RequestBody Address address) {
        return addressService.createAddress(user, address);
    }

    @PutMapping("/{id}")
    public Address updateAddress(@PathVariable Long id,
                                 @AuthenticationPrincipal  User user,
                                 @RequestBody Address address) {
        return addressService.updateAddress(id, user, address);
    }

    @DeleteMapping("/{id}")
    public void deleteAddress(@PathVariable Long id,
                              @AuthenticationPrincipal  User user) {
        addressService.deleteAddress(id, user);
    }
}
