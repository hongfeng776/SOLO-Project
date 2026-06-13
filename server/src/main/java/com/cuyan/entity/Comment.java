package com.cuyan.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_comment")
public class Comment {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long vocabularyId;

    private Long materialId;

    private Long userId;

    private String content;

    private Integer likes;

    private Integer status;

    @TableField(exist = false)
    private String vocabularyWord;

    @TableField(exist = false)
    private String materialTitle;

    @TableField(exist = false)
    private String userName;

    @TableLogic
    private Integer deleted;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
