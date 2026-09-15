package com.voxnote.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAllExceptions(Exception ex) {
        // Print the full stack trace to the Java IDE console for debugging
        ex.printStackTrace(); 
        
        // Send the exact error message string back to React
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Backend Crash Details: " + ex.getMessage());
    }
}
