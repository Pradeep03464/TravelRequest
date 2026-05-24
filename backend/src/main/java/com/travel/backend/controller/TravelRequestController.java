package com.travel.backend.controller;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.travel.backend.entity.RequestStatus;
import com.travel.backend.entity.TravelRequest;
import com.travel.backend.entity.User;
import com.travel.backend.payload.response.TravelRequestWithUserDTO;
import com.travel.backend.repository.TravelRequestRepository;
import com.travel.backend.repository.UserRepository;
import com.travel.backend.service.EmailService;
import com.travel.backend.service.FileStorageService;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/requests")
public class TravelRequestController {

    @Autowired
    TravelRequestRepository travelRequestRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    FileStorageService fileStorageService;

    @Autowired
    EmailService emailService;

    @PersistenceContext
    private EntityManager entityManager;

    // EMPLOYEE: Create a request
    @PostMapping("/{employeeId}")
    public ResponseEntity<?> createRequest(@PathVariable Long employeeId, @RequestBody TravelRequest request) {
        User employee = userRepository.findById(employeeId).orElse(null);
        if (employee == null) {
            return ResponseEntity.badRequest().body("Employee not found");
        }
        request.setEmployee(employee);
        request.setStatus(RequestStatus.SUBMITTED);
        travelRequestRepository.save(request);
        return ResponseEntity.ok(travelRequestRepository.findById(request.getId()).orElse(request));
    }

    // EMPLOYEE: Get their requests
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getEmployeeRequests(@PathVariable Long employeeId) {
        List<TravelRequest> requests = travelRequestRepository.findByEmployeeId(employeeId);
        return ResponseEntity.ok(requests);
    }

    // MANAGER / ADMIN: Get all requests
    @GetMapping
    public ResponseEntity<?> getAllRequests() {
        return ResponseEntity.ok(travelRequestRepository.findAll());
    }

    // MANAGER: Approve or Reject
    @PutMapping("/{requestId}/manager")
    public ResponseEntity<?> managerUpdate(@PathVariable Long requestId, @RequestBody TravelRequest update) {
        TravelRequest req = travelRequestRepository.findById(requestId).orElse(null);
        if (req == null)
            return ResponseEntity.badRequest().body("Request not found");

        if (update.getStatus() == RequestStatus.APPROVED || update.getStatus() == RequestStatus.REJECTED) {
            req.setStatus(update.getStatus());
            req.setManagerComments(update.getManagerComments());
            travelRequestRepository.save(req);
            return ResponseEntity.ok(req);
        }
        return ResponseEntity.badRequest().body("Invalid Status");
    }


