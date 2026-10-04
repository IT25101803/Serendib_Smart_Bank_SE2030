package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.BillPaymentService;
import com.smartbank.smartbank_api.dto.BankRequests.Bill;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/bill-payments") @RequiredArgsConstructor
public class BillPaymentController {
    private final BillPaymentService service;
    @GetMapping public PageResult<BillView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.list(page,size); }
    @GetMapping("/{id}") public BillView get(@PathVariable Integer id) { return service.get(id); }
    @PostMapping public BillView create(@Valid @RequestBody Bill request,@RequestHeader("Idempotency-Key") String key) { return service.initiate(request,key); }
}
