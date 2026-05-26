package iuh.fit.se.backend.model.converter;

import iuh.fit.se.backend.model.PaymentStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus, String> {

    @Override
    public String convertToDatabaseColumn(PaymentStatus attribute) {
        return attribute != null ? attribute.name() : PaymentStatus.PENDING.name();
    }

    @Override
    public PaymentStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return PaymentStatus.PENDING;
        }

        try {
            return PaymentStatus.valueOf(dbData.trim());
        } catch (IllegalArgumentException ex) {
            return PaymentStatus.PENDING;
        }
    }
}
