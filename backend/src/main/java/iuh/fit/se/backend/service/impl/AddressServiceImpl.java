package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.model.Address;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.AddressRepository;
import iuh.fit.se.backend.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;

    @Override
    public List<Address> getUserAddresses(User user) {
        return addressRepository.findByUser(user);
    }

    @Override
    public Address createAddress(User user, Address address) {
        address.setAddressId(null);
        address.setUser(user);

        if (Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.clearDefaultAddress(user.getUserId());
        }

        return addressRepository.save(address);
    }

    @Override
    public Address updateAddress(Long id, User user, Address address) {
        Address existing = addressRepository.findById(id)
                .filter(a -> a.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new RuntimeException("Address not found"));

        existing.setFullName(address.getFullName());
        existing.setPhoneNumber(address.getPhoneNumber());
        existing.setStreet(address.getStreet());
        existing.setWard(address.getWard());
        existing.setDistrict(address.getDistrict());
        existing.setProvince(address.getProvince());

        if (Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.clearDefaultAddress(user.getUserId());
            existing.setIsDefault(true);
        }

        return addressRepository.save(existing);
    }

    @Override
    public void deleteAddress(Long id, User user) {
        Address address = addressRepository.findById(id)
                .filter(a -> a.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new RuntimeException("Address not found"));

        addressRepository.delete(address);
    }
}