    // ADMIN: Complete fulfillment (PNR + Tickets + Status)
    @PostMapping("/{requestId}/fulfillment")
    public ResponseEntity<?> fulfillRequest(
            @PathVariable Long requestId,
            @RequestParam(value = "pnr", required = false) String pnr,
            @RequestParam(value = "returnPnr", required = false) String returnPnr,
            @RequestParam(value = "agency", required = false) String agency,
            @RequestParam(value = "cost", required = false) Double cost,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "returnFile", required = false) MultipartFile returnFile) {
        
        System.out.println(">>> Fulfillment Request Received for ID: " + requestId);
        System.out.println(">>> PNR: " + pnr + ", Cost: " + cost);

        TravelRequest req = travelRequestRepository.findById(requestId).orElse(null);
        if (req == null) {
            System.out.println(">>> Request NOT FOUND for ID: " + requestId);
            return ResponseEntity.badRequest().body("Request not found");
        }

        try {
            // Update Text Fields
            if (pnr != null) req.setPnr(pnr);
            if (returnPnr != null) req.setReturnPnr(returnPnr);
            if (agency != null) req.setAgency(agency);
            if (cost != null) req.setCost(cost);
            
            req.setStatus(RequestStatus.BOOKED);

            // Update Files
            if (file != null && !file.isEmpty()) {
                String filename = fileStorageService.storeFile(file, "ticket_dep_" + requestId);
                req.setTicketPath(filename);
                req.setTicketContentType(file.getContentType());
            }

            if (returnFile != null && !returnFile.isEmpty()) {
                String filename = fileStorageService.storeFile(returnFile, "ticket_ret_" + requestId);
                req.setReturnTicketPath(filename);
                req.setReturnTicketContentType(returnFile.getContentType());
            }

            travelRequestRepository.save(req);

            // Notify via email - Run in a separate thread to ensure immediate UI response
            final TravelRequest finalReq = req;
            new Thread(() -> {
                try {
                    emailService.sendTicketNotification(finalReq);
                } catch (Exception mailEx) {
                    System.err.println(">>> Background Email failed: " + mailEx.getMessage());
                }
            }).start();

            return ResponseEntity.ok(req);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Fulfillment failed: " + ex.getMessage());
        }
    }

    // Anyone can download the ticket file for an existing request
    @GetMapping("/{requestId}/ticket")
    public ResponseEntity<?> downloadTicket(@PathVariable Long requestId) {
        TravelRequest req = travelRequestRepository.findById(requestId).orElse(null);
        if (req == null || req.getTicketPath() == null) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = fileStorageService.loadAsResource(req.getTicketPath());
        String contentType = req.getTicketContentType() != null ? req.getTicketContentType() : "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + req.getTicketPath() + "\"")
                .body(resource);
    }

    @GetMapping("/{requestId}/return-ticket")
    public ResponseEntity<?> downloadReturnTicket(@PathVariable Long requestId) {
        TravelRequest req = travelRequestRepository.findById(requestId).orElse(null);
        if (req == null || req.getReturnTicketPath() == null) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = fileStorageService.loadAsResource(req.getReturnTicketPath());
        String contentType = req.getReturnTicketContentType() != null ? req.getReturnTicketContentType() : "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + req.getReturnTicketPath() + "\"")
                .body(resource);
    }

    // DYNAMIC SEARCH endpoint: list requests with optional filters + join type
    @GetMapping("/search")
    public ResponseEntity<?> searchRequests(
            @RequestParam(value = "employeeName", required = false) String employeeName,
            @RequestParam(value = "fromLocation", required = false) String fromLocation,
            @RequestParam(value = "toLocation", required = false) String toLocation,
            @RequestParam(value = "travelMode", required = false) String travelMode,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "departureDate", required = false) String departureDateStr,
            @RequestParam(value = "departureDateFrom", required = false) String departureDateFromStr,
            @RequestParam(value = "departureDateTo", required = false) String departureDateToStr,
            @RequestParam(value = "returnDateFrom", required = false) String returnDateFromStr,
            @RequestParam(value = "returnDateTo", required = false) String returnDateToStr,
            @RequestParam(value = "preferredTime", required = false) String preferredTime,
            @RequestParam(value = "preferredReturnTime", required = false) String preferredReturnTime,
            @RequestParam(value = "joinType", required = false, defaultValue = "INNER") String joinType) {

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<TravelRequest> cq = cb.createQuery(TravelRequest.class);
        Root<TravelRequest> root = cq.from(TravelRequest.class);

        Join<TravelRequest, User> employeeJoin = root.join("employee",
                "LEFT".equalsIgnoreCase(joinType) ? JoinType.LEFT : JoinType.INNER);

        List<Predicate> predicates = new ArrayList<>();

        if (employeeName != null && !employeeName.isBlank()) {
            predicates.add(cb.like(cb.lower(employeeJoin.get("name")), "%" + employeeName.toLowerCase() + "%"));
        }
        if (fromLocation != null && !fromLocation.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("fromLocation")), fromLocation.toLowerCase()));
        }
        if (toLocation != null && !toLocation.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("toLocation")), toLocation.toLowerCase()));
        }
        if (travelMode != null && !travelMode.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("travelMode")), travelMode.toLowerCase()));
        }
        if (status != null && !status.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
        }
        if (preferredTime != null && !preferredTime.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("preferredTime")), preferredTime.toLowerCase()));
        }
        if (preferredReturnTime != null && !preferredReturnTime.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("preferredReturnTime")), preferredReturnTime.toLowerCase()));
        }

        LocalDate depDate = parseDate(departureDateStr);
        LocalDate depFromDate = parseDate(departureDateFromStr);
        LocalDate depToDate = parseDate(departureDateToStr);
        LocalDate retFromDate = parseDate(returnDateFromStr);
        LocalDate retToDate = parseDate(returnDateToStr);

        if (depDate != null) {
            predicates.add(cb.equal(root.get("departureDate"), depDate));
        }
        if (depFromDate != null && depToDate != null) {
            predicates.add(cb.between(root.get("departureDate"), depFromDate, depToDate));
        } else if (depFromDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("departureDate"), depFromDate));
        } else if (depToDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("departureDate"), depToDate));
        }

        if (retFromDate != null && retToDate != null) {
            predicates.add(cb.between(root.get("returnDate"), retFromDate, retToDate));
        } else if (retFromDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("returnDate"), retFromDate));
        } else if (retToDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("returnDate"), retToDate));
        }

        cq.select(root).where(predicates.toArray(new Predicate[0]));

        List<TravelRequest> result = entityManager.createQuery(cq).getResultList();
        return ResponseEntity.ok(result);
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    // JOIN endpoint: Get all travel requests with user information (JPQL JOIN)
    @GetMapping("/joined")
    public ResponseEntity<?> getAllRequestsWithUserJoin() {
        List<TravelRequest> requests = travelRequestRepository.findAllWithUserJoin();
        return ResponseEntity.ok(requests);
    }

    // JOIN endpoint: Get travel requests for specific employee with explicit JOIN
    @GetMapping("/employee/{employeeId}/joined")
    public ResponseEntity<?> getEmployeeRequestsWithJoin(@PathVariable Long employeeId) {
        List<TravelRequest> requests = travelRequestRepository.findByEmployeeIdWithJoin(employeeId);
        return ResponseEntity.ok(requests);
    }

    // JOIN endpoint: Get raw joined data with user details (Native SQL)
    @GetMapping("/joined-details")
    public ResponseEntity<?> getAllRequestsWithUserDetails() {
        List<Object[]> results = travelRequestRepository.findAllRequestsWithUserDetails();

        // Convert Object[] results to a more readable format
        List<String> formattedResults = results.stream()
            .map(row -> String.format("Request ID: %s, Employee: %s (%s), Role: %s",
                row[0], row[1], row[2], row[3]))
            .toList();

        return ResponseEntity.ok(formattedResults);
    }

    // JOIN endpoint: Get all travel requests with user data as DTO
    @GetMapping("/joined-dto")
    public ResponseEntity<?> getAllRequestsJoinedWithUser() {
        List<TravelRequestWithUserDTO> results = travelRequestRepository.findAllRequestsJoinedWithUser();
        return ResponseEntity.ok(results);
    }
}
