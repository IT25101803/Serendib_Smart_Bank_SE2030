package com.smartbank.smartbank_api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.concurrent.*;

@Service
@Slf4j
public class MailJetEmailService {
    private static final String MAILJET_SEND_URL = "https://api.mailjet.com/v3.1/send";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final String apiKey;
    private final String secretKey;
    private final String fromEmail;
    private final String fromName;
    private final Clock clock;
    private final HttpClient httpClient;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public MailJetEmailService(
            @Value("${mailjet.api-key:3e8dca622958dead6038bdb663ddf374}") String apiKey,
            @Value("${mailjet.secret-key:4fea9c5c1f27bcb4854bb41616675702}") String secretKey,
            @Value("${mailjet.from-email:wijerathna.dev.2004@gmail.com}") String fromEmail,
            @Value("${mailjet.from-name:Serendib Smart Bank}") String fromName,
            Clock clock) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.secretKey = secretKey != null ? secretKey.trim() : "";
        this.fromEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "wijerathna.dev.2004@gmail.com";
        this.fromName = fromName != null ? fromName.trim() : "Serendib Smart Bank";
        this.clock = clock;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void sendLoginNotification(String recipientEmail, String username, String ipAddress) {
        if (!isValidEmail(recipientEmail)) return;
        String timeStr = LocalDateTime.now(clock).format(FORMATTER);
        String subject = "Security Alert: Successful Sign-In to Serendib Smart Bank";
        String ipInfo = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "Unknown IP";
        
        String textPart = String.format(
            "Dear %s,\n\nYour Serendib Smart Bank account was accessed on %s (IP: %s).\n\nIf you did not perform this login, please contact customer support immediately.\n\nSerendib Smart Bank Security Team",
            username, timeStr, ipInfo
        );

        String htmlPart = String.format(
            "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #10B981;border-radius:12px;background:#0A192F;color:#ffffff;\">" +
            "<h2 style=\"color:#10B981;margin-top:0;\">Serendib Smart Bank</h2>" +
            "<h3 style=\"color:#ffffff;\">Security Alert: Successful Sign-In</h3>" +
            "<p>Dear <strong>%s</strong>,</p>" +
            "<p>We detected a successful sign-in to your account with the following details:</p>" +
            "<ul style=\"line-height:1.8;color:#e2e8f0;\">" +
            "<li><strong>Time:</strong> %s</li>" +
            "<li><strong>IP Address:</strong> %s</li>" +
            "<li><strong>Account:</strong> %s</li>" +
            "</ul>" +
            "<p style=\"color:#94a3b8;font-size:13px;\">If this was you, you can safely ignore this email. If you did not sign in, please secure your account immediately.</p>" +
            "<hr style=\"border:0;border-top:1px solid #10B981;margin:20px 0;\">" +
            "<small style=\"color:#64748b;\">Serendib Smart Bank &copy; 2026. Academic Simulation.</small>" +
            "</div>",
            escapeHtml(username), timeStr, escapeHtml(ipInfo), escapeHtml(username)
        );

        dispatchAsync(recipientEmail.trim(), username, subject, textPart, htmlPart);
    }

    public void sendLogoutNotification(String recipientEmail, String username) {
        if (!isValidEmail(recipientEmail)) return;
        String timeStr = LocalDateTime.now(clock).format(FORMATTER);
        String subject = "Security Notification: Signed Out of Serendib Smart Bank";

        String textPart = String.format(
            "Dear %s,\n\nYou have successfully signed out of your Serendib Smart Bank account on %s.\n\nThank you for banking with Serendib Smart Bank.\n\nSerendib Smart Bank Security Team",
            username, timeStr
        );

        String htmlPart = String.format(
            "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #10B981;border-radius:12px;background:#0A192F;color:#ffffff;\">" +
            "<h2 style=\"color:#10B981;margin-top:0;\">Serendib Smart Bank</h2>" +
            "<h3 style=\"color:#ffffff;\">Security Notification: Signed Out</h3>" +
            "<p>Dear <strong>%s</strong>,</p>" +
            "<p>You have signed out of your session on <strong>%s</strong>.</p>" +
            "<p style=\"color:#94a3b8;font-size:13px;\">If you did not initiate this sign-out, please sign in to check your account activity.</p>" +
            "<hr style=\"border:0;border-top:1px solid #10B981;margin:20px 0;\">" +
            "<small style=\"color:#64748b;\">Serendib Smart Bank &copy; 2026. Academic Simulation.</small>" +
            "</div>",
            escapeHtml(username), timeStr
        );

        dispatchAsync(recipientEmail.trim(), username, subject, textPart, htmlPart);
    }

