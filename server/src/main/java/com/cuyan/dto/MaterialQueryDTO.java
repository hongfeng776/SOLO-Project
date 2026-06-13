package com.cuyan.dto;

import com.cuyan.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MaterialQueryDTO extends PageQuery {

    private String title;

    private Long vocabularyId;

    private String materialType;

    private Integer difficulty;

    private Integer status;

    private Long creatorId;
}
