package com.ordercraft.exception;

public class InsufficientStockException extends BusinessException {
    public InsufficientStockException(String materialName, Object required, Object available) {
        super(String.format("Insufficient stock for '%s'. Required: %s, Available: %s", materialName, required, available));
    }

    public InsufficientStockException(String message) {
        super(message);
    }
}
