package com.cuyan.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MaterialVO {

    private Long id;

    private Long vocabularyId;

    private String title;

    private String content;

    private String materialType;

    private String source;

    private Integer difficulty;

    private Long creatorId;

    private Integer status;

    private String vocabularyWord;

    private String creatorName;

    private Integer commentCount;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
