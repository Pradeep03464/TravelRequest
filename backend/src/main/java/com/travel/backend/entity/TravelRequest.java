package com.travel.backend.entity;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
@Table(name = "travel_requests")
public class TravelRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(nullable = false)
    private String travelType; // Local or International

    @Column(nullable = false)
    private String fromLocation;

    @Column(nullable = false)
    private String toLocation;

    @Column(nullable = false)
    private String travelMode; // Train, Bus, Flight

    @Column(nullable = false)
    private LocalDate departureDate;

    @Column(nullable = true)
    private LocalDate returnDate;

    @Column(nullable = true)
    private String tripType; // 'one-way' or 'round-trip'

    @Column(columnDefinition = "TEXT")
    private String purpose;

    @Column(nullable = true)
    private String preferredTime;

    @Column(nullable = true)
    private String preferredReturnTime;

    @Column(columnDefinition = "TEXT")
    private String employeeComments;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.SUBMITTED;

    @Column(columnDefinition = "TEXT")
    private String managerComments;

    // Booking Details added by Admin
    private String pnr;
    private String returnPnr;
    private String agency;
    private Double cost;
    private String ticketPath;
    private String ticketContentType;
    private String returnTicketPath;
    private String returnTicketContentType;

    public TravelRequest() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getEmployee() { return employee; }
    public void setEmployee(User employee) { this.employee = employee; }
    public String getTravelType() { return travelType; }
    public void setTravelType(String travelType) { this.travelType = travelType; }
    public String getFromLocation() { return fromLocation; }
    public void setFromLocation(String fromLocation) { this.fromLocation = fromLocation; }
    public String getToLocation() { return toLocation; }
    public void setToLocation(String toLocation) { this.toLocation = toLocation; }
    public String getTravelMode() { return travelMode; }
    public void setTravelMode(String travelMode) { this.travelMode = travelMode; }
    public LocalDate getDepartureDate() { return departureDate; }
    public void setDepartureDate(LocalDate departureDate) { this.departureDate = departureDate; }
    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }
    public String getTripType() { return tripType; }
    public void setTripType(String tripType) { this.tripType = tripType; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getPreferredTime() { return preferredTime; }
    public void setPreferredTime(String preferredTime) { this.preferredTime = preferredTime; }
    public String getPreferredReturnTime() { return preferredReturnTime; }
    public void setPreferredReturnTime(String preferredReturnTime) { this.preferredReturnTime = preferredReturnTime; }
    public String getEmployeeComments() { return employeeComments; }
    public void setEmployeeComments(String employeeComments) { this.employeeComments = employeeComments; }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }
    public String getManagerComments() { return managerComments; }
    public void setManagerComments(String managerComments) { this.managerComments = managerComments; }
    public String getPnr() { return pnr; }
    public void setPnr(String pnr) { this.pnr = pnr; }
    public String getReturnPnr() { return returnPnr; }
    public void setReturnPnr(String returnPnr) { this.returnPnr = returnPnr; }
    public String getAgency() { return agency; }
    public void setAgency(String agency) { this.agency = agency; }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
    public String getTicketPath() { return ticketPath; }
    public void setTicketPath(String ticketPath) { this.ticketPath = ticketPath; }
    public String getTicketContentType() { return ticketContentType; }
    public void setTicketContentType(String ticketContentType) { this.ticketContentType = ticketContentType; }
    public String getReturnTicketPath() { return returnTicketPath; }
    public void setReturnTicketPath(String returnTicketPath) { this.returnTicketPath = returnTicketPath; }
    public String getReturnTicketContentType() { return returnTicketContentType; }
    public void setReturnTicketContentType(String returnTicketContentType) { this.returnTicketContentType = returnTicketContentType; }
}
