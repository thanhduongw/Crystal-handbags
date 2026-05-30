package iuh.fit.se.backend.exception;

public class InventoryLockException extends RuntimeException {
    public InventoryLockException(String message) {
        super(message);
    }
}
