package iuh.fit.se.backend.model.converter;

import iuh.fit.se.backend.model.PaymentMethod;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PaymentMethodConverter implements AttributeConverter<PaymentMethod, String> {

    @Override
    public String convertToDatabaseColumn(PaymentMethod attribute) {
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public PaymentMethod convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }

        try {
            return PaymentMethod.valueOf(dbData.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
