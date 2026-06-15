package com.zhiqin.recruitment.common;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class BatchStatusDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<Long> ids;

    private Integer status;

}
