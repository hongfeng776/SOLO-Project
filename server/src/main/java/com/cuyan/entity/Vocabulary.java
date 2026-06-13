package com.cuyan.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_vocabulary")
public class Vocabulary {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String word;

    private String phonetic;

    private String partOfSpeech;

    private String definition;

    private String example;

    private String translation;

    private Long creatorId;

    private Integer status;

    @TableField(exist = false)
    private String creatorName;

    @TableField(exist = false)
    private Integer materialCount;

    @TableField(exist = false)
    private Integer commentCount;

    @TableLogic
    private Integer deleted;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
