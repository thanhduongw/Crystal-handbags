package iuh.fit.se.backend.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String scope = jwt.getClaimAsString("scope");

        List<SimpleGrantedAuthority> authorities = scope == null || scope.isBlank()
                ? List.of()
                : Arrays.stream(scope.split("\\s+"))
                        .filter(value -> !value.isBlank())
                        .map(SimpleGrantedAuthority::new)
                        .toList();

        return new JwtAuthenticationToken(jwt, authorities);
    }
}
