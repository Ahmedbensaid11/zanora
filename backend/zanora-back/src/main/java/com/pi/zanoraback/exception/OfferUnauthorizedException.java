package com.pi.zanoraback.exception;

public class OfferUnauthorizedException extends RuntimeException {
    public OfferUnauthorizedException(String message) {
        super(message);
    }
}