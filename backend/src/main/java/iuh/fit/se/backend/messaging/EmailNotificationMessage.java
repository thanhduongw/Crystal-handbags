package iuh.fit.se.backend.messaging;

import lombok.*;

import java.io.Serializable;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailNotificationMessage implements Serializable {
    private String to;
    private String subject;
    private String text;
    private String template;
    private Map<String, Object> data;
}
