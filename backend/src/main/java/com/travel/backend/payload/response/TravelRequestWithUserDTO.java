package com.travel.backend.payload.response;

public class TravelRequestWithUserDTO {
    private Long requestId;
    private String employeeName;
    private String employeeEmail;
    private String employeeRole;
    private String travelType;
    private String fromLocation;
    private String toLocation;
    private String travelMode;
    private String departureDate;
    private String returnDate;
    private String status;
    private String purpose;

    public TravelRequestWithUserDTO() {}

    public TravelRequestWithUserDTO(Long requestId, String employeeName, String employeeEmail,
                                   String employeeRole, String travelType, String fromLocation,
                                   String toLocation, String travelMode, String departureDate,
                                   String returnDate, String status, String purpose) {
        this.requestId = requestId;
        this.employeeName = employeeName;
        this.employeeEmail = employeeEmail;
        this.employeeRole = employeeRole;
        this.travelType = travelType;
        this.fromLocation = fromLocation;
        this.toLocation = toLocation;
        this.travelMode = travelMode;
        this.departureDate = departureDate;
        this.returnDate = returnDate;
        this.status = status;
        this.purpose = purpose;
    }

    // Getters and Setters
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeEmail() { return employeeEmail; }
    public void setEmployeeEmail(String employeeEmail) { this.employeeEmail = employeeEmail; }

    public String getEmployeeRole() { return employeeRole; }
    public void setEmployeeRole(String employeeRole) { this.employeeRole = employeeRole; }

    public String getTravelType() { return travelType; }
    public void setTravelType(String travelType) { this.travelType = travelType; }

    public String getFromLocation() { return fromLocation; }
    public void setFromLocation(String fromLocation) { this.fromLocation = fromLocation; }

    public String getToLocation() { return toLocation; }
    public void setToLocation(String toLocation) { this.toLocation = toLocation; }

    public String getTravelMode() { return travelMode; }
    public void setTravelMode(String travelMode) { this.travelMode = travelMode; }

    public String getDepartureDate() { return departureDate; }
    public void setDepartureDate(String departureDate) { this.departureDate = departureDate; }

    public String getReturnDate() { return returnDate; }
    public void setReturnDate(String returnDate) { this.returnDate = returnDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}