package iuh.fit.se.backend.service;

import java.time.Duration;
import java.util.Optional;

public interface InventoryLockService {
    Optional<LockHandle> tryAcquire(Long variantId, Duration ttl);

    LockHandle acquireOrThrow(Long variantId, Duration ttl);

    boolean release(LockHandle handle);

    record LockHandle(Long variantId, String key, String token) {
    }
}
