package com.cuyan.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VocabularyCreateDTO {

    @NotBlank(message = "单词不能为空")
    private String word;

    private String phonetic;

    private String partOfSpeech;

    @NotBlank(message = "释义不能为空")
    private String definition;

    private String example;

    @NotBlank(message = "翻译不能为空")
    private String translation;

    private Integer status;
}
