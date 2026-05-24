package com.travel.backend.repository;

import com.travel.backend.entity.TravelRequest;
import com.travel.backend.payload.response.TravelRequestWithUserDTO;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface TravelRequestRepository extends JpaRepository<TravelRequest, Long> {
    List<TravelRequest> findByEmployeeId(Long employeeId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM travel_requests WHERE employee_id = :employeeId", nativeQuery = true)
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);

    // Custom JOIN query to get travel requests with user information
    @Query("SELECT tr FROM TravelRequest tr JOIN tr.employee u")
    List<TravelRequest> findAllWithUserJoin();

    // JOIN query with specific user fields
    @Query("SELECT tr FROM TravelRequest tr JOIN tr.employee u WHERE u.id = :employeeId")
    List<TravelRequest> findByEmployeeIdWithJoin(@Param("employeeId") Long employeeId);

    // Native SQL JOIN query for more complex operations
    @Query(value = "SELECT tr.*, u.name, u.email, u.role FROM travel_requests tr " +
                   "INNER JOIN users u ON tr.employee_id = u.employee_id", nativeQuery = true)
    List<Object[]> findAllRequestsWithUserDetails();

    // JOIN query returning DTO with selected fields
    @Query("SELECT new com.travel.backend.payload.response.TravelRequestWithUserDTO(" +
           "tr.id, u.name, u.email, CAST(u.role AS string), tr.travelType, tr.fromLocation, tr.toLocation, " +
           "tr.travelMode, CAST(tr.departureDate AS string), CAST(tr.returnDate AS string), " +
           "CAST(tr.status AS string), tr.purpose) " +
           "FROM TravelRequest tr JOIN tr.employee u")
    List<TravelRequestWithUserDTO> findAllRequestsJoinedWithUser();
}