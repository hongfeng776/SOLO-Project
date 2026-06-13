package com.cuyan.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ViolationVO {

    private Long id;

    private Long userId;

    private String targetType;

    private Long targetId;

    private String reason;

    private String description;

    private Integer status;

    private Long handlerId;

    private String handleResult;

    private String userName;

    private String handlerName;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
