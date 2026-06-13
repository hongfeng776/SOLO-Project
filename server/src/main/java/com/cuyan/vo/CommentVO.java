package com.cuyan.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommentVO {

    private Long id;

    private Long vocabularyId;

    private Long materialId;

    private Long userId;

    private String content;

    private Integer likes;

    private Integer status;

    private String vocabularyWord;

    private String materialTitle;

    private String userName;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
