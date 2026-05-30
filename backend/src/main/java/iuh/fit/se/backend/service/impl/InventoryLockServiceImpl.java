package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.constants.RedisKeyConstants;
import iuh.fit.se.backend.exception.InventoryLockException;
import iuh.fit.se.backend.service.InventoryLockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryLockServiceImpl implements InventoryLockService {

    private static final DefaultRedisScript<Long> RELEASE_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then "
                    + "return redis.call('del', KEYS[1]) "
                    + "else return 0 end",
            Long.class);

    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public Optional<LockHandle> tryAcquire(Long variantId, Duration ttl) {
        String key = RedisKeyConstants.inventoryLockKey(variantId);
        String token = UUID.randomUUID().toString();

        Boolean locked = stringRedisTemplate.opsForValue().setIfAbsent(key, token, ttl);
        if (Boolean.TRUE.equals(locked)) {
            return Optional.of(new LockHandle(variantId, key, token));
        }
        return Optional.empty();
    }

    @Override
    public LockHandle acquireOrThrow(Long variantId, Duration ttl) {
        return tryAcquire(variantId, ttl)
                .orElseThrow(() -> new InventoryLockException(
                        "Inventory is busy for variant " + variantId + ". Please try again."));
    }

    @Override
    public boolean release(LockHandle handle) {
        if (handle == null) {
            return false;
        }
        Long released = stringRedisTemplate.execute(
                RELEASE_SCRIPT,
                List.of(handle.key()),
                handle.token());
        boolean success = Long.valueOf(1).equals(released);
        if (!success) {
            log.warn("Skipped releasing inventory lock {} because token did not match", handle.key());
        }
        return success;
    }
}
