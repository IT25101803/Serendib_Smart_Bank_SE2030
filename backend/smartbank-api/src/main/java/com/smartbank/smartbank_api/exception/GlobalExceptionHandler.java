package com.smartbank.smartbank_api.exception;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import java.time.Instant;
import java.util.*;
@RestControllerAdvice
public class GlobalExceptionHandler {
    public record ApiError(String code,String message,Map<String,String> fieldErrors,Instant timestamp) {}
    private ResponseEntity<ApiError> error(HttpStatus status,String code,String message) {return ResponseEntity.status(status).body(new ApiError(code,message,Map.of(),Instant.now()));}
    @ExceptionHandler(MethodArgumentNotValidException.class) public ResponseEntity<ApiError> validation(MethodArgumentNotValidException e) {
        Map<String,String> fields=new LinkedHashMap<>();e.getBindingResult().getFieldErrors().forEach(f->fields.putIfAbsent(f.getField(),f.getDefaultMessage()));return ResponseEntity.badRequest().body(new ApiError("VALIDATION_FAILED","Please correct the highlighted fields",fields,Instant.now()));
    }
    @ExceptionHandler(BusinessRuleException.class) public ResponseEntity<ApiError> business(BusinessRuleException e) {return error("RATE_LIMITED".equals(e.getCode())?HttpStatus.TOO_MANY_REQUESTS:HttpStatus.CONFLICT,e.getCode(),e.getMessage());}
    @ExceptionHandler(ResourceNotFoundException.class) public ResponseEntity<ApiError> missing(ResourceNotFoundException e) {return error(HttpStatus.NOT_FOUND,"NOT_FOUND","Resource not found");}
    @ExceptionHandler(BadCredentialsException.class) public ResponseEntity<ApiError> credentials(BadCredentialsException e) {return error(HttpStatus.UNAUTHORIZED,"UNAUTHENTICATED",e.getMessage());}
    @ExceptionHandler(AccessDeniedException.class) public ResponseEntity<ApiError> denied(AccessDeniedException e) {return error(HttpStatus.FORBIDDEN,"FORBIDDEN","Your role cannot perform this operation");}
    @ExceptionHandler(DataIntegrityViolationException.class) public ResponseEntity<ApiError> duplicate(DataIntegrityViolationException e) {return error(HttpStatus.CONFLICT,"DATA_CONFLICT","The request conflicts with existing data. Refresh before retrying; reuse the same request key for a financial retry.");}
    @ExceptionHandler({OptimisticLockingFailureException.class,PessimisticLockingFailureException.class}) public ResponseEntity<ApiError> concurrent(Exception e) {return error(HttpStatus.CONFLICT,"CONCURRENT_CHANGE","The record changed concurrently. Refresh and retry with the same request key.");}
    @ExceptionHandler({IllegalArgumentException.class,MethodArgumentTypeMismatchException.class,HttpMessageNotReadableException.class,MissingRequestHeaderException.class}) public ResponseEntity<ApiError> invalid(Exception e) {return error(HttpStatus.BAD_REQUEST,"INVALID_REQUEST","Request values or required headers are invalid");}
    @ExceptionHandler(NoResourceFoundException.class) public ResponseEntity<ApiError> route(Exception e) {return error(HttpStatus.NOT_FOUND,"NOT_FOUND","Endpoint not found");}
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class) public ResponseEntity<ApiError> method(Exception e) {return error(HttpStatus.METHOD_NOT_ALLOWED,"METHOD_NOT_ALLOWED","This operation is not supported");}
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class) public ResponseEntity<ApiError> upstream(org.springframework.web.server.ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(new ApiError("SERVICE_UNAVAILABLE","Exchange rates are temporarily unavailable",Map.of(),Instant.now()));
    }
    @ExceptionHandler(Exception.class) public ResponseEntity<ApiError> unexpected(Exception e) {
        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class).error("Unhandled request failure type: {}",e.getClass().getSimpleName());return error(HttpStatus.INTERNAL_SERVER_ERROR,"INTERNAL_ERROR","The operation could not be completed. Please try again later.");
    }
}
