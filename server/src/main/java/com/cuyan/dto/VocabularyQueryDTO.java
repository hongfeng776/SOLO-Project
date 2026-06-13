package com.cuyan.dto;

import com.cuyan.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class VocabularyQueryDTO extends PageQuery {

    private String word;

    private String partOfSpeech;

    private Integer status;

    private Long creatorId;
}
