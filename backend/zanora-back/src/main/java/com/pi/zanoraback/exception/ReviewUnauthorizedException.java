package com.pi.zanoraback.exception;

public class ReviewUnauthorizedException extends RuntimeException {
    public ReviewUnauthorizedException(String message) {
        super(message);
    }
}