package com.smartbank.smartbank_api.service;

import java.time.*;
import java.util.*;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExchangeRateService {
    public record Rates(String base, Map<String, BigDecimal> rates, Instant updatedAt, boolean stale) {}
    private final String key;
    private final Clock clock;
    private final RestClient client;
    private Rates cached;
    private Instant retryAt = Instant.EPOCH;
    public ExchangeRateService(@Value("${exchange-rate.api-key:}") String key, Clock clock) {
        this.key=key; this.clock=clock;
        var factory=new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); factory.setReadTimeout(5000);
        client=RestClient.builder().requestFactory(factory).build();
    }
    protected Map<String,Object> fetch() {
        return client.get().uri("https://v6.exchangerate-api.com/v6/{key}/latest/USD",key)
            .retrieve().body(new ParameterizedTypeReference<Map<String,Object>>() {});
    }
    public synchronized Rates latest() {
        Instant now = clock.instant();
        if (now.isBefore(retryAt)) {
            if (cached != null) {
                boolean stale = now.isAfter(cached.updatedAt().plus(Duration.ofHours(6)));
                return stale ? new Rates(cached.base(), cached.rates(), cached.updatedAt(), true) : cached;
            }
            throw unavailable();
        }
        try {
            if (!key.isBlank()) {
                var data = fetch();
                if (data != null && "success".equals(data.get("result")) && "USD".equals(data.get("base_code"))) {
                    var raw = (Map<?, ?>) data.get("conversion_rates");
                    if (raw != null) {
                        var values = new LinkedHashMap<String, BigDecimal>();
                        for (Map.Entry<?, ?> entry : raw.entrySet()) {
                            try {
                                BigDecimal val = new BigDecimal(entry.getValue().toString());
                                if (val.signum() > 0) {
                                    values.put(entry.getKey().toString(), val);
                                }
                            } catch (Exception ignored) {}
                        }
                        if (values.containsKey("LKR") && values.containsKey("USD")) {
                            Instant updated = Instant.ofEpochSecond(((Number) data.get("time_last_update_unix")).longValue());
                            cached = new Rates("USD", Collections.unmodifiableMap(values), updated, false);
                            retryAt = now.plus(Duration.ofHours(6));
                            return cached;
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // backoff retry
        }

        retryAt = now.plusSeconds(60);
        if (cached != null) {
            return new Rates(cached.base(), cached.rates(), cached.updatedAt(), true);
        }
        throw unavailable();
    }

    private Map<String, BigDecimal> defaultRates() {
        Map<String, BigDecimal> m = new LinkedHashMap<>();
        m.put("USD", new BigDecimal("1.0000"));
        m.put("LKR", new BigDecimal("305.5000"));
        m.put("EUR", new BigDecimal("0.9200"));
        m.put("GBP", new BigDecimal("0.7800"));
        m.put("AUD", new BigDecimal("1.5200"));
        m.put("INR", new BigDecimal("83.4000"));
        m.put("JPY", new BigDecimal("155.2000"));
        m.put("CAD", new BigDecimal("1.3600"));
        m.put("SGD", new BigDecimal("1.3500"));
        m.put("CHF", new BigDecimal("0.9100"));
        m.put("CNY", new BigDecimal("7.2400"));
        m.put("NZD", new BigDecimal("1.6400"));
        m.put("AED", new BigDecimal("3.6700"));
        m.put("SAR", new BigDecimal("3.7500"));
        m.put("MYR", new BigDecimal("4.7000"));
        m.put("THB", new BigDecimal("36.8000"));
        m.put("KRW", new BigDecimal("1370.0000"));
        m.put("QAR", new BigDecimal("3.6400"));
        m.put("KWD", new BigDecimal("0.3100"));
        m.put("BHD", new BigDecimal("0.3800"));
        m.put("OMR", new BigDecimal("0.3800"));
        m.put("ZAR", new BigDecimal("18.5000"));
        m.put("HKD", new BigDecimal("7.8200"));
        return m;
    }
    private ResponseStatusException unavailable() { return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Exchange rates are temporarily unavailable"); }
}
