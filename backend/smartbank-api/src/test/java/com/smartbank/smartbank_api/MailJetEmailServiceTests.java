package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.service.MailJetEmailService;
import org.junit.jupiter.api.Test;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import static org.junit.jupiter.api.Assertions.*;

class MailJetEmailServiceTests {
    private final Clock fixedClock = Clock.fixed(Instant.parse("2026-10-03T10:15:30Z"), ZoneId.of("Asia/Colombo"));

    @Test
    void serviceConstructsAndHandlesBlankKeyGracefully() {
        var service = new MailJetEmailService("", "", "noreply@smartbank.lk", "Serendib Smart Bank", fixedClock);
        assertDoesNotThrow(() -> service.sendLoginNotification("customer@test.com", "john_customer", "127.0.0.1"));
        assertDoesNotThrow(() -> service.sendLogoutNotification("customer@test.com", "john_customer"));
    }

    @Test
    void serviceIgnoresInvalidEmailsWithoutThrowing() {
        var service = new MailJetEmailService("3e8dca622958dead6038bdb663ddf374", "", "noreply@smartbank.lk", "Serendib Smart Bank", fixedClock);
        assertDoesNotThrow(() -> service.sendLoginNotification(null, "john_customer", "127.0.0.1"));
        assertDoesNotThrow(() -> service.sendLoginNotification("notanemail", "john_customer", "127.0.0.1"));
        assertDoesNotThrow(() -> service.sendLogoutNotification("", "john_customer"));
    }

    @Test
    void serviceAcceptsValidEmailParameters() {
        var service = new MailJetEmailService("3e8dca622958dead6038bdb663ddf374", "secret", "noreply@smartbank.lk", "Serendib Smart Bank", fixedClock);
        assertDoesNotThrow(() -> service.sendLoginNotification("customer@test.com", "john_customer", "192.168.1.1"));
        assertDoesNotThrow(() -> service.sendLogoutNotification("customer@test.com", "john_customer"));
    }
}
