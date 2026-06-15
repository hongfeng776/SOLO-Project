package com.cuyan.dto;

import com.cuyan.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserQueryDTO extends PageQuery {

    private String username;

    private Integer status;

    private String keyword;

    private LocalDateTime createTimeStart;

    private LocalDateTime createTimeEnd;

    private Integer learnedWordsMin;

    private Integer learnedWordsMax;

    private Integer studyDaysMin;

    private Integer studyDaysMax;

    private Integer activityLevel;
}
