package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.OtpToken;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpRepository extends CrudRepository<OtpToken, String> {
}
