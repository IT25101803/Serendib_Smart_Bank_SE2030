package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
@RestController @RequestMapping("/api/transactions") @RequiredArgsConstructor
public class TransactionController {
    private final TransactionService service;
    @GetMapping public PageResult<TransactionView> list(@RequestParam(required=false) String type,@RequestParam(required=false) String status,
        @RequestParam(required=false) LocalDate from,@RequestParam(required=false) LocalDate to,@RequestParam(required=false) String search,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.list(type,status,from,to,search,page,size); }
    @GetMapping("/{id}") public TransactionView get(@PathVariable Integer id) { return service.get(id); }
    @GetMapping("/{id}/receipt") public TransactionView receipt(@PathVariable Integer id) { var t=service.get(id); BankRules.require("COMPLETED".equals(t.status()),"INVALID_STATE","Receipt is available after completion"); return t; }
}