    public void sendOtpNotification(String recipientEmail, String username, String transactionType, String amount, String otpCode) {
        if (!isValidEmail(recipientEmail)) return;
        String timeStr = LocalDateTime.now(clock).format(FORMATTER);
        String typeLabel = transactionType != null ? transactionType : "Transaction";
        String amtLabel = amount != null ? amount : "0.00";
        String subject = "Serendib Smart Bank: Verification Code (OTP) for " + typeLabel;
        
        String textPart = String.format(
            "Dear %s,\n\nYour One-Time Password (OTP) for %s (Amount: LKR %s) is: %s\n\nThis OTP is valid for 3 minutes. Never share this OTP with anyone.\n\nSerendib Smart Bank Security Team",
            username, typeLabel, amtLabel, otpCode
        );

        String htmlPart = String.format(
            "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #10B981;border-radius:12px;background:#0A192F;color:#ffffff;\">" +
            "<h2 style=\"color:#10B981;margin-top:0;\">Serendib Smart Bank</h2>" +
            "<h3 style=\"color:#ffffff;\">Transaction Verification Code (OTP)</h3>" +
            "<p>Dear <strong>%s</strong>,</p>" +
            "<p>You initiated a <strong>%s</strong> for <strong>LKR %s</strong> on %s.</p>" +
            "<div style=\"background:#10B981;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;padding:16px;border-radius:8px;margin:20px 0;\">%s</div>" +
            "<p style=\"color:#f59e0b;font-weight:600;\">⚠️ This code is valid for 3 minutes. Do NOT disclose this OTP to anyone.</p>" +
            "<hr style=\"border:0;border-top:1px solid #10B981;margin:20px 0;\">" +
            "<small style=\"color:#64748b;\">Serendib Smart Bank &copy; 2026. Academic Simulation.</small>" +
            "</div>",
            escapeHtml(username), escapeHtml(typeLabel), escapeHtml(amtLabel), timeStr, escapeHtml(otpCode)
        );

        dispatchAsync(recipientEmail.trim(), username, subject, textPart, htmlPart);
    }

    public void sendNotificationEmail(String recipientEmail, String username, String title, String message) {
        if (!isValidEmail(recipientEmail)) return;
        String timeStr = LocalDateTime.now(clock).format(FORMATTER);
        String subject = "Serendib Notification: " + (title != null ? title : "Account Alert");

        String textPart = String.format(
            "Dear %s,\n\n%s\n\n%s\n\nDate: %s\n\nSerendib Smart Bank Notification Team",
            username, title != null ? title : "Notification", message != null ? message : "", timeStr
        );

        String htmlPart = String.format(
            "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #3B82F6;border-radius:12px;background:#0A192F;color:#ffffff;\">" +
            "<h2 style=\"color:#3B82F6;margin-top:0;\">Serendib Smart Bank</h2>" +
            "<h3 style=\"color:#ffffff;\">%s</h3>" +
            "<p>Dear <strong>%s</strong>,</p>" +
            "<p style=\"font-size:15px;line-height:1.6;color:#e2e8f0;\">%s</p>" +
            "<p style=\"color:#94a3b8;font-size:12px;margin-top:16px;\">Received at: %s</p>" +
            "<hr style=\"border:0;border-top:1px solid #3B82F6;margin:20px 0;\">" +
            "<small style=\"color:#64748b;\">Serendib Smart Bank &copy; 2026. Online Banking Notification System.</small>" +
            "</div>",
            escapeHtml(title), escapeHtml(username), escapeHtml(message), timeStr
        );

        dispatchAsync(recipientEmail.trim(), username, subject, textPart, htmlPart);
    }

    private void dispatchAsync(String recipientEmail, String recipientName, String subject, String textPart, String htmlPart) {
        log.info("Sending Email to [{}] | Subject: {}", recipientEmail, subject);
        CompletableFuture.runAsync(() -> {
            try {
                if (apiKey.isBlank()) {
                    log.info("MailJet API key is blank. Logging email locally for {}:\n{}", recipientEmail, textPart);
                    return;
                }
                sendMailJetRequest(recipientEmail, recipientName, subject, textPart, htmlPart);
            } catch (Exception e) {
                log.error("Failed to dispatch email via MailJet API to {}: {}. Outputting to server logs as fallback:\n{}", recipientEmail, e.getMessage(), textPart);
            }
        }, executor);
    }

    protected void sendMailJetRequest(String recipientEmail, String recipientName, String subject, String textPart, String htmlPart) throws Exception {
        String authHeader;
        if (!secretKey.isBlank()) {
            String credentials = apiKey + ":" + secretKey;
            authHeader = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        } else {
            String credentials = apiKey + ":";
            authHeader = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        }

        String jsonPayload = "{\"Messages\":[{\"From\":{\"Email\":\"" + escapeJson(fromEmail) + "\",\"Name\":\"" + escapeJson(fromName) + "\"}," +
                "\"To\":[{\"Email\":\"" + escapeJson(recipientEmail) + "\",\"Name\":\"" + escapeJson(recipientName != null ? recipientName : recipientEmail) + "\"}]," +
                "\"Subject\":\"" + escapeJson(subject) + "\"," +
                "\"TextPart\":\"" + escapeJson(textPart) + "\"," +
                "\"HTMLPart\":\"" + escapeJson(htmlPart) + "\"}]}";

        HttpRequest request = HttpRequest.newBuilder(URI.create(MAILJET_SEND_URL))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("Authorization", authHeader)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("MailJet email notification delivered successfully to {}", recipientEmail);
        } else {
            log.warn("MailJet API responded with status {}: {}. Logging email content locally for user:\n{}", response.statusCode(), response.body(), textPart);
        }
    }

    private boolean isValidEmail(String email) {
        if (email == null) return false;
        String trimmed = email.trim();
        return trimmed.contains("@") && trimmed.indexOf('@') > 0 && trimmed.indexOf('@') < trimmed.length() - 1;
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
