package iuh.fit.se.backend.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String scope = jwt.getClaimAsString("scope");

        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority(scope) // ROLE_ADMIN
        );

        return new JwtAuthenticationToken(jwt, authorities);
    }
}
