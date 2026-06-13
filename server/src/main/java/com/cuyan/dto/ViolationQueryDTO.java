package com.cuyan.dto;

import com.cuyan.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ViolationQueryDTO extends PageQuery {

    private Long userId;

    private String targetType;

    private Integer status;

    private Long handlerId;
}
