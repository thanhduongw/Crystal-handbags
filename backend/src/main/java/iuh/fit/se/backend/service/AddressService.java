package iuh.fit.se.backend.service;

import iuh.fit.se.backend.model.Address;
import iuh.fit.se.backend.model.User;

import java.util.List;

public interface AddressService {
    List<Address> getUserAddresses(User user);
    Address createAddress(User user, Address address);
    Address updateAddress(Long id, User user, Address address);
    void deleteAddress(Long id, User user);
}
