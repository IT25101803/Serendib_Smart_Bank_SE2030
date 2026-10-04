package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.FixedDeposit;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface FixedDepositRepository extends JpaRepository<FixedDeposit,Integer> {
Page<FixedDeposit> findByAccount_Customer_User_UserId(Integer userId,Pageable pageable);
Optional<FixedDeposit> findByFixedDepositIdAndAccount_Customer_User_UserId(Integer id,Integer userId);
Optional<FixedDeposit> findByOpeningTransaction_TransactionId(Integer id);
Optional<FixedDeposit> findByClosingTransaction_TransactionId(Integer id);
Page<FixedDeposit> findByStatus(String status, Pageable pageable);
@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select f from FixedDeposit f where f.fixedDepositId=:id") Optional<FixedDeposit> lockById(@Param("id") Integer id);
List<FixedDeposit> findTop100ByStatusAndMaturityDateLessThanEqual(String status,LocalDate today);
}
