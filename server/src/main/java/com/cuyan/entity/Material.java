package com.cuyan.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_material")
public class Material {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long vocabularyId;

    private String title;

    private String content;

    private String materialType;

    private String source;

    private Integer difficulty;

    private Long creatorId;

    private Integer status;

    @TableField(exist = false)
    private String vocabularyWord;

    @TableField(exist = false)
    private String creatorName;

    @TableField(exist = false)
    private Integer commentCount;

    @TableLogic
    private Integer deleted;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
