package com.smartbank.smartbank_api.repository;

import com.smartbank.smartbank_api.entity.Card;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;

public interface CardRepository extends JpaRepository<Card, Integer> {
    @Query("select c from Card c where c.user.userId = :userId or (c.account is not null and c.account.customer.user.userId = :userId)")
    Page<Card> findByUserId(@Param("userId") Integer userId, Pageable pageable);

    @Query("select c from Card c where c.cardId = :id and (c.user.userId = :userId or (c.account is not null and c.account.customer.user.userId = :userId))")
    Optional<Card> findByCardIdAndUserId(@Param("id") Integer id, @Param("userId") Integer userId);

    Page<Card> findByStatus(String status, Pageable pageable);

    boolean existsByAccount_AccountIdAndCardTypeAndStatusIn(Integer accountId, String type, Collection<String> statuses);

    @Query("select count(c) > 0 from Card c where (c.user.userId = :userId or (c.account is not null and c.account.customer.user.userId = :userId)) and c.cardType = :type and c.status in :statuses")
    boolean existsByUserIdAndCardTypeAndStatusIn(@Param("userId") Integer userId, @Param("type") String type, @Param("statuses") Collection<String> statuses);

    List<Card> findTop100ByStatusInAndExpiryDateBefore(Collection<String> statuses, LocalDate today);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Card c where c.cardId = :id")
    Optional<Card> lockById(@Param("id") Integer id);
}

