package com.smartbank.smartbank_api.config;

import com.smartbank.smartbank_api.entity.Role;
import com.smartbank.smartbank_api.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/** Ensures core system roles always exist upon application startup. */
@Component
@Order(1)
@RequiredArgsConstructor
public class RoleInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;

    private static final Map<String, String> DEFAULT_ROLES = Map.of(
            "Admin", "System administration and audit",
            "Customer", "Customer banking",
            "Manager", "Final loan and product approval",
            "Employee", "Customer service and loan review"
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (Map.Entry<String, String> entry : DEFAULT_ROLES.entrySet()) {
            if (roleRepository.findByRoleNameIgnoreCase(entry.getKey()).isEmpty()) {
                Role role = new Role();
                role.setRoleName(entry.getKey());
                role.setDescription(entry.getValue());
                roleRepository.save(role);
            }
        }
    }
}
