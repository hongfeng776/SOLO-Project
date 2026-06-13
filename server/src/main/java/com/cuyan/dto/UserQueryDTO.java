package com.cuyan.dto;

import com.cuyan.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserQueryDTO extends PageQuery {

    private String username;

    private Integer status;
}
