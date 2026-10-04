package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.AccountService;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/accounts") @RequiredArgsConstructor
public class AccountController {
    private final AccountService service;
    @GetMapping public PageResult<AccountView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.list(page,size); }
    @GetMapping("/{id}") public AccountView get(@PathVariable Integer id) { return service.get(id); }
    @PostMapping("/apply") public AccountView apply(@RequestBody @jakarta.validation.Valid AccountApplication req) { return service.apply(req); }
    @PostMapping("/{id}/primary") public AccountView setPrimary(@PathVariable Integer id) { return service.setPrimaryAccount(id); }
}
