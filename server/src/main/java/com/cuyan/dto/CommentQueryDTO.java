package com.cuyan.dto;

import com.cuyan.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CommentQueryDTO extends PageQuery {

    private Long vocabularyId;

    private Long materialId;

    private Long userId;

    private Integer status;

    private String keyword;
}
