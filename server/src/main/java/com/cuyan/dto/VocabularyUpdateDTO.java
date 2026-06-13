package com.cuyan.dto;

import lombok.Data;

@Data
public class VocabularyUpdateDTO {

    private Long id;

    private String word;

    private String phonetic;

    private String partOfSpeech;

    private String definition;

    private String example;

    private String translation;

    private Integer status;
}
