package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.AddressDto;
import iuh.fit.se.backend.model.Address;
import iuh.fit.se.backend.model.User;

import java.util.List;

public interface AddressService {
    List<AddressDto> getUserAddresses(User user);
    AddressDto createAddress(User user, Address address);
    AddressDto updateAddress(Long id, User user, Address address);
    void deleteAddress(Long id, User user);
    AddressDto setDefaultAddress(Long id, User user);
}
