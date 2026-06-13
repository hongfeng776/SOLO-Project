package com.cuyan.dto;

import lombok.Data;

@Data
public class MaterialUpdateDTO {

    private Long id;

    private Long vocabularyId;

    private String title;

    private String content;

    private String materialType;

    private String source;

    private Integer difficulty;

    private Integer status;
}
