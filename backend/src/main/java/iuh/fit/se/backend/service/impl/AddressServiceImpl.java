package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.AddressDto;
import iuh.fit.se.backend.model.Address;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.AddressRepository;
import iuh.fit.se.backend.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;

    @Override
    public List<AddressDto> getUserAddresses(User user) {
        return addressRepository.findByUser(user)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public AddressDto createAddress(User user, Address address) {
        address.setAddressId(null);
        address.setUser(user);

        if (Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.clearDefaultAddress(user.getUserId());
        }

        Address saved = addressRepository.save(address);
        return toDto(saved);
    }

    @Override
    public AddressDto updateAddress(Long id, User user, Address address) {
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

        Address updated = addressRepository.save(existing);
        return toDto(updated);
    }

    @Override
    public void deleteAddress(Long id, User user) {
        Address address = addressRepository.findById(id)
                .filter(a -> a.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new RuntimeException("Address not found"));

        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public AddressDto setDefaultAddress(Long addressId, User user) {
        Address address = addressRepository.findById(addressId)
                .filter(a -> a.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // 1. Bỏ mặc định tất cả địa chỉ khác
        addressRepository.clearDefaultAddress(user.getUserId());

        // 2. Set địa chỉ này thành default
        address.setIsDefault(true);
        Address saved = addressRepository.save(address);

        return toDto(saved);
    }


    private AddressDto toDto(Address address) {
        return AddressDto.builder()
                .addressId(address.getAddressId())
                .fullName(address.getFullName())
                .phoneNumber(address.getPhoneNumber())
                .street(address.getStreet())
                .ward(address.getWard())
                .district(address.getDistrict())
                .province(address.getProvince())
                .isDefault(address.getIsDefault())
                .build();
    }
}
