package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employee/accounts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
public class EmployeeAccountController {
    private final AccountService service;

    @GetMapping("/pending")
    public PageResult<AccountView> listPending(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.listPendingEmployee(page, size);
    }

    @PostMapping("/open")
    public AccountView createDirectly(@RequestBody @Valid EmployeeDirectAccount req) {
        return service.employeeCreate(req);
    }

    @PostMapping("/{id}/approve")
    public AccountView approve(@PathVariable Integer id, @RequestBody(required = false) AccountApprovalRequest req) {
        java.math.BigDecimal initialDeposit = req != null ? req.initialDeposit() : null;
        return service.approve(id, initialDeposit);
    }


    @PostMapping("/{id}/reject")
    public AccountView reject(@PathVariable Integer id, @RequestBody Decision req) {
        return service.reject(id, req.reason());
    }

    @PostMapping("/deposit")
    public TransactionView depositCash(@RequestBody @Valid DirectDeposit req) {
        return service.depositCash(req);
    }
}