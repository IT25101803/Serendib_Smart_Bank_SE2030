package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.TransactionRecord;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface TransactionRecordRepository extends JpaRepository<TransactionRecord,Integer> {
Optional<TransactionRecord> findByInitiatedBy_UserIdAndIdempotencyKey(Integer userId,String key);
@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select t from TransactionRecord t where t.transactionId=:id") Optional<TransactionRecord> lockById(@Param("id") Integer id);
@Query("select t from TransactionRecord t left join t.fromAccount f left join f.customer fc left join t.toAccount d left join d.customer dc where (fc.user.userId=:userId or dc.user.userId=:userId) and (:type is null or t.transactionType=:type) and (:status is null or t.status=:status) and (cast(:since as LocalDateTime) is null or t.createdAt>=:since) and (cast(:until as LocalDateTime) is null or t.createdAt<:until) and (:search is null or lower(t.description) like lower(concat('%',cast(:search as String),'%')))") Page<TransactionRecord> search(@Param("userId") Integer userId,@Param("type") String type,@Param("status") String status,@Param("since") LocalDateTime since,@Param("until") LocalDateTime until,@Param("search") String search,Pageable pageable);
List<TransactionRecord> findTop100ByStatusAndAuthorizationExpiresAtBefore(String status,LocalDateTime now);
}
