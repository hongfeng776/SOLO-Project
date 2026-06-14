package com.zhiqin.recruitment.common;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class EnterpriseDetailVO {

    private Long id;
    private String name;
    private String unifiedCode;
    private String contactName;
    private String contactPhone;
    private String email;
    private String address;
    private String industry;
    private String scale;
    private String licenseNo;
    private String licenseType;
    private String legalPerson;
    private String registeredCapital;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate establishedDate;

    private String businessScope;
    private String qualificationName;
    private String qualificationNo;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate qualificationExpiry;

    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime entryTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    private Integer positionCount;
    private Integer activePositionCount;
    private Integer resumeCount;

}
