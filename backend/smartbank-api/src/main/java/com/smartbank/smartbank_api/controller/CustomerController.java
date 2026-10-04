package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final UserService service;

    @GetMapping("/me")
    public ProfileView get() {
        return service.profile();
    }

    @PatchMapping("/me")
    public ProfileView update(@Valid @RequestBody Profile r) {
        return service.updateProfile(r);
    }

    @PatchMapping("/me/profile-image")
    public ProfileView updateProfileImage(@RequestBody Map<String, String> body) {
        String url = body != null ? body.get("profileImage") : null;
        return service.updateProfileImage(url);
    }

    @DeleteMapping("/me/profile-image")
    public ProfileView deleteProfileImage() {
        return service.updateProfileImage(null);
    }
}
