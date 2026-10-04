package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.dto.BankRequests.Decision;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/accounts")
@RequiredArgsConstructor
public class ManagerAccountController {
    private final AccountService service;

    @GetMapping("/pending")
    public PageResult<AccountView> listPending(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return service.listPendingManager(page, size);
    }

    @PostMapping("/open")
    public AccountView createDirectly(@jakarta.validation.Valid @RequestBody com.smartbank.smartbank_api.dto.BankRequests.EmployeeDirectAccount req) {
        return service.employeeCreate(req);
    }

    @PostMapping("/{id}/approve")
    public AccountView approve(@PathVariable Integer id, @RequestBody(required = false) com.smartbank.smartbank_api.dto.BankRequests.AccountApprovalRequest req) {
        java.math.BigDecimal initialDeposit = req != null ? req.initialDeposit() : null;
        return service.approve(id, initialDeposit);
    }


    @PostMapping("/{id}/reject")
    public AccountView reject(@PathVariable Integer id, @RequestBody Decision req) {
        return service.reject(id, req.reason());
    }
}
