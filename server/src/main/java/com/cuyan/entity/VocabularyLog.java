package com.cuyan.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_vocabulary_log")
public class VocabularyLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long vocabularyId;

    private String vocabularyWord;

    private String operationType;

    private Integer oldStatus;

    private Integer newStatus;

    private Long operatorId;

    private String operatorName;

    private String remark;

    @TableLogic
    private Integer deleted;

    private LocalDateTime createTime;
}
