package com.cuyan.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VocabularyVO {

    private Long id;

    private String word;

    private String phonetic;

    private String partOfSpeech;

    private String definition;

    private String example;

    private String translation;

    private Integer difficulty;

    private String bookName;

    private Long creatorId;

    private Integer status;

    private String creatorName;

    private Integer materialCount;

    private Integer commentCount;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
