package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.exception.BusinessRuleException;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class LoanService {
    private final LoanRepository loans;
    private final CustomerRepository customers;
    private final UserRepository users;
    private final RoleRepository roles;
    private final LoanDecisionRepository decisions;
    private final AccountRepository accounts;
    private final FixedDepositRepository deposits;
    private final TransactionRecordRepository records;
    private final PasswordEncoder passwordEncoder;
    private final NumberingService numbering;
    private final CurrentUserService current;
    private final NotificationService notifications;
    private final AuditLogService audit;
    private final Clock clock;

    public LoanView view(Loan l) {
        String customerName = l.getCustomer() != null && l.getCustomer().getUser() != null ? l.getCustomer().getUser().getUsername() : "Customer";
        String customerNic = l.getCustomer() != null ? l.getCustomer().getNic() : null;
        String cifNumber = null;
        if (l.getCustomer() != null) {
            cifNumber = l.getCustomer().getCifNumber();
            if (cifNumber == null && l.getCustomer().getCustomerId() != null) {
                cifNumber = String.format("%07d", l.getCustomer().getCustomerId() - 1);
            }
        }
        String officerId = l.getApprovedByOfficer() != null ? l.getApprovedByOfficer().getUsername() : null;
        String managerId = l.getApprovedByManager() != null ? l.getApprovedByManager().getUsername() : null;

        BigDecimal totalAmount = l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO;
        BigDecimal paid = l.getPaidAmount() != null ? l.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal rem = totalAmount.subtract(paid);
        if (rem.compareTo(BigDecimal.ZERO) < 0) rem = BigDecimal.ZERO;

        return new LoanView(
            l.getLoanId(),
            l.getLoanNumber() != null ? l.getLoanNumber() : ("LN-" + l.getLoanId()),
            customerName,
            customerNic,
            cifNumber,
            l.getLoanType(),
            BankRules.decimal(l.getAmount()),
            BankRules.decimal(l.getInterestRate()),
            l.getStatus(),
            l.getAdditionalInformation(),
            l.getScrutinyData(),
            l.getApplyDate(),
            decisions.findByLoan_LoanIdOrderByCreatedAtAsc(l.getLoanId()).stream()
                .map(d -> new LoanDecisionView(
                    d.getAction(),
                    d.getReason(),
                    (d.getUser() != null && d.getUser().getRole() != null && d.getUser().getRole().getRoleName() != null)
                        ? d.getUser().getRole().getRoleName()
                        : "Staff",
                    d.getCreatedAt()
                ))
                .toList(),
            officerId,
            managerId,
            l.getTargetAccount() != null ? l.getTargetAccount().getAccountId() : null,
            l.getTargetAccount() != null ? l.getTargetAccount().getAccountNumber() : null,
            l.getFixedDeposit() != null ? l.getFixedDeposit().getFixedDepositId() : null,
            BankRules.decimal(paid),
            BankRules.decimal(rem)
        );
    }

    private Loan locked(Integer id) {
        return loans.lockById(id).orElseThrow(ResourceNotFoundException::new);
    }

    private void own(Loan l) {
        if (!l.getCustomer().getUser().getUserId().equals(current.requireUser().getUserId())) {
            throw new ResourceNotFoundException();
        }
    }

    private void record(Loan l, String action, String reason) {
        LoanDecision d = new LoanDecision();
        d.setLoan(l);
        d.setUser(current.requireUser());
        d.setAction(action);
        d.setReason(reason);
        d.setCreatedAt(LocalDateTime.now(clock));
        decisions.save(d);
        l.setUpdatedAt(LocalDateTime.now(clock));

        audit.record(current.requireUser(), "LOAN_" + action, "Loan", l.getLoanId());
        notifications.createNotification(
            l.getCustomer().getUser().getUserId(),
            "LOAN_STATUS_CHANGED",
            "Loan Application Update",
            "Loan Application #" + (l.getLoanNumber() != null ? l.getLoanNumber() : l.getLoanId()) + " (" + l.getLoanType() + ") status updated to " + l.getStatus() + "."
        );
    }

    public LoanView apply(LoanApplication r) {
        Customer c = current.requireCustomer();

        Account targetAccount = null;
        if (r.accountId() != null && r.accountId() > 0) {
            targetAccount = accounts.findByAccountIdAndCustomer_User_UserId(r.accountId(), c.getUser().getUserId()).orElse(null);
        } else if (r.accountNumber() != null && !r.accountNumber().isBlank()) {
            targetAccount = accounts.findByAccountNumber(r.accountNumber().trim()).orElse(null);
        }
        if (targetAccount == null) {
            List<Account> userAccounts = accounts.findByCustomer_User_UserId(c.getUser().getUserId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
            targetAccount = userAccounts.stream().filter(a -> "ACTIVE".equals(a.getStatus())).findFirst().orElse(null);
        }
        BankRules.require(targetAccount != null && "ACTIVE".equals(targetAccount.getStatus()), "ACCOUNT_REQUIRED", "An active customer account number is required for loan application");

        FixedDeposit fd = null;
        boolean isFdSecured = "FD_SECURED".equalsIgnoreCase(r.loanType()) || "FD Backed Loan".equalsIgnoreCase(r.loanType()) || r.fixedDepositId() != null;
        if (isFdSecured) {
            BankRules.require(r.fixedDepositId() != null, "FD_REQUIRED", "Select an active Fixed Deposit with principal over LKR 1,000,000 as collateral");
            fd = deposits.findById(r.fixedDepositId()).orElseThrow(() -> new BusinessRuleException("FD_NOT_FOUND", "Specified Fixed Deposit not found"));
            BankRules.require(fd.getAccount().getCustomer().getUser().getUserId().equals(c.getUser().getUserId()), "FD_NOT_OWNED", "Fixed deposit does not belong to you");
            BankRules.require("ACTIVE".equals(fd.getStatus()), "FD_INACTIVE", "Fixed deposit must be ACTIVE to be used as collateral");
            BankRules.require(fd.getPrincipalAmount().compareTo(new BigDecimal("1000000.00")) >= 0, "FD_MIN_LIMIT", "Fixed Deposit must be worth over LKR 1,000,000.00 to qualify for an FD-backed loan");

            BigDecimal maxLoan = fd.getPrincipalAmount().divide(new BigDecimal("2"), 2, java.math.RoundingMode.HALF_EVEN);
            BankRules.require(r.amount().compareTo(maxLoan) <= 0, "FD_LOAN_LIMIT", "Loan amount cannot exceed 50% of your Fixed Deposit principal (Maximum: LKR " + maxLoan.toPlainString() + ")");
        }

        Loan l = new Loan();
        l.setCustomer(c);
        l.setTargetAccount(targetAccount);
        l.setFixedDeposit(fd);
        l.setPaidAmount(BigDecimal.ZERO);
        l.setLoanType(r.loanType());
        l.setAmount(BankRules.money(r.amount()));

        BigDecimal rate = switch (r.loanType()) {
            case "FD Backed Loan", "FD_SECURED" -> new BigDecimal("7.50");
            case "Serendib Home Premium Loan", "HOME" -> new BigDecimal("10.25");
            case "Nena Haras Higher Education Loan", "EDUCATION" -> new BigDecimal("9.50");
            case "SpeedDraft Personal Credit Line", "PERSONAL" -> new BigDecimal("12.00");
            case "GreenDrive Hybrid & EV Leasing", "LEASING" -> new BigDecimal("8.75");
            default -> new BigDecimal("10.50");
        };
        l.setInterestRate(rate);
        l.setStatus("SUBMITTED");
        l.setApplyDate(LocalDate.now(clock));
        l.setLoanNumber(numbering.generateLoanNumber(r.loanType()));
        l.setAdditionalInformation(r.information());

        String scrutiny = String.format(
            "{\"salary\":%s,\"allowances\":%s,\"crib\":%s,\"employmentStatus\":\"%s\",\"serviceYears\":%s,\"vehicleCondition\":\"%s\",\"manufactureYear\":%s,\"valuation\":%s,\"chassis\":\"%s\",\"engine\":\"%s\"}",
            r.basicMonthlySalary() != null ? r.basicMonthlySalary().toPlainString() : "0",
            r.fixedAllowances() != null ? r.fixedAllowances().toPlainString() : "0",
            r.existingMonthlyLoanDeductionsCrib() != null ? r.existingMonthlyLoanDeductionsCrib().toPlainString() : "0",
            escapeJson(r.employmentStatus()),
            r.servicePeriodYears() != null ? r.servicePeriodYears() : 0,
            escapeJson(r.vehicleCondition()),
            r.yearOfManufacture() != null ? r.yearOfManufacture() : 0,
            r.vehicleValuationAmount() != null ? r.vehicleValuationAmount().toPlainString() : "0",
            escapeJson(r.chassisNumber()),
            escapeJson(r.engineNumber())
        );
        l.setScrutinyData(scrutiny);
        l.setUpdatedAt(LocalDateTime.now(clock));
        loans.save(l);

        record(l, "SUBMITTED", "Application submitted by customer");
        return view(l);
    }

    public LoanView employeeCreate(EmployeeDirectLoan r) {
        Employee emp = current.requireEmployee();
        User staffUser = emp.getUser();

        if (r.dateOfBirth() != null && r.dateOfBirth().isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException("INVALID_DATE_OF_BIRTH", "Date of birth cannot be in the future");
        }

        Customer c = null;
        if (r.customerUserId() != null && r.customerUserId() > 0) {
            c = customers.findByUser_UserId(r.customerUserId()).orElse(null);
        }

        if (c == null && r.nic() != null && !r.nic().isBlank()) {
            c = customers.findByNicIgnoreCase(r.nic().trim()).orElse(null);
        }

        if (c == null) {
            BankRules.require(r.nic() != null && !r.nic().isBlank(), "NIC_REQUIRED", "NIC number is mandatory for new customer credit facility");

            String normalizedNic = r.nic().trim().toLowerCase(Locale.ROOT);
            String username = "cust_" + normalizedNic.replaceAll("[^a-z0-9]", "");
            if (users.existsByUsername(username)) {
                username = username + "_" + ((int)(Math.random() * 900) + 100);
            }

            String email = (r.email() != null && !r.email().isBlank()) ? r.email().trim().toLowerCase(Locale.ROOT) : (normalizedNic + "@serendibsmartbank.lk");
            if (users.existsByEmail(email)) {
                email = "cust_" + System.currentTimeMillis() + "@serendibsmartbank.lk";
            }

            Role custRole = roles.findByRoleNameIgnoreCase("Customer")
                .orElseGet(() -> {
                    Role r1 = new Role();
                    r1.setRoleName("Customer");
                    r1.setDescription("Customer banking");
                    return roles.save(r1);
                });

            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(email);
            newUser.setPhone(r.phone() != null ? r.phone().trim() : null);
            newUser.setPasswordHash(passwordEncoder.encode("SmartBank!2026"));
            newUser.setRole(custRole);
            newUser.setStatus("ACTIVE");
            newUser.setCreatedAt(LocalDateTime.now(clock));
            users.save(newUser);

            c = new Customer();
            c.setUser(newUser);
            c.setNic(r.nic().trim());
            c.setAddress(r.address() != null ? r.address().trim() : "Colombo, Sri Lanka");
            c.setDateOfBirth(r.dateOfBirth());
            customers.save(c);

            c.setCifNumber(numbering.formatCif(c.getCustomerId()));
            customers.save(c);

            audit.record(staffUser, "NEW_CUSTOMER_PROVISIONED", "Customer", c.getCustomerId());
        }

        Loan l = new Loan();
        l.setCustomer(c);

        if (r.accountId() != null) {
            Account targetAcc = accounts.findById(r.accountId()).orElse(null);
            l.setTargetAccount(targetAcc);
        } else if (r.accountNumber() != null && !r.accountNumber().isBlank()) {
            Account targetAcc = accounts.findByAccountNumber(r.accountNumber().trim()).orElse(null);
            l.setTargetAccount(targetAcc);
        }
        if (l.getTargetAccount() == null) {
            List<Account> userAccounts = accounts.findByCustomer_User_UserId(c.getUser().getUserId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
            l.setTargetAccount(userAccounts.stream().filter(a -> "ACTIVE".equals(a.getStatus())).findFirst().orElse(null));
        }

        l.setPaidAmount(BigDecimal.ZERO);
        l.setLoanType(r.loanType());
        l.setAmount(BankRules.money(r.amount()));

        BigDecimal rate = r.interestRate() != null && r.interestRate().compareTo(BigDecimal.ZERO) > 0 ? r.interestRate() : switch (r.loanType()) {
            case "FD Backed Loan", "FD_SECURED" -> new BigDecimal("7.50");
            case "Serendib Home Premium Loan", "HOME" -> new BigDecimal("10.25");
            case "Nena Haras Higher Education Loan", "EDUCATION" -> new BigDecimal("9.50");
            case "SpeedDraft Personal Credit Line", "PERSONAL" -> new BigDecimal("12.00");
            case "GreenDrive Hybrid & EV Leasing", "LEASING" -> new BigDecimal("8.75");
            default -> new BigDecimal("10.50");
        };
        l.setInterestRate(rate);

        boolean isManager = staffUser.getRole() != null && "Manager".equalsIgnoreCase(staffUser.getRole().getRoleName());
        l.setApprovedByOfficer(staffUser);
        if (isManager) {
            l.setApprovedByManager(staffUser);
            l.setStatus("APPROVED");
        } else {
            l.setStatus("APPROVED");
        }

        l.setApplyDate(LocalDate.now(clock));
        l.setReviewDate(LocalDate.now(clock));
        l.setLoanNumber(numbering.generateLoanNumber(r.loanType()));
        l.setAdditionalInformation(r.information());
        l.setUpdatedAt(LocalDateTime.now(clock));
        loans.save(l);

        disburseLoan(l);
        record(l, "APPROVED_BY_STAFF", "Facility opened on behalf of customer by bank employee");
        return view(l);
    }

    @Transactional(readOnly=true)
    public PageResult<LoanView> ownList(int page, int size) {
        return PageResult.from(loans.findByCustomer_User_UserId(current.requireUser().getUserId(), BankRules.page(page, size, "loanId")).map(this::view));
    }

    @Transactional(readOnly=true)
    public LoanView ownGet(Integer id) {
        Loan l = loans.findByLoanIdAndCustomer_User_UserId(id, current.requireUser().getUserId()).orElseThrow(ResourceNotFoundException::new);
        return view(l);
    }

    @Transactional(readOnly=true)
    public PageResult<LoanView> staffList(String status, int page, int size) {
        var p = BankRules.page(page, size, "loanId");
        return PageResult.from((status == null ? loans.findAll(p) : loans.findByStatus(status, p)).map(this::view));
    }

    @Transactional(readOnly=true)
    public LoanView staffGet(Integer id) {
        return view(loans.findById(id).orElseThrow(ResourceNotFoundException::new));
    }

    public LoanView customerAction(Integer id, String action, Decision r) {
        Loan l = locked(id);
        own(l);
        if ("cancel".equals(action)) {
            BankRules.require(Set.of("SUBMITTED", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "PENDING_MANAGER_REVIEW").contains(l.getStatus()), "INVALID_STATE", "Application cannot be cancelled now");
            l.setStatus("CANCELLED");
            record(l, "CANCELLED", "Cancelled by customer");
        } else {
            BankRules.require("MORE_INFORMATION_REQUIRED".equals(l.getStatus()), "INVALID_STATE", "No additional information was requested");
            l.setAdditionalInformation(Objects.toString(l.getAdditionalInformation(), "") + "\n\nAdditional information (" + LocalDate.now(clock) + "):\n" + r.reason());
            l.setStatus("UNDER_REVIEW");
            record(l, "INFORMATION_RECEIVED", r.reason());
        }
        return view(l);
    }

    public LoanView officerAction(Integer id, String action, Decision r) {
        Loan l = locked(id);
        Employee officer = current.requireEmployee();
        l.setApprovedByOfficer(officer.getUser());
        if ("review".equals(action)) {
            BankRules.require("SUBMITTED".equals(l.getStatus()), "INVALID_STATE", "Only submitted applications can enter review");
            l.setReviewerEmployee(officer);
            l.setStatus("UNDER_REVIEW");
        } else {
            BankRules.require(l.getReviewerEmployee() != null && l.getReviewerEmployee().getEmployeeId().equals(officer.getEmployeeId()), "REVIEWER_REQUIRED", "Only the assigned reviewer may change this application");
            BankRules.require("UNDER_REVIEW".equals(l.getStatus()), "INVALID_STATE", "Application must be under review");
            l.setStatus(switch (action) {
                case "request-information" -> "MORE_INFORMATION_REQUIRED";
                case "recommend" -> "PENDING_MANAGER_REVIEW";
                case "reject" -> "REJECTED";
                default -> throw new IllegalArgumentException("Invalid review action");
            });
        }
        l.setReviewDate(LocalDate.now(clock));
        record(l, action.toUpperCase(Locale.ROOT).replace('-', '_'), r.reason());
        return view(l);
    }

    public LoanView managerAction(Integer id, boolean approve, Decision r) {
        Loan l = locked(id);
        User managerUser = current.requireUser();
        BankRules.require("PENDING_MANAGER_REVIEW".equals(l.getStatus()), "INVALID_STATE", "Application must be recommended before a final decision");
        BankRules.require(l.getReviewerEmployee() == null || !l.getReviewerEmployee().getUser().getUserId().equals(managerUser.getUserId()), "SEPARATION_OF_DUTIES", "A reviewer cannot make the final decision on the same application");
        l.setStatus(approve ? "APPROVED" : "REJECTED");
        if (approve) {
            l.setApprovedByManager(managerUser);
            if (l.getLoanNumber() == null || l.getLoanNumber().isBlank()) {
                l.setLoanNumber(numbering.generateLoanNumber(l.getLoanType()));
            }
            disburseLoan(l);
        }
        record(l, l.getStatus(), r.reason());
        return view(l);
    }

    private void disburseLoan(Loan l) {
        Account target = l.getTargetAccount();
        if (target != null && "ACTIVE".equals(target.getStatus())) {
            BigDecimal amt = l.getAmount();
            target.setBalance(target.getBalance().add(amt));
            accounts.save(target);

            TransactionRecord t = new TransactionRecord();
            t.setToAccount(target);
            t.setInitiatedBy(l.getCustomer().getUser());
            t.setAmount(amt);
            t.setTransactionType("LOAN_DISBURSEMENT");
            t.setStatus("COMPLETED");
            t.setDescription("Loan Disbursement - " + (l.getLoanNumber() != null ? l.getLoanNumber() : l.getLoanId()));
            t.setCreatedAt(LocalDateTime.now(clock));
            t.setCompletedAt(LocalDateTime.now(clock));
            records.save(t);

            audit.record(l.getCustomer().getUser(), "LOAN_DISBURSED", "Account", target.getAccountId());
            notifications.createNotification(
                l.getCustomer().getUser().getUserId(),
                "LOAN_DISBURSED",
                "Loan Approved & Funds Disbursed",
                "Approved loan amount of LKR " + amt.toPlainString() + " has been credited to your account " + target.getAccountNumber() + "."
            );
        }

        if (l.getFixedDeposit() != null) {
            FixedDeposit fd = l.getFixedDeposit();
            fd.setStatus("FROZEN");
            fd.setUpdatedAt(LocalDateTime.now(clock));
            deposits.save(fd);

            notifications.createNotification(
                l.getCustomer().getUser().getUserId(),
                "FD_FROZEN_COLLATERAL",
                "Fixed Deposit Frozen as Collateral",
                "Fixed Deposit #" + fd.getFixedDepositId() + " (LKR " + fd.getPrincipalAmount().toPlainString() + ") has been frozen as collateral for Loan #" + (l.getLoanNumber() != null ? l.getLoanNumber() : l.getLoanId()) + "."
            );
        }
    }

    public LoanView payInstallment(Integer loanId, LoanPaymentRequest r) {
        User user = current.requireUser();
        Loan l = locked(loanId);
        own(l);

        BankRules.require("APPROVED".equals(l.getStatus()), "INVALID_STATE", "Installment payments can only be made on active approved loans");
        BigDecimal payAmount = BankRules.money(r.amount());

        Account acc = accounts.lockById(r.accountId()).orElseThrow(ResourceNotFoundException::new);
        BankRules.require(acc.getCustomer().getUser().getUserId().equals(user.getUserId()), "ACCOUNT_NOT_OWNED", "Specified account does not belong to you");
        BankRules.require("ACTIVE".equals(acc.getStatus()), "INACTIVE_ACCOUNT", "Source account is not active");
        BankRules.require(acc.getBalance().compareTo(payAmount) >= 0, "INSUFFICIENT_BALANCE", "Insufficient balance in account " + acc.getAccountNumber() + " to pay loan installment");

        acc.setBalance(acc.getBalance().subtract(payAmount));
        accounts.save(acc);

        TransactionRecord t = new TransactionRecord();
        t.setFromAccount(acc);
        t.setInitiatedBy(user);
        t.setAmount(payAmount);
        t.setTransactionType("LOAN_PAYMENT");
        t.setStatus("COMPLETED");
        t.setDescription("Loan Installment Payment - " + (l.getLoanNumber() != null ? l.getLoanNumber() : l.getLoanId()));
        t.setCreatedAt(LocalDateTime.now(clock));
        t.setCompletedAt(LocalDateTime.now(clock));
        records.save(t);

        BigDecimal currentPaid = l.getPaidAmount() != null ? l.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal newPaid = currentPaid.add(payAmount);
        l.setPaidAmount(newPaid);
        l.setUpdatedAt(LocalDateTime.now(clock));

        if (newPaid.compareTo(l.getAmount()) >= 0) {
            l.setStatus("PAID_OFF");

            if (l.getFixedDeposit() != null) {
                FixedDeposit fd = l.getFixedDeposit();
                fd.setStatus("ACTIVE");
                fd.setUpdatedAt(LocalDateTime.now(clock));
                deposits.save(fd);

                notifications.createNotification(
                    user.getUserId(),
                    "FD_UNFROZEN",
                    "Fixed Deposit Unfrozen",
                    "Congratulations! Loan #" + (l.getLoanNumber() != null ? l.getLoanNumber() : l.getLoanId()) + " is fully paid off. Collateral Fixed Deposit #" + fd.getFixedDepositId() + " is now unfrozen."
                );
            }
        }

        loans.save(l);
        record(l, "REPAYMENT", "Installment payment of LKR " + payAmount.toPlainString() + " paid from account " + acc.getAccountNumber());
        return view(l);
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
    }
}
